/**
 * Metas e evolução da aba Treinos. Puro nas regras (testável em Node); só `loadAttempts` e
 * `saveAttempt` tocam o localStorage (`cantare:treinos:tentativas`).
 *
 * O nível da escada de metas não é gravado à parte: sai do histórico de tentativas.
 */
import type { AnalysisResult } from '@/lib/audio/detectors';
import type { Metric, RunnableExercise } from './exercises';

const KEY = 'cantare:treinos:tentativas';
const MAX_ATTEMPTS = 2000;

export interface Attempt {
  exerciseId: string;
  /** ISO */
  at: string;
  value: number;
}

/** O número da tentativa. `null` = os detectores não captaram nada útil. */
export function measure(result: AnalysisResult, metric: Metric): number | null {
  let v: number | undefined;
  if (metric === 'longestSec') v = result.sustain?.longestSec;
  if (metric === 'pulseCount') v = result.pulses?.count;
  if (metric === 'timerSec') v = result.timer?.sec;
  if (!v || v <= 0) return null;
  // Compara no mesmo arredondamento que a tela mostra: 7,96 s aparece "8,0" e tem que contar.
  return metric === 'pulseCount' ? v : Math.round(v * 10) / 10;
}

const beats = (value: number, mark: number, better: 'higher' | 'lower', strict: boolean) =>
  better === 'higher' ? (strict ? value > mark : value >= mark) : strict ? value < mark : value <= mark;

export type Goal =
  | { kind: 'target'; value: number; step: number; steps: number; /** topo da escada já batido */ top: boolean }
  | { kind: 'record'; value: number | null };

/** Meta vigente, dado o histórico do exercício (mais antigo primeiro). */
export function goalFor(ex: RunnableExercise, history: Attempt[]): Goal {
  const { better, goal } = ex.engine;
  if (goal === 'targets' && ex.targets?.length) {
    const t = ex.targets;
    let i = 0;
    let top = false;
    for (const a of history) {
      if (!beats(a.value, t[i], better, false)) continue;
      if (i === t.length - 1) top = true;
      else i++;
    }
    return { kind: 'target', value: t[i], step: i + 1, steps: t.length, top };
  }
  return { kind: 'record', value: best(ex, history) };
}

export function best(ex: RunnableExercise, history: Attempt[]): number | null {
  if (!history.length) return null;
  const v = history.map((a) => a.value);
  return ex.engine.better === 'higher' ? Math.max(...v) : Math.min(...v);
}

export interface Evaluation {
  value: number;
  /** meta que valia nesta tentativa */
  goal: Goal;
  /** bateu a meta (no modo recorde: superou; sem recorde anterior, não há meta) */
  met: boolean;
  /** superou a melhor marca anterior */
  record: boolean;
  /** meta da próxima tentativa */
  next: Goal;
}

export function evaluate(ex: RunnableExercise, value: number, history: Attempt[]): Evaluation {
  const goal = goalFor(ex, history);
  const prevBest = best(ex, history);
  const met =
    goal.kind === 'target' ? beats(value, goal.value, ex.engine.better, false) : goal.value !== null && beats(value, goal.value, ex.engine.better, true);
  // A primeira tentativa não é "recorde": não havia marca para superar.
  const record = prevBest !== null && beats(value, prevBest, ex.engine.better, true);
  const after = [...history, { exerciseId: ex.id, at: '', value }];
  return { value, goal, met, record, next: goalFor(ex, after) };
}

/* ---------------- armazenamento ---------------- */

function readAll(): Attempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Tentativas de um exercício, mais antiga primeiro. */
export function loadAttempts(exerciseId: string): Attempt[] {
  return readAll().filter((a) => a.exerciseId === exerciseId);
}

/** Tentativas registradas hoje (data local), em qualquer exercício. */
export function attemptsToday(now = new Date()): number {
  const day = now.toDateString();
  return readAll().filter((a) => new Date(a.at).toDateString() === day).length;
}

export function saveAttempt(exerciseId: string, value: number) {
  try {
    const all = [...readAll(), { exerciseId, at: new Date().toISOString(), value }];
    localStorage.setItem(KEY, JSON.stringify(all.slice(-MAX_ATTEMPTS)));
  } catch {
    /* localStorage indisponível: a tentativa vale na tela, só não fica registrada */
  }
}
