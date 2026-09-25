import type { RepertoireProject } from '@/lib/types';

/**
 * Shows da Home (redesenho de 25/09/2026): o próximo show é o protagonista.
 * Datas são `YYYY-MM-DD` locais, sem horário (o projeto não guarda hora).
 */

const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface ShowPick {
  /** o show em destaque */
  main: RepertoireProject;
  /** `upcoming` = tem data hoje ou adiante; `recent` = nenhum show marcado, é o último editado */
  kind: 'upcoming' | 'recent';
  /** até 2 outros, na mesma lógica */
  others: RepertoireProject[];
}

/** Próximos shows por data (hoje em diante); sem data futura, os editados mais recentemente. */
export function pickShows(projects: RepertoireProject[], now = new Date()): ShowPick | null {
  if (projects.length === 0) return null;
  const today = localDay(now);
  const upcoming = projects.filter((p) => p.date && p.date >= today).sort((a, b) => a.date!.localeCompare(b.date!));
  const byEdit = [...projects].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  if (upcoming.length) {
    const rest = [...upcoming.slice(1), ...byEdit.filter((p) => !upcoming.includes(p))];
    return { main: upcoming[0], kind: 'upcoming', others: rest.slice(0, 2) };
  }
  return { main: byEdit[0], kind: 'recent', others: byEdit.slice(1, 3) };
}

export interface ShowSummary {
  songs: number;
  /** blocos com pelo menos uma música */
  blocks: number;
  /** músicas sem tom definido */
  missingKeys: number;
}

export function summarizeShow(p: RepertoireProject): ShowSummary {
  return {
    songs: p.songs.length,
    blocks: p.blocks.filter((b) => b.songIds.length > 0).length,
    missingKeys: p.songs.filter((s) => !s.currentKey).length,
  };
}

/** "Hoje", "Amanhã" ou "Sexta, 21 de março" — `null` sem data. */
export function showDateLabel(date: string | undefined, now = new Date()): string | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  const day = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  const label = day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('-feira', '');
}
