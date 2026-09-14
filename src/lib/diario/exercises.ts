/**
 * Fonte única dos exercícios do Diário de Treino.
 * Usada pela lista (/diario), pela execução (/diario/exercicio/$id) e pela Home.
 *
 * TODO(Laury): conteúdo herdado do protótipo — objetivo, técnica, duração e alvos precisam
 * ser validados por ela antes de qualquer usuário real (ver CLAUDE.md, seção 12).
 */

export type ExerciseRegion = 'cabeca' | 'misto' | 'peito';

export type ExerciseData = {
  id: string;
  name: string;
  objective: string;
  technique: string;
  /** segundos */
  duration: number;
  focus: string;
  region: ExerciseRegion;
};

export type PitchTargetNote = { note: string; duration: number };

export const EXERCISE_LIST: ExerciseData[] = [
  { id: '1', name: 'Aquecimento Geral', objective: 'Soltar tensão e preparar as cordas vocais', technique: 'Expire produzindo SSS... de forma contínua e controlada', duration: 180, focus: 'Suporte respiratório', region: 'misto' },
  { id: '2', name: 'Respiração Profunda', objective: 'Ativar o diafragma e expandir capacidade pulmonar', technique: 'Inspire em 4 tempos, segure 4, expire em 8', duration: 30, focus: 'Diafragma', region: 'peito' },
  { id: '3', name: 'Coordenação Vocal', objective: 'Alinhar ar e voz com controle', technique: 'Vibração de lábios em escala ascendente', duration: 120, focus: 'Coordenação fono-respiratória', region: 'misto' },
  { id: '4', name: 'Flexibilidade Vocal', objective: 'Ampliar mobilidade entre registros', technique: 'Sirene com "U" do grave ao agudo', duration: 120, focus: 'Passaggio', region: 'cabeca' },
  { id: '5', name: 'Afinação Básica', objective: 'Trabalhar precisão tonal', technique: 'Sustentar notas longas em "Ah"', duration: 180, focus: 'Precisão tonal', region: 'misto' },
  { id: '6', name: 'Voz Mista', objective: 'Equilibrar peito e cabeça', technique: 'Escalas em "Ng" mantendo ressonância', duration: 120, focus: 'Mix', region: 'misto' },
  { id: '7', name: 'Desaquecimento', objective: 'Relaxar as pregas vocais após o treino', technique: 'Humming suave descendente', duration: 120, focus: 'Relaxamento', region: 'peito' },
];

export const EXERCISES: Record<string, ExerciseData> = Object.fromEntries(EXERCISE_LIST.map((e) => [e.id, e]));

/** Sequências de notas-alvo dos exercícios cantados. Os de respiração não têm. */
export const PITCH_TARGETS: Record<string, PitchTargetNote[]> = {
  '5': [
    { note: 'C4', duration: 2 },
    { note: 'E4', duration: 2 },
    { note: 'G4', duration: 2 },
    { note: 'C5', duration: 2 },
    { note: 'G4', duration: 2 },
    { note: 'E4', duration: 2 },
    { note: 'C4', duration: 2 },
  ],
};

/** O aquecimento é obrigatório antes de qualquer outro exercício (briefing, restrição 2). */
export const WARMUP_ID = '1';

export function isLocked(id: string, completedIds: string[]): boolean {
  return id !== WARMUP_ID && !completedIds.includes(WARMUP_ID);
}
