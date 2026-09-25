/**
 * Biblioteca de criações do próprio cantor (tela Criar música, 25/09/2026). Hoje sempre vazia:
 * a geração não existe. O formato já é o que a função real vai gravar, e a tela lê daqui —
 * nunca de dado de exemplo.
 *
 * Fica no aparelho (`localStorage`), como o resto do app (CLAUDE.md, seção 6).
 */
import type { NewSongInput } from '@/lib/repertoire/store';

const KEY = 'cantare:criacoes';

export interface CreatedSong {
  id: string;
  title: string;
  /** um dos estilos de `options.ts` ou o texto de "outro estilo" */
  style: string;
  durationSec?: number;
  /** tom em que foi gerada (cifra), quando houver */
  key?: string;
  /** endereço do áudio gerado; ausente = ainda não disponível para ouvir/baixar */
  audioUrl?: string;
  /** capa gerada; ausente = capa desenhada pela tela */
  coverUrl?: string;
  lyrics?: string;
  /** ISO */
  createdAt: string;
}

export type LibrarySort = 'recentes' | 'antigas' | 'titulo';

/** Lança se o dado estiver corrompido — a tela mostra o estado de erro. */
export function loadLibrary(): CreatedSong[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('biblioteca ilegível');
  return list.filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string');
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function filterLibrary(list: CreatedSong[], opts: { query: string; style: string; sort: LibrarySort }): CreatedSong[] {
  const q = fold(opts.query.trim());
  const out = list.filter((c) => (!opts.style || c.style === opts.style) && (!q || fold(`${c.title} ${c.style}`).includes(q)));
  return out.sort((a, b) =>
    opts.sort === 'titulo' ? a.title.localeCompare(b.title, 'pt-BR') : opts.sort === 'antigas' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );
}

/** Estilos presentes na biblioteca, para o filtro. */
export const libraryStyles = (list: CreatedSong[]) => [...new Set(list.map((c) => c.style))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** Criação → música do repertório. O tom vem da criação; o artista é o próprio cantor (vazio). */
export function toRepertoireSong(c: CreatedSong): NewSongInput {
  return {
    title: c.title,
    originalKey: c.key ?? '',
    currentKey: c.key ?? '',
    difficulty: 'unknown',
    status: 'to_study',
    durationSec: c.durationSec,
    lyrics: c.lyrics,
  };
}

export function formatDuration(sec?: number): string | null {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}
