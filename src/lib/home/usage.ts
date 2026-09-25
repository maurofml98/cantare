import type { RepertoireProject } from '@/lib/types';

/**
 * Evolução da Home (CLAUDE.md, seção 14): uso do app nos últimos 30 dias, pela tríade — não
 * progresso de treino, que fica dentro de Treino.
 *
 * Só no aparelho: não existe servidor, então a equipe ainda não vê esses números agregados
 * (seção 14, contradição 5).
 */
export const USAGE_DAYS = 30;

export interface Usage {
  /** null = "criar música" ainda não existe */
  songsCreated: number | null;
  repertoires: number;
  /** execuções de exercício (tentativas), inválidas incluídas: conta prática, não medição */
  trainings: number;
}

export function usageWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - USAGE_DAYS * 24 * 60 * 60 * 1000);
}

export function repertoiresSince(projects: RepertoireProject[], since: Date): number {
  return projects.filter((p) => new Date(p.createdAt) >= since).length;
}
