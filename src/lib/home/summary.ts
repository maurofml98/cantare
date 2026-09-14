import type { RepertoireProject, RepertoireSong } from '@/lib/types';
import type { VocalProfile } from '@/lib/vocal/profile';

export interface RepertoireSummary {
  projectCount: number;
  songCount: number;
  difficultCount: number;
  recommendedCount: number;
}

export function getRepertoireSummary(projects: RepertoireProject[]): RepertoireSummary {
  let songCount = 0;
  let difficultCount = 0;
  let recommendedCount = 0;
  for (const p of projects) {
    for (const s of p.songs) {
      songCount++;
      if (s.difficulty === 'hard') difficultCount++;
      if (s.recommendedKey && s.recommendedKey !== s.currentKey) recommendedCount++;
    }
  }
  return { projectCount: projects.length, songCount, difficultCount, recommendedCount };
}

export function getDifficultSongs(projects: RepertoireProject[]): RepertoireSong[] {
  return projects.flatMap((p) => p.songs.filter((s) => s.difficulty === 'hard'));
}

export function getSongsWithRecommendations(projects: RepertoireProject[]): RepertoireSong[] {
  return projects.flatMap((p) =>
    p.songs.filter((s) => s.recommendedKey && s.recommendedKey !== s.currentKey),
  );
}

export interface ExerciseLike { id: string; name: string }

export function getNextExerciseProgress(
  completedIds: string[],
  exercises: ExerciseLike[],
): { done: number; total: number; nextName: string | null } {
  const done = exercises.filter((e) => completedIds.includes(e.id)).length;
  const next = exercises.find((e) => !completedIds.includes(e.id));
  return { done, total: exercises.length, nextName: next ? next.name : null };
}

export interface TrainingFocus {
  label: string;
  reason: string;
}

export function getSuggestedTrainingFocus(
  profile: VocalProfile | null,
  projects: RepertoireProject[],
): TrainingFocus {
  if (!profile) {
    return { label: 'Respiração + Afinação', reason: 'Base recomendada para começar.' };
  }
  if (profile.confidence && profile.confidence !== 'high') {
    return {
      label: 'Refazer Teste Vocal',
      reason: 'Seu perfil está com confiança baixa. Refaça em ambiente silencioso.',
    };
  }
  const difficult = getDifficultSongs(projects).length;
  if (difficult > 0) {
    return {
      label: 'Afinação + Flexibilidade',
      reason: `Você tem ${difficult} música(s) difícil(eis) no repertório.`,
    };
  }
  if (profile.rangeSemitones < 18) {
    return { label: 'Flexibilidade', reason: 'Seu alcance ainda é curto — expandir aos poucos.' };
  }
  return { label: 'Respiração + Afinação', reason: 'Manutenção e controle vocal.' };
}

export interface HomePrimaryAction {
  label: string;
  to: string;
  reason: string;
}

export function getHomePrimaryAction(
  profile: VocalProfile | null,
  projects: RepertoireProject[],
  diary: { completedToday: number; total: number },
): HomePrimaryAction {
  if (!profile) {
    return { label: 'Iniciar Teste Vocal', to: '/teste-vocal', reason: 'Descubra sua voz.' };
  }
  if (projects.length === 0) {
    return { label: 'Criar Repertório', to: '/repertorio', reason: 'Adicione músicas para receber sugestões de tom.' };
  }
  if (diary.completedToday < diary.total) {
    return { label: 'Continuar Treino', to: '/diario', reason: `${diary.completedToday}/${diary.total} concluídos hoje.` };
  }
  return { label: 'Ver Evolução', to: '/diario/evolucao', reason: 'Treino de hoje completo.' };
}
