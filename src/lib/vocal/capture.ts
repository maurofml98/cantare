/**
 * Teste vocal: qual nota vale em cada etapa e quando a etapa termina. Puro (testável com o
 * microfone simulado, `lib/audio/sim.ts`); a tela é `components/vocal/VocalTestStep.tsx`.
 *
 * Substitui a captura antiga (até 24/09/2026), que tinha três erros de número plausível:
 * - capturava a PRIMEIRA nota estável — quem descia devagar até o limite, como a tela pede,
 *   ficava com a grave mais alta que a real;
 * - "corrigia oitava" cortando pela metade qualquer grave acima de 260 Hz — a grave de uma
 *   soprano (C4, 262 Hz) virava C3;
 * - media estabilidade em número de quadros: 2 s a 30 q/s, 0,5 s a 120 q/s.
 */
import type { Hold } from '@/lib/audio/detectors';
import type { Calibration } from '@/lib/audio/levels';

export type Instruction = 'confortavel' | 'grave' | 'aguda';
export type CaptureConfidence = 'high' | 'medium' | 'low';

/** Nota precisa ser segurada por isto para contar. Provisório — confirmar com a Laury. */
export const HOLD_SEC = 1;
/** Grave e aguda: depois de ter nota válida, silêncio por isto encerra a etapa. */
export const END_QUIET_SEC = 1;
/** Sem nota válida até aqui, a etapa oferece o valor aproximado. */
export const STEP_TIMEOUT_SEC = 20;
/** Valor aproximado: a nota segurada mais longa, se tiver pelo menos isto. */
export const APPROX_MIN_SEC = 0.5;

/**
 * Nota da etapa entre as seguradas por pelo menos `minSec`:
 * confortável = a segurada por mais tempo; grave = a mais baixa; aguda = a mais alta.
 */
export function pickHold(instruction: Instruction, holds: Hold[], minSec = HOLD_SEC): Hold | null {
  const ok = holds.filter((h) => h.sec >= minSec);
  if (!ok.length) return null;
  if (instruction === 'confortavel') return ok.reduce((a, b) => (b.sec > a.sec ? b : a));
  if (instruction === 'grave') return ok.reduce((a, b) => (b.midi < a.midi ? b : a));
  return ok.reduce((a, b) => (b.midi > a.midi ? b : a));
}

/**
 * A etapa terminou? Confortável: assim que uma nota completa `HOLD_SEC`. Grave e aguda: só
 * quando a voz para (`quietSec`) depois de haver nota válida — assim a descida/subida até o
 * limite não é cortada na primeira nota estável.
 */
export function stepDone(instruction: Instruction, holds: Hold[], current: Hold | null, quietSec: number): boolean {
  if (instruction === 'confortavel') return (current?.sec ?? 0) >= HOLD_SEC;
  return pickHold(instruction, holds) !== null && current === null && quietSec >= END_QUIET_SEC;
}

/** Confiança da captura: nota segurada o bastante numa sala calibrada como ok. */
export function captureConfidence(hold: Hold, cal: Calibration, approximate: boolean): CaptureConfidence {
  if (approximate) return 'low';
  return cal.quality === 'ok' ? 'high' : 'medium';
}

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
