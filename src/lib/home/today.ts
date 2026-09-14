import type { RepertoireProject } from '@/lib/types';
import { freqToMidi } from '@/lib/audio/pitch';
import type { VocalProfile } from '@/lib/vocal/profile';
import type { MidiRange } from '@/components/vocal/NoteLadder';

import { EXERCISE_LIST } from '@/lib/diario/exercises';

/**
 * Leitura (somente) do progresso do Diário de Treino para a Home.
 * Exercícios vêm da fonte única src/lib/diario/exercises.ts.
 * TODO(Laury): o currículo real substitui essa lista quando ela entregar.
 */

export interface DiaryExercise {
  id: string;
  name: string;
  durationSec: number;
}

export const DIARY_EXERCISES: DiaryExercise[] = EXERCISE_LIST.map((e) => ({ id: e.id, name: e.name, durationSec: e.duration }));

const DIARY_KEY = 'cantare:diario';
const STATS_KEY = 'cantare:diario:stats';

const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export interface DiaryToday {
  completedIds: string[];
  /** Dias seguidos com treino completo. 0 = sequência ainda não começou. */
  streak: number;
}

export function loadDiaryToday(): DiaryToday {
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) return { completedIds: [], streak: 0 };
    const p = JSON.parse(raw);
    const today = isoDay();
    const completedIds = p.date === today && Array.isArray(p.completed) ? p.completed : [];
    // mesma regra do Diário: a sequência sobrevive se o último treino completo foi hoje ou ontem
    const alive = p.lastCompletedDate === today || p.lastCompletedDate === isoDay(-1);
    return { completedIds, streak: alive ? Number(p.streak) || 0 : 0 };
  } catch {
    return { completedIds: [], streak: 0 };
  }
}

/** Média de precisão (0–100) dos exercícios com microfone nos últimos 7 dias. */
export function loadWeeklyAccuracy(): number | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, { entries?: Record<string, { accuracy: number | null }> }>;
    const values: number[] = [];
    for (let i = 0; i < 7; i++) {
      const entries = all[isoDay(-i)]?.entries ?? {};
      for (const e of Object.values(entries)) {
        if (typeof e?.accuracy === 'number') values.push(e.accuracy);
      }
    }
    if (values.length === 0) return null;
    return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  } catch {
    return null;
  }
}

export interface WeekDay {
  label: string;
  /** Precisão média do dia (0–100), ou null se não houve exercício cantado. */
  accuracy: number | null;
  exercises: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekSummary {
  days: WeekDay[];
  exercises: number;
  activeDays: number;
  accuracy: number | null;
}

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Semana corrente (segunda a domingo) a partir de cantare:diario:stats. */
export function loadWeekSummary(): WeekSummary {
  let all: Record<string, { entries?: Record<string, { accuracy: number | null }> }> = {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) all = JSON.parse(raw);
  } catch {
    all = {};
  }
  const todayIdx = (new Date().getDay() + 6) % 7;
  const values: number[] = [];
  let exercises = 0;
  let activeDays = 0;

  const days = WEEK_LABELS.map((label, i) => {
    const entries = Object.values(all[isoDay(i - todayIdx)]?.entries ?? {});
    const acc = entries.map((e) => e?.accuracy).filter((a): a is number => typeof a === 'number');
    values.push(...acc);
    exercises += entries.length;
    if (entries.length > 0) activeDays++;
    return {
      label,
      accuracy: acc.length ? Math.round(acc.reduce((s, v) => s + v, 0) / acc.length) : null,
      exercises: entries.length,
      isToday: i === todayIdx,
      isFuture: i > todayIdx,
    };
  });

  return {
    days,
    exercises,
    activeDays,
    accuracy: values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null,
  };
}

export function totalMinutes(exercises: DiaryExercise[]): number {
  return Math.round(exercises.reduce((s, e) => s + e.durationSec, 0) / 60);
}

export function formatDuration(sec: number): string {
  return sec < 60 ? `${sec} seg` : `${Math.round(sec / 60)} min`;
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function mostRecentProject(projects: RepertoireProject[]): RepertoireProject | null {
  if (projects.length === 0) return null;
  return [...projects].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
}

export function profileRanges(profile: VocalProfile): { range: MidiRange; comfortable: MidiRange } {
  return {
    range: { low: freqToMidi(profile.lowestHz), high: freqToMidi(profile.highestHz) },
    comfortable: { low: freqToMidi(profile.comfortableLowHz), high: freqToMidi(profile.comfortableHighHz) },
  };
}
