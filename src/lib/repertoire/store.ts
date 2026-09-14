import type {
  RepertoireProject,
  RepertoireProjectType,
  RepertoireSong,
  SongDifficulty,
  SongStatus,
} from '@/lib/types';
import type { VocalProfile } from '@/lib/vocal/profile';
import { computeRecommendation } from '@/lib/repertoire/keys';

const STORAGE_KEY = 'cantare:repertoire-projects';
const LEGACY_KEY = 'cantare:projects';

function now() {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** Migração leve do formato antigo (Project) para RepertoireProject. */
function migrateLegacy(): RepertoireProject[] | null {
  if (typeof window === 'undefined') return null;
  const legacy = safeParse<any[]>(localStorage.getItem(LEGACY_KEY));
  if (!Array.isArray(legacy) || legacy.length === 0) return null;
  const migrated: RepertoireProject[] = legacy.map((p) => ({
    id: p.id ?? crypto.randomUUID(),
    name: p.name ?? 'Projeto',
    type: mapLegacyType(p.type),
    createdAt: p.createdAt ?? now(),
    updatedAt: now(),
    version: 2 as const,
    songs: Array.isArray(p.songs)
      ? p.songs.map((s: any): RepertoireSong => ({
          id: s.id ?? crypto.randomUUID(),
          title: s.title ?? 'Sem título',
          artist: s.artist,
          originalKey: s.key ?? 'C',
          currentKey: s.key ?? 'C',
          difficulty: 'unknown' as SongDifficulty,
          status: 'to_study' as SongStatus,
          createdAt: now(),
          updatedAt: now(),
        }))
      : [],
  }));
  return migrated;
}

function mapLegacyType(t: string | undefined): RepertoireProjectType {
  switch (t) {
    case 'Barzinho': return 'Show Barzinho';
    case 'Casamento': return 'Casamento';
    case 'Igreja': return 'Culto';
    case 'Show': return 'Show Barzinho';
    case 'Corporativo': return 'Ensaio';
    default: return 'Outro';
  }
}

export function loadProjects(): RepertoireProject[] {
  if (typeof window === 'undefined') return [];
  const existing = safeParse<RepertoireProject[]>(localStorage.getItem(STORAGE_KEY));
  if (Array.isArray(existing)) return existing;
  const migrated = migrateLegacy();
  if (migrated) {
    saveProjects(migrated);
    return migrated;
  }
  return [];
}

export function saveProjects(list: RepertoireProject[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getProject(id: string): RepertoireProject | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function createProject(name: string, type: RepertoireProjectType): RepertoireProject {
  const project: RepertoireProject = {
    id: crypto.randomUUID(),
    name: name.trim(),
    type,
    createdAt: now(),
    updatedAt: now(),
    songs: [],
    version: 2,
  };
  const list = loadProjects();
  saveProjects([project, ...list]);
  return project;
}

export function updateProject(id: string, patch: Partial<Omit<RepertoireProject, 'id' | 'songs'>>) {
  const list = loadProjects();
  const next = list.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p));
  saveProjects(next);
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}

export type NewSongInput = Omit<RepertoireSong, 'id' | 'createdAt' | 'updatedAt'>;

export function addSong(projectId: string, input: NewSongInput): RepertoireSong | null {
  const list = loadProjects();
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return null;
  const song: RepertoireSong = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  };
  list[idx] = { ...list[idx], songs: [...list[idx].songs, song], updatedAt: now() };
  saveProjects(list);
  return song;
}

export function updateSong(projectId: string, songId: string, patch: Partial<RepertoireSong>) {
  const list = loadProjects();
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    songs: list[idx].songs.map((s) =>
      s.id === songId ? { ...s, ...patch, updatedAt: now() } : s,
    ),
    updatedAt: now(),
  };
  saveProjects(list);
}

export function deleteSong(projectId: string, songId: string) {
  const list = loadProjects();
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    songs: list[idx].songs.filter((s) => s.id !== songId),
    updatedAt: now(),
  };
  saveProjects(list);
}

export interface RecalcSummary {
  projects: number;
  songs: number;
  updated: number;
}

/**
 * Recalcula recommendedKey/Delta/Reason de TODAS as músicas de TODOS os projetos
 * com base no perfil informado. Bulk: 1 load, 1 map, 1 save. Preserva demais campos.
 * Passe `null` para limpar sugestões (quando não há perfil).
 */
export function recalculateAllSongRecommendations(
  profile: VocalProfile | null,
): RecalcSummary {
  const list = loadProjects();
  let updated = 0;
  let songCount = 0;
  const stamp = now();

  const next: RepertoireProject[] = list.map((p) => {
    let projectChanged = false;
    const songs = p.songs.map((s) => {
      songCount++;
      if (!s.currentKey) return s;
      const rec = computeRecommendation(
        { currentKey: s.currentKey, difficulty: s.difficulty },
        profile,
      );
      if (
        s.recommendedKey === rec.recommendedKey &&
        s.recommendedDelta === rec.recommendedDelta &&
        s.recommendedReason === rec.recommendedReason
      ) {
        return s;
      }
      updated++;
      projectChanged = true;
      return {
        ...s,
        recommendedKey: rec.recommendedKey,
        recommendedDelta: rec.recommendedDelta,
        recommendedReason: rec.recommendedReason,
        updatedAt: stamp,
      };
    });
    return projectChanged ? { ...p, songs, updatedAt: stamp } : p;
  });

  saveProjects(next);
  return { projects: list.length, songs: songCount, updated };
}

