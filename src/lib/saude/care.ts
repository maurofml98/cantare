/**
 * Cuidados diários com a voz — tudo local no aparelho (sem backend).
 *
 * - `cantare:saude:dia:AAAA-MM-DD` → checklist do dia, água registrada, rotina iniciada
 * - `cantare:saude:meta-agua`       → meta de água DEFINIDA PELO USUÁRIO (o app não prescreve)
 * - `cantare:saude:registros`       → percepção da voz, um registro por dia (autorrelato, não avaliação)
 */

const dayKey = (date = today()) => `cantare:saude:dia:${date}`;
const GOAL_KEY = 'cantare:saude:meta-agua';
const LOG_KEY = 'cantare:saude:registros';

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export type CareItemId = 'agua' | 'aquecimento' | 'sem-forcar' | 'ambiente' | 'descanso';

export interface CareDay {
  date: string;
  checklist: Partial<Record<CareItemId, boolean>>;
  waterMl: number;
  waterLog: number[];
  routineStarted: boolean;
}

const emptyDay = (): CareDay => ({ date: today(), checklist: {}, waterMl: 0, waterLog: [], routineStarted: false });

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Grava e lança erro se não conseguir (quota cheia, modo privado etc.). */
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadCareDay(): CareDay {
  return read(dayKey(), emptyDay());
}

export function saveCareDay(day: CareDay) {
  write(dayKey(day.date), day);
}

export function loadWaterGoal(): number | null {
  if (typeof window === 'undefined') return null;
  const v = Number(localStorage.getItem(GOAL_KEY));
  return Number.isFinite(v) && v > 0 ? v : null;
}

export function saveWaterGoal(ml: number | null) {
  if (ml === null) localStorage.removeItem(GOAL_KEY);
  else localStorage.setItem(GOAL_KEY, String(Math.round(ml)));
}

export type Mood = 'ruim' | 'cansada' | 'normal' | 'bem' | 'otima';

export interface VoiceLog {
  date: string;
  mood: Mood;
  note?: string;
  createdAt: string;
}

export function loadLogs(): VoiceLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const list = raw ? (JSON.parse(raw) as VoiceLog[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Um registro por dia: salvar de novo no mesmo dia substitui o anterior. */
export function saveLog(mood: Mood, note?: string): VoiceLog {
  const entry: VoiceLog = { date: today(), mood, note: note?.trim() || undefined, createdAt: new Date().toISOString() };
  const list = loadLogs().filter((l) => l.date !== entry.date);
  write(LOG_KEY, [entry, ...list].slice(0, 365));
  return entry;
}
