/**
 * Trava de aquecimento da aba Treinos (CLAUDE.md, seção 10, item 2).
 *
 * TODO(Laury): o PDF da aba Treinos não diz onde o aquecimento entra (seção 13, contradição 1).
 * Até ela responder, vale a regra ética: nenhum treino sem aquecimento no dia. Conta como feito:
 * concluir um aquecimento da Saúde Vocal, marcar "Fazer aquecimento vocal" no checklist do dia
 * ou concluir o aquecimento do Diário antigo.
 */
import { loadCareDay, saveCareDay } from '@/lib/saude/care';
import { loadDiaryProgress } from '@/lib/diario/progress';
import { WARMUP_ID } from '@/lib/diario/exercises';

export function warmedUpToday(): boolean {
  try {
    return !!loadCareDay().checklist.aquecimento || loadDiaryProgress().completed.includes(WARMUP_ID);
  } catch {
    return false;
  }
}

export function markWarmupDone() {
  try {
    const day = loadCareDay();
    saveCareDay({ ...day, checklist: { ...day.checklist, aquecimento: true } });
  } catch {
    /* localStorage indisponível */
  }
}
