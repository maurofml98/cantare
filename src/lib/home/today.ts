import type { RepertoireProject } from '@/lib/types';
import { freqToMidi } from '@/lib/audio/pitch';
import type { VocalProfile } from '@/lib/vocal/profile';
import type { MidiRange } from '@/components/vocal/NoteLadder';

/**
 * Leitura (somente) do progresso do Diário de Treino para a Home.
 *
 * TODO: a lista de exercícios e as regras de streak são espelho de
 * src/routes/_app.diario.index.tsx e diario.exercicio.$exerciseId.tsx, que
 * não exportam nada. Unificar num módulo único quando o Diário for refeito.
 */

export interface DiaryExercise {
  id: string;
  name: string;
  durationSec: number;
}

export const DIARY_EXERCISES: DiaryExercise[] = [
  { id: '1', name: 'Aquecimento Geral', durationSec: 180 },
  { id: '2', name: 'Respiração Profunda', durationSec: 30 },
  { id: '3', name: 'Coordenação Vocal', durationSec: 120 },
  { id: '4', name: 'Flexibilidade Vocal', durationSec: 120 },
  { id: '5', name: 'Afinação Básica', durationSec: 180 },
  { id: '6', name: 'Voz Mista', durationSec: 120 },
  { id: '7', name: 'Desaquecimento', durationSec: 120 },
];

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
