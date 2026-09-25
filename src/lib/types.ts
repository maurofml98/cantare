export type MusicStyle = 'Sertanejo' | 'MPB' | 'Gospel' | 'Rock' | 'Pop' | 'Pagode' | 'Axé' | 'Outro';

export type UserObjective = 'Cantor de shows' | 'Gravação' | 'Igreja/Louvor' | 'Iniciante';

export type ProjectType = 'Barzinho' | 'Casamento' | 'Igreja' | 'Corporativo' | 'Show' | 'Outro';

// --- Repertoire (Fase 3) ---
export type RepertoireProjectType =
  | 'Show Barzinho' | 'Culto' | 'Casamento' | 'Gravação'
  | 'Aula de Canto' | 'Ensaio' | 'Outro';

export type SongDifficulty = 'easy' | 'medium' | 'hard' | 'unknown';
export type SongStatus = 'to_study' | 'training' | 'ready' | 'difficult';

export interface RepertoireSong {
  id: string;
  title: string;
  artist?: string;
  /** Tom como o cantor canta: "G", "Gm", "C#"... Vazio = ainda não definido. */
  originalKey: string;
  currentKey: string;
  recommendedKey?: string;
  recommendedDelta?: number;
  recommendedReason?: string;
  difficulty: SongDifficulty;
  vocalNote?: string;
  status: SongStatus;
  /** Duração real em segundos (Spotify ou informada). Sem ela, a duração é estimada. */
  durationSec?: number;
  bpm?: number;
  albumImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Momento do show (Abertura, Modão, Encerramento...). A ordem do array é a ordem no palco. */
export interface RepertoireBlock {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
}

/**
 * Local do show vindo do OpenStreetMap (via Photon, `lib/repertoire/places.ts`). Dados ODbL:
 * podem ser guardados, com atribuição. Hoje ficam só no aparelho — a base de locais precisa de
 * servidor (BACKLOG).
 */
export interface VenuePlace {
  source: 'osm';
  /** N, W ou R (nó, via, relação) + id: identifica o lugar no OSM */
  osmType: string;
  osmId: number;
  name: string;
  /** tipo no OSM: bar, pub, restaurant, nightclub… */
  kind?: string;
  address?: string;
  district?: string;
  city?: string;
  /** UF */
  state?: string;
  lat: number;
  lon: number;
}

export interface RepertoireProject {
  id: string;
  name: string;
  type: RepertoireProjectType;
  createdAt: string;
  updatedAt: string;
  /** Todas as músicas do projeto. A posição no show vem de `blocks` e `reserveIds`. */
  songs: RepertoireSong[];
  /** v3 */
  date?: string;
  /** texto do local, sempre o que a pessoa vê e editou */
  venue?: string;
  /** local escolhido da sugestão do OpenStreetMap; ausente = texto livre */
  place?: VenuePlace;
  targetMinutes?: number;
  notes?: string;
  blocks: RepertoireBlock[];
  /** Coringas: fora da ordem e fora da duração total. */
  reserveIds: string[];
  version: 3;
}

export interface User {
  name: string;
  email: string;
  style: MusicStyle;
  objective: UserObjective;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  style?: string;
  cover?: string;

  key?: string;
}

export interface Block {
  id: string;
  name: string;
  songIds: string[];
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  date?: string;
  songs: Song[];
  blocks: Block[];
}

export interface Exercise {
  id: string;
  name: string;
  instruction: string;
  sets: number;
  reps: number;
  icon: string;
}

export interface Warmup {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
}