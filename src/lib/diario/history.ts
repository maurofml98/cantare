import { EXERCISE_LIST } from '@/lib/diario/exercises';
import { isoDay, loadDailyStats, type DailyStats } from '@/lib/diario/progress';

/**
 * Leituras de histórico para a tela de Evolução. Tudo vem de `cantare:diario:stats`
 * (um registro por dia, por exercício, com precisão e duração). Nada é estimado.
 */

export type PeriodDays = 7 | 30 | 90;

export interface DayPoint {
  date: string;
  accuracy: number | null;
  minutes: number;
  exercises: number;
}

export interface PeriodSummary {
  days: DayPoint[];
  exercises: number;
  minutes: number;
  activeDays: number;
  fullDays: number;
  accuracy: number | null;
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) : null);

export function dayPoint(stats: DailyStats, date: string): DayPoint {
  const entries = Object.values(stats[date]?.entries ?? {});
  const acc = entries.map((e) => e.accuracy).filter((a): a is number => typeof a === 'number');
  return {
    date,
    accuracy: avg(acc),
    minutes: Math.round(entries.reduce((s, e) => s + (e.duration || 0), 0) / 60),
    exercises: entries.length,
  };
}

/** `offset` = quantos períodos para trás (0 = atual, 1 = anterior). */
export function summarize(stats: DailyStats, period: PeriodDays, offset = 0): PeriodSummary {
  const days: DayPoint[] = [];
  for (let i = period - 1; i >= 0; i--) days.push(dayPoint(stats, isoDay(-(i + offset * period))));
  const accs: number[] = [];
  for (let i = period - 1; i >= 0; i--) {
    for (const e of Object.values(stats[isoDay(-(i + offset * period))]?.entries ?? {})) {
      if (typeof e.accuracy === 'number') accs.push(e.accuracy);
    }
  }
  return {
    days,
    exercises: days.reduce((s, d) => s + d.exercises, 0),
    minutes: days.reduce((s, d) => s + d.minutes, 0),
    activeDays: days.filter((d) => d.exercises > 0).length,
    fullDays: days.filter((d) => d.exercises >= EXERCISE_LIST.length).length,
    accuracy: avg(accs),
  };
}

export interface WeekBucket {
  label: string;
  accuracy: number | null;
  minutes: number;
}

/** Últimas 4 semanas corridas (7 dias cada), da mais antiga para a atual. */
export function lastFourWeeks(stats: DailyStats): WeekBucket[] {
  return [3, 2, 1, 0].map((w, i) => {
    const s = summarize(stats, 7, w);
    return { label: i === 3 ? 'Esta' : `Sem ${i + 1}`, accuracy: s.accuracy, minutes: s.minutes };
  });
}

export interface AreaProgress {
  id: string;
  name: string;
  /** 0–100: precisão (quando o exercício mede) ou constância (dias feitos / dias do período). */
  value: number;
  kind: 'precisao' | 'constancia';
  detail: string;
  delta: number | null;
}

const AREAS = [
  { id: '5', name: 'Afinação' },
  { id: '2', name: 'Respiração' },
  { id: '6', name: 'Voz mista' },
  { id: '4', name: 'Flexibilidade' },
  { id: '3', name: 'Coordenação' },
];

export function areaProgress(stats: DailyStats, period: PeriodDays): AreaProgress[] {
  const range = (offset: number) => Array.from({ length: period }, (_, i) => isoDay(-(i + offset * period)));
  return AREAS.map(({ id, name }) => {
    const calc = (offset: number) => {
      const dates = range(offset);
      const accs = dates.map((d) => stats[d]?.entries?.[id]?.accuracy).filter((a): a is number => typeof a === 'number');
      const doneDays = dates.filter((d) => !!stats[d]?.entries?.[id]).length;
      return { acc: avg(accs), doneDays };
    };
    const now = calc(0);
    const before = calc(1);
    if (now.acc !== null) {
      return { id, name, value: now.acc, kind: 'precisao' as const, detail: `${now.acc}% de precisão`, delta: before.acc !== null ? now.acc - before.acc : null };
    }
    const value = Math.round((now.doneDays / period) * 100);
    const beforeValue = Math.round((before.doneDays / period) * 100);
    return {
      id,
      name,
      value,
      kind: 'constancia' as const,
      detail: `feito em ${now.doneDays} de ${period} dias`,
      delta: before.doneDays > 0 ? value - beforeValue : null,
    };
  });
}

/* ---------------- conquistas ---------------- */

export interface Achievement {
  id: string;
  label: string;
  requirement: string;
  unlocked: boolean;
  glyph: 'voice' | 'day' | 'tune' | 'seq3' | 'seq7' | 'seq30';
}

const SEEN_KEY = 'cantare:conquistas:vistas';

/** Mesmas regras que já existiam, agora sobre o histórico inteiro (não só o dia de hoje). */
export function achievements(stats: DailyStats, streak: number): Achievement[] {
  const all = Object.values(stats);
  const anyExercise = all.some((d) => Object.keys(d.entries ?? {}).length > 0);
  const anyFullDay = all.some((d) => Object.keys(d.entries ?? {}).length >= EXERCISE_LIST.length);
  const accs = all.flatMap((d) => Object.values(d.entries ?? {}).map((e) => e.accuracy)).filter((a): a is number => typeof a === 'number');
  const bestWeek = summarize(stats, 30).accuracy;
  return [
    { id: 'first', label: 'Primeira voz', requirement: 'Concluir o primeiro exercício', unlocked: anyExercise, glyph: 'voice' },
    { id: 'day1', label: 'Dia completo', requirement: 'Concluir os 7 exercícios em um dia', unlocked: anyFullDay, glyph: 'day' },
    { id: 'tuned', label: 'Afinado', requirement: 'Precisão média acima de 80% nos últimos 30 dias', unlocked: accs.length > 0 && (bestWeek ?? 0) > 80, glyph: 'tune' },
    { id: 'seq3', label: 'Sequência', requirement: '3 dias seguidos de treino completo', unlocked: streak >= 3, glyph: 'seq3' },
    { id: 'seq7', label: 'Resistente', requirement: '7 dias seguidos de treino completo', unlocked: streak >= 7, glyph: 'seq7' },
    { id: 'seq30', label: 'Vocalista', requirement: '30 dias seguidos de treino completo', unlocked: streak >= 30, glyph: 'seq30' },
  ];
}

/** Ids desbloqueados que o usuário ainda não viu. Marca todos como vistos. */
export function consumeNewAchievements(list: Achievement[]): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    const unlocked = list.filter((a) => a.unlocked).map((a) => a.id);
    const fresh = unlocked.filter((id) => !seen.includes(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, ...unlocked])]));
    return fresh;
  } catch {
    return [];
  }
}

export { loadDailyStats };
