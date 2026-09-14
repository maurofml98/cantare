import type {
  RepertoireBlock,
  RepertoireProject,
  RepertoireProjectType,
  RepertoireSong,
  SongDifficulty,
  SongStatus,
} from '@/lib/types';
import type { VocalProfile } from '@/lib/vocal/profile';
import { computeRecommendation } from '@/lib/repertoire/keys';

/**
 * Repertório em localStorage (`cantare:repertoire-projects`).
 *
 * v3: projeto ganha data, local, duração desejada, anotações, blocos e reserva.
 * Dados v2 são migrados na leitura (todas as músicas num bloco "Repertório") e
 * regravados — nada é apagado. O formato legado `cantare:projects` continua migrando.
 */

const STORAGE_KEY = 'cantare:repertoire-projects';
const LEGACY_KEY = 'cantare:projects';

/** Estimativa por música quando não há duração real (3min45s — média de 3,5 a 4 min). */
export const ESTIMATED_SONG_SEC = 225;

function now() {
  return new Date().toISOString();
}
const uid = () => crypto.randomUUID();

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ---------------- migração ---------------- */

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

/** Garante a forma v3 de qualquer projeto lido (v1/v2/v3 parcial). */
function toV3(p: any): RepertoireProject {
  const songs: RepertoireSong[] = Array.isArray(p.songs) ? p.songs : [];
  const ids = new Set(songs.map((s) => s.id));
  let blocks: RepertoireBlock[] = Array.isArray(p.blocks)
    ? p.blocks.map((b: any) => ({ id: b.id ?? uid(), name: b.name ?? 'Bloco', description: b.description, songIds: (b.songIds ?? []).filter((id: string) => ids.has(id)) }))
    : [];
  let reserveIds: string[] = Array.isArray(p.reserveIds) ? p.reserveIds.filter((id: string) => ids.has(id)) : [];
  // Toda música precisa estar em exatamente um lugar; órfãs vão para o último bloco.
  const placed = new Set([...blocks.flatMap((b) => b.songIds), ...reserveIds]);
  const orphans = songs.map((s) => s.id).filter((id) => !placed.has(id));
  if (blocks.length === 0) blocks = [{ id: uid(), name: 'Repertório', songIds: [] }];
  if (orphans.length) blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], songIds: [...blocks[blocks.length - 1].songIds, ...orphans] };
  reserveIds = [...new Set(reserveIds)];
  return {
    id: p.id ?? uid(),
    name: p.name ?? 'Projeto',
    type: p.type ?? 'Outro',
    createdAt: p.createdAt ?? now(),
    updatedAt: p.updatedAt ?? now(),
    songs,
    date: p.date || undefined,
    venue: p.venue || undefined,
    targetMinutes: typeof p.targetMinutes === 'number' ? p.targetMinutes : undefined,
    notes: p.notes || undefined,
    blocks,
    reserveIds,
    version: 3,
  };
}

function migrateLegacy(): RepertoireProject[] | null {
  if (typeof window === 'undefined') return null;
  const legacy = safeParse<any[]>(localStorage.getItem(LEGACY_KEY));
  if (!Array.isArray(legacy) || legacy.length === 0) return null;
  return legacy.map((p) =>
    toV3({
      id: p.id,
      name: p.name,
      type: mapLegacyType(p.type),
      createdAt: p.createdAt,
      songs: Array.isArray(p.songs)
        ? p.songs.map((s: any): RepertoireSong => ({
            id: s.id ?? uid(),
            title: s.title ?? 'Sem título',
            artist: s.artist,
            originalKey: s.key ?? '',
            currentKey: s.key ?? '',
            difficulty: 'unknown' as SongDifficulty,
            status: 'to_study' as SongStatus,
            createdAt: now(),
            updatedAt: now(),
          }))
        : [],
    }),
  );
}

/* ---------------- leitura e escrita ---------------- */

