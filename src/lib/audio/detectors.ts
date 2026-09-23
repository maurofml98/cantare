/**
 * Detectores do motor de treino. Cada exercício declara quais modos usa (ver
 * `src/lib/treinos/exercises.ts`); `createAnalysis` monta só os detectores pedidos.
 * Puro (sem Web Audio): recebe quadros de `levels.ts` e é testável em Node.
 *
 * Nada aqui é dB absoluto: microfone de celular não é calibrado e o ganho muda por
 * aparelho. Tudo é relativo ao ruído da sala (calibração) ou ao início da própria emissão.
 */
import { activityDb, signalDb, type Calibration, type Frame } from './levels';
import { freqToMidi } from './pitch';

export type DetectMode =
  /** duração de emissão contínua, com ou sem altura ("S", "X", "VU", "HUM") */
  | 'sustain'
  /** contagem de pulsos por ataque no envelope (S pulsado, finger kazoo, sapo) */
  | 'pulses'
  /** curva de intensidade relativa ao início da emissão (messa di voce) */
  | 'intensity'
  /** altura (escalas, grave) */
  | 'pitch'
  /** cronômetro com início e fim pela voz (trava-línguas) */
  | 'timer';

/* ---------------- duração de emissão contínua ---------------- */

export interface SustainResult {
  /** trechos de emissão [início, fim] em segundos */
  segments: [number, number][];
  /** duração do primeiro trecho — "quebrou em X de Y" */
  firstSec: number;
  longestSec: number;
  /** do primeiro início ao último fim (cronômetro) */
  spanSec: number;
}

export class SustainDetector {
  private segs: [number, number][] = [];
  private start: number | null = null;
  private lastAbove = 0;

  /**
   * @param gapMs queda abaixo do limiar mais curta que isso não quebra a emissão
   *   (o chiado oscila; provisório, ajustar com voz real)
   * @param minSegMs trechos mais curtos que isso são descartados (tosse, clique)
   */
  constructor(private cal: Calibration, private gapMs = 250, private minSegMs = 300) {}

  push(f: Frame) {
    const a = activityDb(f, this.cal);
    if (this.start === null) {
      if (a >= this.cal.onDb) {
        this.start = f.t;
        this.lastAbove = f.t;
      }
    } else if (a >= this.cal.offDb) {
      this.lastAbove = f.t;
    } else if ((f.t - this.lastAbove) * 1000 > this.gapMs) {
      this.close();
    }
  }

  private close() {
    if (this.start !== null && (this.lastAbove - this.start) * 1000 >= this.minSegMs) this.segs.push([this.start, this.lastAbove]);
    this.start = null;
  }

  get emitting() {
    return this.start !== null;
  }

  /** duração do trecho atual, em segundos */
  get currentSec() {
    return this.start === null ? 0 : this.lastAbove - this.start;
  }

  result(): SustainResult {
    const segs = [...this.segs];
    if (this.start !== null && (this.lastAbove - this.start) * 1000 >= this.minSegMs) segs.push([this.start, this.lastAbove]);
    const dur = segs.map(([s, e]) => e - s);
    return {
      segments: segs,
      firstSec: dur[0] ?? 0,
      longestSec: dur.length ? Math.max(...dur) : 0,
      spanSec: segs.length ? segs[segs.length - 1][1] - segs[0][0] : 0,
    };
  }
}

/* ---------------- pulsos por ataque ---------------- */

export interface PulseResult {
  count: number;
  /** instante de cada ataque, em segundos */
  onsets: number[];
  meanIntervalMs: number | null;
  /** coeficiente de variação dos intervalos: 0 = metrônomo, > 0,3 = irregular */
  irregularity: number | null;
}

/*
 * Um pulso é uma subida de `riseDb` a partir do vale anterior. Não exige voltar ao silêncio:
 * no finger kazoo e no sapo a voz pode não parar entre um pulso e outro, só cair de volume.
 */
export class PulseDetector {
  private high = false;
  private min = 0;
  private max = 0;
  private onsets: number[] = [];

  /** Provisórios, ajustar com voz real. */
  constructor(private cal: Calibration, private riseDb = 6, private fallDb = 5, private minGapMs = 90) {}

