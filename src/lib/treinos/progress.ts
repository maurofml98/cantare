/**
 * Metas e evolução da aba Treinos. Puro nas regras (testável em Node); só `loadAttempts` e
 * `saveAttempt` tocam o localStorage (`cantare:treinos:tentativas`).
 *
 * O nível da escada de metas não é gravado à parte: sai do histórico de tentativas.
 *
 * Cada tentativa grava a versão do detector que a mediu. Tentativas de versão abaixo da
 * mínima válida da métrica não contam para meta, recorde nem evolução — ficam no aparelho,
 * só não são lidas. Sem isso, um recorde inflado por detector com erro valeria para sempre.
 */
import { DETECTOR_VERSION, type AnalysisResult } from '@/lib/audio/detectors';
import { TREINO_BY_ID, type Metric, type RunnableExercise } from './exercises';

const KEY = 'cantare:treinos:tentativas';
const MAX_ATTEMPTS = 2000;

export interface Attempt {
  exerciseId: string;
  /** ISO */
  at: string;
  value: number;
  /** versão do detector (`DETECTOR_VERSION`); ausente = 1, anterior ao campo */
  detector?: number;
}

/**
 * Menor versão do detector cujas medições valem, por métrica. Subir a de uma métrica quando
 * uma correção mudar os números dela.
 *
 * Versão 1 invalidada nas três (24/09/2026): pulso contado em dobro com queda de áudio, e o
 * fim da emissão esticado por picos do ruído — o cronômetro chegou a medir 3,6 s em 2,6 s e a
 * duração do "S" também crescia, menos.
 */
export const MIN_VALID_DETECTOR: Record<Metric, number> = { longestSec: 2, pulseCount: 2, timerSec: 2 };

export const isValidAttempt = (a: Attempt, metric: Metric) => (a.detector ?? 1) >= MIN_VALID_DETECTOR[metric];

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

/*
 * Leitura suspeita (trava-língua). O app mede tempo, não confere se o texto foi lido inteiro
 * (CLAUDE.md, seção 13). Um tempo bom demais pode ser leitura interrompida — e viraria um
 * recorde impossível de bater. Nesses casos o app pergunta antes de gravar.
 * Limiares de detecção, não clínicos; provisórios até teste com voz real.
 */
/** Fala muito rápida fica em ~7 sílabas/s; acima disso, provavelmente não leu tudo. */
const MAX_SYLLABLES_PER_SEC = 9;
/** Melhora maior que isso sobre o próprio recorde, numa tentativa só. */
const MAX_IMPROVEMENT = 0.25;

/** Sílabas aproximadas: grupos de vogais ("qu"/"gu" + e/i contam como a vogal seguinte). Erra para menos. */
export function estimateSyllables(text: string): number {
  const t = text.toLowerCase().replace(/([qg])u(?=[eiéíê])/g, '$1');
  return t.match(/[aeiouáéíóúâêôãõàü]+/g)?.length ?? 0;
}

export type Suspicion = 'rapido-demais' | 'melhora-grande';

/** Por que este tempo precisa de confirmação antes de valer; `null` = pode gravar. */
export function suspicious(ex: RunnableExercise, value: number, history: Attempt[]): Suspicion | null {
  if (ex.engine.metric !== 'timerSec') return null;
  const syl = ex.engine.text ? estimateSyllables(ex.engine.text) : 0;
  if (syl && syl / value > MAX_SYLLABLES_PER_SEC) return 'rapido-demais';
  const prev = best(ex, history);
  if (prev !== null && value < prev * (1 - MAX_IMPROVEMENT)) return 'melhora-grande';
  return null;
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

const metricOf = (exerciseId: string) => TREINO_BY_ID[exerciseId]?.engine?.metric;

/** Todas as tentativas guardadas, em qualquer exercício (inclui as de detector antigo: contam prática). */
export const loadAllAttempts = (): Attempt[] => readAll();

/** Tentativas válidas de um exercício, mais antiga primeiro. */
export function loadAttempts(exerciseId: string): Attempt[] {
  const m = metricOf(exerciseId);
  return readAll().filter((a) => a.exerciseId === exerciseId && (!m || isValidAttempt(a, m)));
}

/** Tentativas guardadas mas medidas por detector já corrigido — não contam. */
export function countInvalidAttempts(exerciseId: string): number {
  const m = metricOf(exerciseId);
  return m ? readAll().filter((a) => a.exerciseId === exerciseId && !isValidAttempt(a, m)).length : 0;
}

/** Tentativas registradas hoje (data local), em qualquer exercício. Conta prática, não medição: inclui as inválidas. */
export function attemptsToday(now = new Date()): number {
  const day = now.toDateString();
  return readAll().filter((a) => new Date(a.at).toDateString() === day).length;
}

/** Tentativas desde `since`, em qualquer exercício. Conta prática: inclui as inválidas. */
export function attemptsSince(since: Date): number {
  return readAll().filter((a) => new Date(a.at) >= since).length;
}

export function saveAttempt(exerciseId: string, value: number) {
  try {
    const all = [...readAll(), { exerciseId, at: new Date().toISOString(), value, detector: DETECTOR_VERSION }];
    localStorage.setItem(KEY, JSON.stringify(all.slice(-MAX_ATTEMPTS)));
  } catch {
    /* localStorage indisponível: a tentativa vale na tela, só não fica registrada */
  }
}
