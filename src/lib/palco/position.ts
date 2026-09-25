/**
 * Onde o cantor está no show (Modo Palco, 25/09/2026). Se sair sem querer e voltar, retoma dali —
 * nunca volta sozinho para a música 1. Fica no aparelho.
 */
export type StageMode = 'foco' | 'lista' | 'letra';

export interface StagePosition {
  projectId: string;
  songId: string;
  blockId: string | null;
  songIndex: number;
  displayMode: StageMode;
}

const key = (projectId: string) => `cantare:palco:posicao:${projectId}`;

export function loadPosition(projectId: string): StagePosition | null {
  try {
    const p = JSON.parse(localStorage.getItem(key(projectId)) || 'null');
    return p && typeof p.songId === 'string' && typeof p.songIndex === 'number' ? p : null;
  } catch {
    return null;
  }
}

export function savePosition(pos: StagePosition) {
  try {
    localStorage.setItem(key(pos.projectId), JSON.stringify(pos));
  } catch {
    /* sem localStorage: segue sem retomar */
  }
}

/**
 * Índice para retomar numa sequência que pode ter mudado desde então: primeiro pela música
 * (se ela mudou de lugar), depois pelo índice salvo (se ela saiu do show), limitado ao tamanho.
 */
export function resumeIndex(seqIds: string[], saved: Pick<StagePosition, 'songId' | 'songIndex'> | null): number {
  if (!saved || seqIds.length === 0) return 0;
  const byId = seqIds.indexOf(saved.songId);
  if (byId >= 0) return byId;
  return Math.max(0, Math.min(saved.songIndex, seqIds.length - 1));
}

export const isStageMode = (m: unknown): m is StageMode => m === 'foco' || m === 'lista' || m === 'letra';
