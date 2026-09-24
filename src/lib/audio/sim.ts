/**
 * Microfone simulado, SÓ PARA TESTES. Reproduz em Node o caminho de `mic.ts` — janela de
 * 2048 amostras, Blackman + FFT como o AnalyserNode (spec Web Audio, sem suavização),
 * bandas de `levels.ts`, altura a cada 50 ms — sobre áudio sintético com as adversidades que
 * o aparelho real produz: ruído de sala com picos, quedas de áudio, calibração ruim e
 * 30/60/120 quadros por segundo.
 *
 * Sem isso os testes alimentavam os detectores com envelopes limpos, e dois erros (pulso em
 * dobro, cronômetro esticado) só apareceram no navegador.
 */
import { bandLevels, calibrate, type Calibration, type Frame } from './levels';
import { detectPitch } from './pitch';
import { createAnalysis, type AnalysisResult, type DetectMode } from './detectors';

export const SR = 48000;
const FFT = 2048;
const PITCH_EVERY_S = 0.05;

/** PRNG determinístico: o mesmo teste gera sempre o mesmo "ruído". */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- áudio ---------------- */

export type Seg =
  /** ruído de fundo da sala (sempre presente, exceto em `zero`) */
  | { kind: 'floor'; dur: number }
  /** silêncio digital: o aparelho entrega zeros (gate do iOS, início do microfone) */
  | { kind: 'zero'; dur: number }
  /** chiado surdo ("S", "X"): ruído branco com passa-alta. `amp` ~0,25 = perto do celular */
  | { kind: 's'; dur: number; amp?: number; env?: (u: number) => number }
  /** voz com altura: harmônicos 1/k. `f0` fixo ou função do tempo (s desde o início do trecho) */
  | { kind: 'voice'; dur: number; f0: number | ((t: number) => number); amp?: number; env?: (u: number) => number; fundamental?: number };

export interface Adversity {
  /** nível do ruído de fundo (amplitude). Padrão 0,0015 (~ −60 dBFS) */
  floor?: number;
  /** picos do ruído: rajadas curtas (10–25 ms) a esta taxa por segundo, `spikeGain` × o fundo */
  spikesPerSec?: number;
  spikeGain?: number;
  /** quedas de áudio: [início, duração] em segundos — tudo vira zero (buffer perdido) */
  dropouts?: [number, number][];
  /** ganho do fundo a partir de `at` segundos (ar-condicionado ligou depois da calibração) */
  floorStep?: { at: number; gain: number };
  seed?: number;
}

export function render(segs: Seg[], adv: Adversity = {}): Float32Array {
  const rand = rng(adv.seed ?? 1);
  const total = Math.round(segs.reduce((s, g) => s + g.dur, 0) * SR);
  const out = new Float32Array(total);
  const floor = adv.floor ?? 0.0015;
  // picos: rajadas curtas em instantes aleatórios
  const spike = new Uint8Array(total);
  if (adv.spikesPerSec) {
    for (let t = 0; t < total / SR; t += (0.5 + rand()) / adv.spikesPerSec) spike.fill(1, Math.round(t * SR), Math.min(total, Math.round((t + 0.01 + rand() * 0.015) * SR)));
  }
  let i = 0;
  let prev = 0;
  let phase = 0;
  for (const g of segs) {
    const n = Math.round(g.dur * SR);
    for (let k = 0; k < n; k++, i++) {
      const t = i / SR;
      const w = rand() * 2 - 1;
      let v = 0;
      if (g.kind !== 'zero') {
        let fl = floor * (adv.floorStep && t >= adv.floorStep.at ? adv.floorStep.gain : 1);
        if (spike[i]) fl *= adv.spikeGain ?? 4;
        v += fl * w;
      }
      const u = k / n;
      if (g.kind === 's') v += (g.amp ?? 0.25) * (g.env?.(u) ?? 1) * (w - prev) * 0.5;
      if (g.kind === 'voice') {
        const f0 = typeof g.f0 === 'number' ? g.f0 : g.f0(k / SR);
        phase += (2 * Math.PI * f0) / SR;
        let s = (g.fundamental ?? 1) * Math.sin(phase);
        for (let h = 2; h <= 8; h++) s += Math.sin(h * phase) / h;
        v += (g.amp ?? 0.15) * (g.env?.(u) ?? 1) * s * 0.5;
      }
      prev = w;
      out[i] = Math.max(-1, Math.min(1, v));
    }
  }
  for (const [s, d] of adv.dropouts ?? []) out.fill(0, Math.round(s * SR), Math.min(total, Math.round((s + d) * SR)));
  return out;
}

/* ---------------- analisador ---------------- */

const blackman = Float64Array.from({ length: FFT }, (_, n) => {
  const x = (2 * Math.PI * n) / FFT;
  return 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x);
});

function fftMagDb(win: Float32Array): Float32Array {
  const re = new Float64Array(FFT);
  const im = new Float64Array(FFT);
  for (let i = 0; i < FFT; i++) re[i] = win[i] * blackman[i];
  for (let i = 1, j = 0; i < FFT; i++) {
    let bit = FFT >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j]] = [re[j], re[i]];
  }
  for (let len = 2; len <= FFT; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < FFT; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const c = Math.cos(ang * k);
        const s = Math.sin(ang * k);
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
  const db = new Float32Array(FFT / 2);
  for (let k = 0; k < FFT / 2; k++) {
    const mag = Math.hypot(re[k], im[k]) / FFT;
    db[k] = mag > 0 ? 20 * Math.log10(mag) : -Infinity;
  }
  return db;
}

/** Quadros como `mic.read` produziria lendo `audio` a `fps` quadros por segundo. */
export function frames(audio: Float32Array, fps: number, withPitch: boolean): Frame[] {
  const out: Frame[] = [];
  let lastPitch = -Infinity;
  for (let t = FFT / SR; t <= audio.length / SR; t += 1 / fps) {
    const end = Math.round(t * SR);
    const win = audio.subarray(end - FFT, end);
    let s2 = 0;
    let peak = 0;
    for (let i = 0; i < FFT; i++) {
      s2 += win[i] * win[i];
      peak = Math.max(peak, Math.abs(win[i]));
    }
    const f: Frame = { t, bands: bandLevels(fftMagDb(win), SR / FFT), rms: Math.sqrt(s2 / FFT), peak };
    if (withPitch && t - lastPitch >= PITCH_EVERY_S) {
      lastPitch = t;
      const hz = detectPitch(win, SR);
      f.hz = hz > 0 ? hz : null;
    }
    out.push(f);
  }
  return out;
}

/**
 * Como `useTreinoRun`: os primeiros `calSec` segundos calibram o ruído da sala, o resto é
 * a captura (tempo zerado no início dela).
 */
export function run(audio: Float32Array, modes: DetectMode[], fps: number, calSec = 2): { cal: Calibration | null; result: AnalysisResult | null } {
  const fr = frames(audio, fps, modes.includes('pitch'));
  const cal = calibrate(fr.filter((f) => f.t <= calSec));
  if (!cal) return { cal, result: null };
  const a = createAnalysis(modes, cal);
  const cap = fr.filter((f) => f.t > calSec);
  const t0 = cap[0]?.t ?? 0;
  for (const f of cap) a.push({ ...f, t: f.t - t0 });
  return { cal, result: a.result() };
}