  push(f: Frame) {
    const a = activityDb(f, this.cal);
    if (!this.high) {
      this.min = Math.min(this.min, a);
      const last = this.onsets[this.onsets.length - 1] ?? -Infinity;
      if (a >= this.cal.onDb && a - this.min >= this.riseDb && (f.t - last) * 1000 >= this.minGapMs) {
        this.onsets.push(f.t);
        this.high = true;
        this.max = a;
      }
    } else {
      this.max = Math.max(this.max, a);
      if (a <= this.max - this.fallDb || a < this.cal.offDb) {
        this.high = false;
        this.min = a;
      }
    }
  }

  get count() {
    return this.onsets.length;
  }

  result(): PulseResult {
    const o = this.onsets;
    const iv = o.slice(1).map((t, i) => (t - o[i]) * 1000);
    const mean = iv.length ? iv.reduce((s, v) => s + v, 0) / iv.length : null;
    const sd = mean !== null ? Math.sqrt(iv.reduce((s, v) => s + (v - mean) ** 2, 0) / iv.length) : null;
    return { count: o.length, onsets: [...o], meanIntervalMs: mean, irregularity: mean && sd !== null ? sd / mean : null };
  }
}

/* ---------------- curva de intensidade relativa ---------------- */

export interface IntensityResult {
  /** fim da emissão vs. início, em dB (positivo = cresceu) */
  riseDb: number | null;
  maxRiseDb: number | null;
  /** onde ficou o pico: 0 = início, 1 = fim */
  peakAt: number | null;
  /** fração dos passos de 250 ms em que o volume subiu */
  risingFrac: number | null;
  /** houve saturação: a curva perde o topo e o "crescimento" fica achatado */
  clipped: boolean;
  /** curva a 10 pontos/s: [segundos desde o início da emissão, dB relativo ao início] */
  curve: [number, number][];
}

const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

export class IntensityTracker {
  private pts: { t: number; db: number }[] = [];
  private clipped = false;

  constructor(private cal: Calibration) {}

  push(f: Frame) {
    if (activityDb(f, this.cal) < this.cal.offDb) return;
    if (f.peak >= 0.99) this.clipped = true;
    this.pts.push({ t: f.t, db: signalDb(f, this.cal) });
  }

  /** dB atual relativo ao início (para o visual ao vivo) */
  get currentDb(): number | null {
    const p = this.pts;
    if (p.length < 10) return null;
    const recent = p.slice(-6).map((x) => x.db);
    return median(recent) - this.baseline();
  }

  private baseline() {
    const t0 = this.pts[0].t;
    return median(this.pts.filter((p) => p.t - t0 <= 0.4).map((p) => p.db));
  }

  result(): IntensityResult {
    const p = this.pts;
    if (p.length < 10) return { riseDb: null, maxRiseDb: null, peakAt: null, risingFrac: null, clipped: this.clipped, curve: [] };
    const t0 = p[0].t;
    const dur = p[p.length - 1].t - t0 || 1;
    const base = this.baseline();
    // Médias de 100 ms: o quadro isolado oscila demais para servir de curva.
    const curve: [number, number][] = [];
    for (let w = 0; w * 0.1 <= dur; w++) {
      const bin = p.filter((x) => x.t - t0 >= w * 0.1 && x.t - t0 < (w + 1) * 0.1);
      if (bin.length) curve.push([+(w * 0.1).toFixed(1), +(median(bin.map((x) => x.db)) - base).toFixed(1)]);
    }
    const tail = curve.slice(Math.floor(curve.length * 0.8)).map((c) => c[1]);
    let peak = curve[0];
    for (const c of curve) if (c[1] > peak[1]) peak = c;
    const steps = curve.filter((_, i) => i % 3 === 0 || i === curve.length - 1);
    const ups = steps.slice(1).filter((c, i) => c[1] > steps[i][1] + 0.5).length;
    return {
      riseDb: +median(tail).toFixed(1),
      maxRiseDb: peak[1],
      peakAt: +(peak[0] / dur).toFixed(2),
      risingFrac: steps.length > 1 ? +(ups / (steps.length - 1)).toFixed(2) : null,
      clipped: this.clipped,
      curve,
    };
  }
}

/* ---------------- altura ---------------- */

