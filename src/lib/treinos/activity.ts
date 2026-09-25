/**
 * Atividade da aba Voz (redesenho de 25/09/2026): o que o cantor treinou e quando — base de
 * "Continue de onde parou" e de "Último treino: ontem" nos objetivos. Sem porcentagem de
 * objetivo: o número de exercícios vai crescer e a porcentagem perderia sentido.
 */
import { goalFor, isValidAttempt, type Attempt } from './progress';
import { isRunnable, TREINO_BY_ID, type ObjectiveId, type TreinoExercise } from './exercises';

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "hoje", "ontem", "há 3 dias", "há 1 semana", "há 2 semanas", "há mais de um mês". */
export function relativeDay(iso: string, now = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 14) return 'há 1 semana';
  if (days < 31) return `há ${Math.floor(days / 7)} semanas`;
  return 'há mais de um mês';
}

/** Tentativa mais recente de um exercício que ainda existe e roda. */
export function lastAttempt(all: Attempt[]): Attempt | null {
  let last: Attempt | null = null;
  for (const a of all) {
    if (!isRunnable(TREINO_BY_ID[a.exerciseId])) continue;
    if (!last || a.at > last.at) last = a;
  }
  return last;
}

/** Data (ISO) do último treino por objetivo. */
export function lastByObjective(all: Attempt[]): Partial<Record<ObjectiveId, string>> {
  const out: Partial<Record<ObjectiveId, string>> = {};
  for (const a of all) {
    const ex = TREINO_BY_ID[a.exerciseId];
    if (!ex) continue;
    if (!out[ex.objective] || a.at > out[ex.objective]!) out[ex.objective] = a.at;
  }
  return out;
}

export type ExerciseState = 'preparacao' | 'comecar' | 'continuar' | 'concluido';

/**
 * Estado na lista: em preparação (não roda ainda), começar (nunca fez), continuar (já fez),
 * concluído (bateu o topo da escada da Laury). Exercício só com recorde nunca "conclui".
 */
export function exerciseState(ex: TreinoExercise, history: Attempt[]): ExerciseState {
  if (!isRunnable(ex)) return 'preparacao';
  const valid = history.filter((a) => a.exerciseId === ex.id && isValidAttempt(a, ex.engine.metric));
  if (!valid.length) return 'comecar';
  const g = goalFor(ex, valid);
  return g.kind === 'target' && g.top ? 'concluido' : 'continuar';
}
