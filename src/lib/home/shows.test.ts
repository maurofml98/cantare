import { expect, test } from 'bun:test';
import type { RepertoireProject } from '@/lib/types';
import { pickShows, showDateLabel, summarizeShow } from './shows';

const p = (id: string, over: Partial<RepertoireProject> = {}): RepertoireProject => ({
  id, name: id, type: 'Show Barzinho', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  songs: [], blocks: [], reserveIds: [], version: 3, ...over,
});
const NOW = new Date(2026, 8, 25, 15); // 25/09/2026, local

test('sem projeto = null (estado vazio da Home)', () => {
  expect(pickShows([], NOW)).toBeNull();
});

test('próximo show é o de data mais próxima, hoje incluído', () => {
  const r = pickShows([p('longe', { date: '2026-10-10' }), p('passado', { date: '2026-09-01' }), p('hoje', { date: '2026-09-25' })], NOW)!;
  expect(r.kind).toBe('upcoming');
  expect(r.main.id).toBe('hoje');
  expect(r.others.map((x) => x.id)).toEqual(['longe', 'passado']);
});

test('sem data futura: o último editado', () => {
  const r = pickShows([p('a', { updatedAt: '2026-09-10T00:00:00Z' }), p('b', { updatedAt: '2026-09-20T00:00:00Z' })], NOW)!;
  expect(r.kind).toBe('recent');
  expect(r.main.id).toBe('b');
});

test('resumo: músicas, blocos com música e tons faltando', () => {
  const song = (id: string, key: string) => ({ id, title: id, originalKey: key, currentKey: key, difficulty: 'unknown', status: 'ready', createdAt: '', updatedAt: '' }) as RepertoireProject['songs'][number];
  const s = summarizeShow(p('x', { songs: [song('1', 'G'), song('2', '')], blocks: [{ id: 'b1', name: 'A', songIds: ['1', '2'] }, { id: 'b2', name: 'B', songIds: [] }] }));
  expect(s).toEqual({ songs: 2, blocks: 1, missingKeys: 1 });
});

test('rótulo de data', () => {
  expect(showDateLabel('2026-09-25', NOW)).toBe('Hoje');
  expect(showDateLabel('2026-09-26', NOW)).toBe('Amanhã');
  expect(showDateLabel(undefined, NOW)).toBeNull();
  expect(showDateLabel('2026-10-02', NOW)).toMatch(/^Sexta, 2 de outubro$/);
});
