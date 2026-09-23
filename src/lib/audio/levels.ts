/**
 * Energia por banda e calibração do ruído da sala. Puro (sem Web Audio): testável em Node.
 *
 * Por que bandas e não um RMS único: "S" e "X" são surdos (sem altura) e a energia deles
 * fica acima de ~3 kHz. Fone Bluetooth em modo de chamada corta tudo acima de 4 kHz (ou
 * 8 kHz), e aí o chiado sobra só na faixa 1,5–4 kHz. Medindo cada banda contra o ruído da
 * própria sala e ficando com a que mais subiu, o mesmo detector serve para chiado, voz e
 * qualquer aparelho.
 */

/** Limites das bandas em Hz. Bandas acima da Nyquist do aparelho são ignoradas. */
export const BAND_EDGES = [80, 300, 1000, 2500, 5000, 9000, 14000];

/** Um quadro de análise. `bands` em dB (relativo à escala cheia), um valor por banda. */
export interface Frame {
  /** segundos desde o início da captura */
  t: number;
  bands: number[];
  /** RMS da forma de onda (−1..1) */
  rms: number;
  /** maior amostra absoluta — ≥ 0,99 indica saturação */
  peak: number;
  /** altura em Hz; null = sem altura; undefined = não calculada neste quadro */
  hz?: number | null;
}

export interface Calibration {
  /** ruído médio de cada banda, em dB */
  noiseDb: number[];
  /** limiar de entrada (dB acima do ruído) para considerar que há emissão */
  onDb: number;
  /** limiar de saída — histerese para o chiado oscilando não "quebrar" a emissão */
  offDb: number;
  /** percentil 95 da atividade durante o silêncio: o quanto o ruído da sala oscila */
  noiseSwingDb: number;
  /** nível total do ruído em dBFS */
  noiseLevelDb: number;
  quality: 'ok' | 'ruidoso' | 'instavel';
}

const FLOOR_DB = -120;
const toPow = (db: number) => (Number.isFinite(db) ? 10 ** (db / 10) : 0);
const toDb = (p: number) => (p > 0 ? Math.max(FLOOR_DB, 10 * Math.log10(p)) : FLOOR_DB);

/**
 * Soma a potência dos bins de `getFloatFrequencyData` (dB por bin) em cada banda.
 * `binHz` = sampleRate / fftSize.
 */
export function bandLevels(spectrumDb: Float32Array, binHz: number): number[] {
  const nyquist = spectrumDb.length * binHz;
  const out: number[] = [];
  for (let b = 0; b < BAND_EDGES.length - 1; b++) {
    const lo = BAND_EDGES[b];
    const hi = Math.min(BAND_EDGES[b + 1], nyquist * 0.95);
    if (hi <= lo) break;
    let p = 0;
    for (let i = Math.ceil(lo / binHz); i < Math.min(spectrumDb.length, hi / binHz); i++) p += toPow(spectrumDb[i]);
    out.push(toDb(p));
  }
  return out;
}

/** Quanto o quadro está acima do ruído, em dB, na banda que mais subiu. */
export function activityDb(frame: Frame, cal: Pick<Calibration, 'noiseDb'>): number {
  let best = -Infinity;
  const n = Math.min(frame.bands.length, cal.noiseDb.length);
  for (let b = 0; b < n; b++) {
    // Banda "morta" (aparelho não entrega nada ali): qualquer vazamento viraria atividade.
    if (cal.noiseDb[b] <= FLOOR_DB + 10) continue;
    best = Math.max(best, frame.bands[b] - cal.noiseDb[b]);
  }
  return Number.isFinite(best) ? best : 0;
}

/** Nível total do quadro já descontado o ruído médio, em dB. Base da curva de intensidade. */
export function signalDb(frame: Frame, cal: Pick<Calibration, 'noiseDb'>): number {
  let sig = 0;
  let noise = 0;
  for (let b = 0; b < Math.min(frame.bands.length, cal.noiseDb.length); b++) {
    sig += toPow(frame.bands[b]);
    noise += toPow(cal.noiseDb[b]);
  }
  return toDb(Math.max(sig - noise, sig * 0.01));
}

/*
 * Parâmetros provisórios — definidos sem voz real. Ajustar com os números do teste
 * (rota /lab/microfone). Não são conteúdo clínico; são do detector.
 */
/** Margem mínima acima do ruído para contar como emissão. */
const MIN_ON_DB = 8;
/** Somada à oscilação do ruído (p95) para o limiar de entrada. */
const SWING_MARGIN_DB = 4;
const HYSTERESIS_DB = 4;
/** Ruído de sala acima disso (dBFS, sem AGC) = ambiente ruim. */
const NOISY_LEVEL_DB = -45;
/** Oscilação acima disso = ruído variável (TV, conversa, trânsito). */
const UNSTABLE_SWING_DB = 8;

/** Calibra com ~2 s de silêncio. Precisa de pelo menos 20 quadros. */
export function calibrate(frames: Frame[]): Calibration | null {
  if (frames.length < 20) return null;
  // Descarta o começo: o clique do toque no botão e a abertura do microfone.
  const use = frames.slice(Math.floor(frames.length * 0.15));
  const nb = Math.min(...use.map((f) => f.bands.length));
  const noiseDb: number[] = [];
  for (let b = 0; b < nb; b++) noiseDb.push(toDb(use.reduce((s, f) => s + toPow(f.bands[b]), 0) / use.length));

  const act = use.map((f) => activityDb(f, { noiseDb })).sort((a, b) => a - b);
  const noiseSwingDb = act[Math.floor(act.length * 0.95)];
  const onDb = Math.max(MIN_ON_DB, noiseSwingDb + SWING_MARGIN_DB);
  const noiseLevelDb = toDb(noiseDb.reduce((s, d) => s + toPow(d), 0));
  const quality = noiseSwingDb > UNSTABLE_SWING_DB ? 'instavel' : noiseLevelDb > NOISY_LEVEL_DB ? 'ruidoso' : 'ok';
  return { noiseDb, onDb, offDb: onDb - HYSTERESIS_DB, noiseSwingDb, noiseLevelDb, quality };
}