export function loadProjects(): RepertoireProject[] {
  if (typeof window === 'undefined') return [];
  const existing = safeParse<any[]>(localStorage.getItem(STORAGE_KEY));
  if (Array.isArray(existing)) {
    const needsWrite = existing.some((p) => p?.version !== 3);
    const list = existing.map(toV3);
    if (needsWrite) saveProjects(list);
    return list;
  }
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

/** Aplica uma alteração a um projeto e persiste. Lança erro se não conseguir gravar. */
function mutate(projectId: string, fn: (p: RepertoireProject) => RepertoireProject): RepertoireProject | null {
  const list = loadProjects();
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return null;
  const next = { ...fn(list[idx]), updatedAt: now() };
  list[idx] = next;
  saveProjects(list);
  return next;
}

/* ---------------- projeto ---------------- */

export interface ProjectInput {
  name: string;
  type: RepertoireProjectType;
  date?: string;
  venue?: string;
  targetMinutes?: number;
}

export function createProject(nameOrInput: string | ProjectInput, type?: RepertoireProjectType): RepertoireProject {
  const input: ProjectInput = typeof nameOrInput === 'string' ? { name: nameOrInput, type: type ?? 'Outro' } : nameOrInput;
  const project = toV3({
    id: uid(),
    name: input.name.trim(),
    type: input.type,
    date: input.date,
    venue: input.venue?.trim(),
    targetMinutes: input.targetMinutes,
    createdAt: now(),
    updatedAt: now(),
    songs: [],
    blocks: [{ id: uid(), name: 'Abertura', songIds: [] }],
    reserveIds: [],
  });
  saveProjects([project, ...loadProjects()]);
  return project;
}

export function updateProject(id: string, patch: Partial<Omit<RepertoireProject, 'id' | 'songs' | 'blocks' | 'reserveIds' | 'version'>>) {
  mutate(id, (p) => ({ ...p, ...patch }));
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}

/** "Quero um show parecido com o da semana passada": cópia com ids novos, sem data. */
export function duplicateProject(id: string): RepertoireProject | null {
  const src = getProject(id);
  if (!src) return null;
  const idMap = new Map(src.songs.map((s) => [s.id, uid()]));
  const copy: RepertoireProject = {
    ...src,
    id: uid(),
    name: `${src.name} (cópia)`,
    date: undefined,
    createdAt: now(),
    updatedAt: now(),
    songs: src.songs.map((s) => ({ ...s, id: idMap.get(s.id)!, createdAt: now(), updatedAt: now() })),
    blocks: src.blocks.map((b) => ({ ...b, id: uid(), songIds: b.songIds.map((sid) => idMap.get(sid)!).filter(Boolean) })),
    reserveIds: src.reserveIds.map((sid) => idMap.get(sid)!).filter(Boolean),
  };
  saveProjects([copy, ...loadProjects()]);
  return copy;
}

/* ---------------- blocos ---------------- */

export function addBlock(projectId: string, name = 'Novo bloco'): RepertoireBlock | null {
  const block: RepertoireBlock = { id: uid(), name, songIds: [] };
  return mutate(projectId, (p) => ({ ...p, blocks: [...p.blocks, block] })) ? block : null;
}

export function updateBlock(projectId: string, blockId: string, patch: Partial<Pick<RepertoireBlock, 'name' | 'description'>>) {
  mutate(projectId, (p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }));
}

/** Move um bloco para a posição `toIndex`. */
export function moveBlock(projectId: string, blockId: string, toIndex: number) {
  mutate(projectId, (p) => {
    const blocks = [...p.blocks];
    const from = blocks.findIndex((b) => b.id === blockId);
    if (from < 0) return p;
    const [b] = blocks.splice(from, 1);
    blocks.splice(Math.max(0, Math.min(blocks.length, toIndex)), 0, b);
    return { ...p, blocks };
  });
}

/** Exclui o bloco. As músicas dele vão para a reserva — nada se perde. */
export function deleteBlock(projectId: string, blockId: string) {
  mutate(projectId, (p) => {
    const block = p.blocks.find((b) => b.id === blockId);
    if (!block || p.blocks.length === 1) return p;
    return { ...p, blocks: p.blocks.filter((b) => b.id !== blockId), reserveIds: [...p.reserveIds, ...block.songIds] };
  });
}

/* ---------------- músicas ---------------- */

export type SongTarget = { kind: 'block'; blockId: string } | { kind: 'reserve' };

export type NewSongInput = Omit<RepertoireSong, 'id' | 'createdAt' | 'updatedAt'>;

function removeFromPlaces(p: RepertoireProject, songId: string): RepertoireProject {
  return {
    ...p,
    blocks: p.blocks.map((b) => ({ ...b, songIds: b.songIds.filter((id) => id !== songId) })),
    reserveIds: p.reserveIds.filter((id) => id !== songId),
  };
}

function placeSong(p: RepertoireProject, songId: string, target: SongTarget, index?: number): RepertoireProject {
  const insert = (arr: string[]) => {
    const a = [...arr];
    a.splice(index === undefined ? a.length : Math.max(0, Math.min(a.length, index)), 0, songId);
    return a;
  };
  if (target.kind === 'reserve') return { ...p, reserveIds: insert(p.reserveIds) };
  const exists = p.blocks.some((b) => b.id === target.blockId);
  const blockId = exists ? target.blockId : p.blocks[p.blocks.length - 1].id;
  return { ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, songIds: insert(b.songIds) } : b)) };
}

