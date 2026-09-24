import { describe, expect, test } from 'bun:test';
import { PulseDetector, SustainDetector } from './detectors';
import type { Calibration } from './levels';

const NOISE = -70;
const cal: Calibration = { noiseDb: [NOISE, NOISE], onDb: 8, offDb: 4, noiseSwingDb: 3, noiseLevelDb: NOISE, quality: 'ok', contaminationMs: 0 };

/** Conta pulsos num envelope `act(t)` (dB acima do ruído), lido a `fps` quadros por segundo. */
function count(act: (t: number) => number, sec: number, fps: number) {
  const d = new PulseDetector(cal);
  for (let t = 0; t < sec; t += 1 / fps) d.push({ t, bands: [NOISE + act(t), NOISE], rms: 0, peak: 0 });
  return d.count;
}

/** `n` pulsos de `onMs` a cada `periodMs`, com um buraco de `holeMs` no meio de cada um. */
const pulses = (n: number, periodMs: number, onMs: number, { holeMs = 0, valleyDb = 0 } = {}) => (t: number) => {
  const k = Math.floor((t * 1000) / periodMs);
  const ph = (t * 1000) % periodMs;
  if (k >= n || ph >= onMs) return valleyDb;
  const mid = onMs / 2;
  return holeMs && ph >= mid && ph < mid + holeMs ? 0 : 30;
};

describe('pulsos', () => {
  for (const fps of [60, 120]) {
    test(`10 pulsos limpos (${fps} q/s)`, () => expect(count(pulses(10, 500, 180), 6, fps)).toBe(10));
    // queda de áudio / falha breve dentro do pulso não pode virar dois pulsos
    for (const holeMs of [15, 30, 40])
      test(`buraco de ${holeMs} ms dentro do pulso (${fps} q/s)`, () => expect(count(pulses(10, 500, 180, { holeMs }), 6, fps)).toBe(10));
    // pulsos rápidos com vale curto ainda contam
    test(`6 pulsos/s com vale de 80 ms (${fps} q/s)`, () => expect(count(pulses(12, 167, 87), 3, fps)).toBe(12));
    // finger kazoo / sapo: a voz não para, só cai de volume
    test(`vale sem silêncio, só 10 dB mais baixo (${fps} q/s)`, () => expect(count(pulses(8, 250, 150, { valleyDb: 20 }), 3, fps)).toBe(8));
  }
});

/** Picos de ruído da sala (5 dB, acima do limiar de saída de 4 dB) a cada 100 ms, fora da emissão. */
const spikes = (t: number) => (Math.round(t * 1000) % 100 < 17 ? 5 : 1);
/** `on(t)` = há som; fora dele, só o ruído com picos. */
const withNoise = (on: (t: number) => boolean) => (t: number) => (on(t) ? 40 : spikes(t));
const inAny = (spans: [number, number][]) => (t: number) => spans.some(([a, b]) => t >= a && t < b);

function sustain(act: (t: number) => number, sec: number, fps: number, gapMs?: number, minSegMs?: number) {
  const d = new SustainDetector(cal, gapMs, minSegMs);
  for (let t = 0; t < sec; t += 1 / fps) d.push({ t, bands: [NOISE + act(t), NOISE], rms: 0, peak: 0 });
  return d.result();
}

describe('duração e cronômetro', () => {
  for (const fps of [60, 120]) {
    const tol = 2 / fps;
    test(`S de 6 s com ruído depois não estica (${fps} q/s)`, () =>
      expect(Math.abs(sustain(withNoise(inAny([[1, 7]])), 9, fps).longestSec - 6)).toBeLessThan(tol));
    test(`S com falha de 150 ms continua um trecho só (${fps} q/s)`, () =>
      expect(sustain(withNoise(inAny([[1, 4], [4.15, 7]])), 9, fps).segments).toHaveLength(1));
    test(`S com quebra de 400 ms vira dois trechos (${fps} q/s)`, () =>
      expect(sustain(withNoise(inAny([[1, 4], [4.4, 7]])), 9, fps).segments).toHaveLength(2));
    // trava-língua: rajadas com pausas curtas; do primeiro ao último som = 2,6 s
    const leitura = inAny([[1, 1.5], [1.65, 2.25], [2.55, 3.25], [3.45, 3.6]]);
    test(`trava-língua de 2,6 s com ruído nas pausas (${fps} q/s)`, () =>
      expect(Math.abs(sustain(withNoise(leitura), 6, fps, 600, 150).spanSec - 2.6)).toBeLessThan(tol));
  }
});
