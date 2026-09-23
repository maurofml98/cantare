/**
 * Captura do microfone → quadros para `detectors.ts`. Único ponto do app que deve abrir
 * o microfone para treino. O áudio não sai do aparelho (CLAUDE.md, seção 10).
 */
import { bandLevels, type Frame } from './levels';
import { detectPitch } from './pitch';

/** Altura custa caro (autocorrelação O(n²)); em celular simples, no máximo ~20×/s. */
const PITCH_EVERY_MS = 50;

export interface Mic {
  sampleRate: number;
  /** o que o navegador de fato aplicou — Android às vezes ignora o pedido de desligar o AGC */
  settings: MediaTrackSettings;
  label: string;
  /** lê o quadro atual; chamar a cada requestAnimationFrame */
  read(withPitch: boolean): Frame;
  /** custo médio de uma leitura de altura, em ms (diagnóstico de aparelho lento) */
  pitchCostMs(): number | null;
  close(): void;
}

export async function openMic(): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    // Filtros do navegador destroem a análise (CLAUDE.md, seção 9).
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  await ctx.resume().catch(() => {});
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0; // a suavização do analyser borraria os ataques dos pulsos
  ctx.createMediaStreamSource(stream).connect(analyser);

  const wave = new Float32Array(analyser.fftSize);
  const spec = new Float32Array(analyser.frequencyBinCount);
  const binHz = ctx.sampleRate / analyser.fftSize;
  const t0 = performance.now();
  let lastPitch = -Infinity;
  let cost = 0;
  let costN = 0;
  const track = stream.getAudioTracks()[0];

  return {
    sampleRate: ctx.sampleRate,
    settings: track?.getSettings() ?? {},
    label: track?.label ?? '',
    read(withPitch) {
      const now = performance.now();
      analyser.getFloatTimeDomainData(wave);
      analyser.getFloatFrequencyData(spec);
      let s2 = 0;
      let peak = 0;
      for (let i = 0; i < wave.length; i++) {
        s2 += wave[i] * wave[i];
        const a = Math.abs(wave[i]);
        if (a > peak) peak = a;
      }
      const f: Frame = { t: (now - t0) / 1000, bands: bandLevels(spec, binHz), rms: Math.sqrt(s2 / wave.length), peak };
      if (withPitch && now - lastPitch >= PITCH_EVERY_MS) {
        lastPitch = now;
        const hz = detectPitch(wave, ctx.sampleRate);
        cost += performance.now() - now;
        costN++;
        f.hz = hz > 0 ? hz : null;
      }
      return f;
    },
    pitchCostMs: () => (costN ? cost / costN : null),
    close() {
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    },
  };
}