export interface PitchResult {
  /** leituras com altura / leituras com emissão */
  pitchedFrac: number | null;
  medianMidi: number | null;
  lowestMidi: number | null;
  highestMidi: number | null;
  /** notas estáveis na ordem em que apareceram, sem repetição consecutiva (confere escala) */
  stableNotes: number[];
}

/*
 * Nota estável (CLAUDE.md, seção 9): leituras em 420 ms todas a ±0,7 semitom da mediana.
 * A seção fala em 8+ leituras; a altura é calculada a cada ~50 ms (custo em celular
 * simples), então o mínimo aqui é 6.
 */
const STABLE_WINDOW_S = 0.42;
const STABLE_TOL = 0.7;
const MIN_STABLE_READS = 6;

export class PitchTracker {
  private reads: { t: number; midi: number | null }[] = [];
  private stable: number[] = [];
  private window: { t: number; midi: number }[] = [];
  private emitting = 0;
  live: { midi: number | null; stableMidi: number | null } = { midi: null, stableMidi: null };

  constructor(private cal: Calibration) {}

  push(f: Frame) {
    if (f.hz === undefined) return;
    const emitting = activityDb(f, this.cal) >= this.cal.offDb;
    if (emitting) this.emitting++;
    const midi = f.hz && f.hz > 0 ? freqToMidi(f.hz) : null;
    this.live.midi = midi;
    if (midi === null) {
      this.live.stableMidi = null;
      return;
    }
    this.reads.push({ t: f.t, midi });
    this.window.push({ t: f.t, midi });
    while (this.window.length && this.window[0].t < f.t - STABLE_WINDOW_S) this.window.shift();
    const m = median(this.window.map((w) => w.midi));
    const ok = this.window.length >= MIN_STABLE_READS && this.window.every((w) => Math.abs(w.midi - m) <= STABLE_TOL);
    this.live.stableMidi = ok ? m : null;
    if (ok) {
      const note = Math.round(m);
      if (this.stable[this.stable.length - 1] !== note) this.stable.push(note);
    }
  }

  result(): PitchResult {
    const m = this.reads.map((r) => r.midi as number);
    const s = this.stable;
    return {
      pitchedFrac: this.emitting ? +Math.min(1, m.length / this.emitting).toFixed(2) : null,
      medianMidi: m.length ? +median(m).toFixed(2) : null,
      lowestMidi: s.length ? Math.min(...s) : null,
      highestMidi: s.length ? Math.max(...s) : null,
      stableNotes: [...s],
    };
  }
}

/* ---------------- composição por exercício ---------------- */

export interface AnalysisResult {
  sustain?: SustainResult;
  pulses?: PulseResult;
  intensity?: IntensityResult;
  pitch?: PitchResult;
  timer?: { sec: number };
}

/** Cronômetro: pausas entre palavras de até 600 ms não param a contagem. Provisório. */
const TIMER_GAP_MS = 600;

export function createAnalysis(modes: DetectMode[], cal: Calibration) {
  const sustain = modes.includes('sustain') ? new SustainDetector(cal) : null;
  const timer = modes.includes('timer') ? new SustainDetector(cal, TIMER_GAP_MS, 150) : null;
  const pulses = modes.includes('pulses') ? new PulseDetector(cal) : null;
  const intensity = modes.includes('intensity') ? new IntensityTracker(cal) : null;
  const pitch = modes.includes('pitch') ? new PitchTracker(cal) : null;
  return {
    sustain,
    timer,
    pulses,
    intensity,
    pitch,
    /** a altura só precisa ser calculada se algum modo usa */
    needsPitch: !!pitch,
    push(f: Frame) {
      sustain?.push(f);
      timer?.push(f);
      pulses?.push(f);
      intensity?.push(f);
      pitch?.push(f);
    },
    result(): AnalysisResult {
      return {
        ...(sustain && { sustain: sustain.result() }),
        ...(timer && { timer: { sec: +timer.result().spanSec.toFixed(2) } }),
        ...(pulses && { pulses: pulses.result() }),
        ...(intensity && { intensity: intensity.result() }),
        ...(pitch && { pitch: pitch.result() }),
      };
    },
  };
}

export type Analysis = ReturnType<typeof createAnalysis>;