export function addSongs(projectId: string, inputs: NewSongInput[], target?: SongTarget): RepertoireSong[] {
  const created = inputs.map((input) => ({ ...input, id: uid(), createdAt: now(), updatedAt: now() }));
  const ok = mutate(projectId, (p) => {
    let next = { ...p, songs: [...p.songs, ...created] };
    const t = target ?? { kind: 'block' as const, blockId: p.blocks[p.blocks.length - 1].id };
    for (const s of created) next = placeSong(next, s.id, t);
    return next;
  });
  return ok ? created : [];
}

export function addSong(projectId: string, input: NewSongInput, target?: SongTarget): RepertoireSong | null {
  return addSongs(projectId, [input], target)[0] ?? null;
}

export function updateSong(projectId: string, songId: string, patch: Partial<RepertoireSong>) {
  mutate(projectId, (p) => ({
    ...p,
    songs: p.songs.map((s) => (s.id === songId ? { ...s, ...patch, updatedAt: now() } : s)),
  }));
}

export function deleteSong(projectId: string, songId: string) {
  mutate(projectId, (p) => ({ ...removeFromPlaces(p, songId), songs: p.songs.filter((s) => s.id !== songId) }));
}

/** Move a música para um bloco (ou reserva) na posição `index`. Serve para arrastar e para o menu. */
export function moveSong(projectId: string, songId: string, target: SongTarget, index?: number) {
  mutate(projectId, (p) => placeSong(removeFromPlaces(p, songId), songId, target, index));
}

/* ---------------- leituras derivadas ---------------- */

export interface SongPlace {
  song: RepertoireSong;
  blockIndex: number | null;
  block: RepertoireBlock | null;
  position: number;
}

/** Ordem de palco: blocos em sequência. Reserva fica de fora. */
export function showSequence(p: RepertoireProject): SongPlace[] {
  const byId = new Map(p.songs.map((s) => [s.id, s]));
  const out: SongPlace[] = [];
  p.blocks.forEach((b, bi) =>
    b.songIds.forEach((id) => {
      const song = byId.get(id);
      if (song) out.push({ song, blockIndex: bi, block: b, position: out.length + 1 });
    }),
  );
  return out;
}

export function reserveSongs(p: RepertoireProject): RepertoireSong[] {
  const byId = new Map(p.songs.map((s) => [s.id, s]));
  return p.reserveIds.map((id) => byId.get(id)).filter(Boolean) as RepertoireSong[];
}

export interface DurationInfo {
  seconds: number;
  estimatedCount: number;
  songCount: number;
}

export function durationOf(songs: RepertoireSong[]): DurationInfo {
  return songs.reduce<DurationInfo>(
    (acc, s) => ({
      seconds: acc.seconds + (s.durationSec ?? ESTIMATED_SONG_SEC),
      estimatedCount: acc.estimatedCount + (s.durationSec ? 0 : 1),
      songCount: acc.songCount + 1,
    }),
    { seconds: 0, estimatedCount: 0, songCount: 0 },
  );
}

export function blockSongs(p: RepertoireProject, b: RepertoireBlock): RepertoireSong[] {
  const byId = new Map(p.songs.map((s) => [s.id, s]));
  return b.songIds.map((id) => byId.get(id)).filter(Boolean) as RepertoireSong[];
}

export function formatDuration(sec: number, estimated = false): string {
  const m = Math.round(sec / 60);
  const txt = m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}min`;
  return estimated ? `~${txt}` : txt;
}

export function formatSongTime(sec?: number): string {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

/* ---------------- recomendações de tom ---------------- */

export interface RecalcSummary {
  projects: number;
  songs: number;
  updated: number;
}

/**
 * Recalcula recommendedKey/Delta/Reason de TODAS as músicas de TODOS os projetos
 * com base no perfil informado. Passe `null` para limpar sugestões.
 */
export function recalculateAllSongRecommendations(profile: VocalProfile | null): RecalcSummary {
  const list = loadProjects();
  let updated = 0;
  let songCount = 0;
  const stamp = now();

  const next = list.map((p) => {
    let changed = false;
    const songs = p.songs.map((s) => {
      songCount++;
      if (!s.currentKey) return s;
      const rec = computeRecommendation({ currentKey: s.currentKey, difficulty: s.difficulty }, profile);
      if (s.recommendedKey === rec.recommendedKey && s.recommendedDelta === rec.recommendedDelta && s.recommendedReason === rec.recommendedReason) return s;
      updated++;
      changed = true;
      return { ...s, ...rec, updatedAt: stamp };
    });
    return changed ? { ...p, songs, updatedAt: stamp } : p;
  });

  saveProjects(next);
  return { projects: list.length, songs: songCount, updated };
}
