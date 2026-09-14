/**
 * Progresso do Diário em localStorage (`cantare:diario`) e estatísticas por exercício
 * (`cantare:diario:stats`). Mesma estrutura e regras que já existiam — só centralizadas.
 */

export const DIARY_KEY = 'cantare:diario';
export const STATS_KEY = 'cantare:diario:stats';

export type DiaryProgress = {
  date: string;
  completed: string[];
  streak: number;
  lastCompletedDate: string | null;
};

export type StatEntry = { accuracy: number | null; duration: number };
export type DailyStats = Record<string, { entries: Record<string, StatEntry> }>;

export const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const empty = (): DiaryProgress => ({ date: isoDay(), completed: [], streak: 0, lastCompletedDate: null });

/** Lê o progresso de hoje. Em um novo dia, zera os concluídos e mantém a sequência só se ontem foi completo. */
export function loadDiaryProgress(): DiaryProgress {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as DiaryProgress;
    if (p.date !== isoDay()) {
      return {
        date: isoDay(),
        completed: [],
        streak: p.lastCompletedDate === isoDay(-1) ? p.streak : 0,
        lastCompletedDate: p.lastCompletedDate,
      };
    }
    return { ...empty(), ...p, completed: Array.isArray(p.completed) ? p.completed : [] };
  } catch {
    return empty();
  }
}

export function loadDailyStats(): DailyStats {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as DailyStats) : {};
  } catch {
    return {};
  }
}

/** Minutos efetivamente treinados hoje (soma das durações registradas). */
export function minutesToday(stats: DailyStats = loadDailyStats()): number {
  const entries = Object.values(stats[isoDay()]?.entries ?? {});
  return Math.round(entries.reduce((s, e) => s + (e.duration || 0), 0) / 60);
}
