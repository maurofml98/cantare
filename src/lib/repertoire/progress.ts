/**
 * Duração do show contra a meta — o número mais importante do Repertório (redesenho de
 * 25/09/2026). Só blocos contam; a reserva fica de fora.
 */

/** Até 5 min de diferença, para mais ou para menos, conta como "na medida". Provisório. */
export const ON_TARGET_MIN = 5;

export type ShowProgress =
  | { state: 'sem-meta'; minutes: number }
  | { state: 'abaixo' | 'na-medida' | 'acima'; minutes: number; target: number; pct: number; diff: number };

export function showProgress(seconds: number, targetMinutes?: number): ShowProgress {
  const minutes = Math.round(seconds / 60);
  if (!targetMinutes) return { state: 'sem-meta', minutes };
  const diff = minutes - targetMinutes;
  const pct = Math.min(100, Math.round((minutes / targetMinutes) * 100));
  const state = Math.abs(diff) <= ON_TARGET_MIN ? 'na-medida' : diff < 0 ? 'abaixo' : 'acima';
  return { state, minutes, target: targetMinutes, pct, diff };
}

/** "50 min", "1h10" — para "faltam …" e "… acima". */
export function formatGap(min: number): string {
  const m = Math.abs(Math.round(min));
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`;
}

/** "2h10", "45min" — a duração grande do topo, sem o til de estimativa. */
export function formatClock(min: number): string {
  const m = Math.max(0, Math.round(min));
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}min`;
}
