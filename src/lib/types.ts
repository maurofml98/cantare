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
  originalKey: string;
  currentKey: string;
  recommendedKey?: string;
  recommendedDelta?: number;
  recommendedReason?: string;
  difficulty: SongDifficulty;
  vocalNote?: string;
  status: SongStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RepertoireProject {
  id: string;
  name: string;
  type: RepertoireProjectType;
  createdAt: string;
  updatedAt: string;
  songs: RepertoireSong[];
  version: 2;
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