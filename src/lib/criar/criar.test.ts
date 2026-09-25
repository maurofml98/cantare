import { expect, test } from 'bun:test';
import { filterLibrary, formatDuration, toRepertoireSong, type CreatedSong } from './library';
import { KEYS, vocalToneStatus } from './options';
import type { VocalProfile } from '@/lib/vocal/profile';

const c = (id: string, title: string, style: string, createdAt: string): CreatedSong => ({ id, title, style, createdAt });
const LIST = [c('1', 'Meu Porto Seguro', 'Gospel', '2026-09-01'), c('2', 'Saudade de Interior', 'Sertanejo', '2026-09-10'), c('3', 'Ágil', 'Forró', '2026-09-05')];

test('busca por título ou estilo, sem acento', () => {
  expect(filterLibrary(LIST, { query: 'porto', style: '', sort: 'recentes' }).map((x) => x.id)).toEqual(['1']);
  expect(filterLibrary(LIST, { query: 'sertanejo', style: '', sort: 'recentes' }).map((x) => x.id)).toEqual(['2']);
  expect(filterLibrary(LIST, { query: 'agil', style: '', sort: 'recentes' }).map((x) => x.id)).toEqual(['3']);
});

test('filtro de estilo e ordenações', () => {
  expect(filterLibrary(LIST, { query: '', style: 'Forró', sort: 'recentes' }).map((x) => x.id)).toEqual(['3']);
  expect(filterLibrary(LIST, { query: '', style: '', sort: 'recentes' }).map((x) => x.id)).toEqual(['2', '3', '1']);
  expect(filterLibrary(LIST, { query: '', style: '', sort: 'antigas' }).map((x) => x.id)).toEqual(['1', '3', '2']);
  expect(filterLibrary(LIST, { query: '', style: '', sort: 'titulo' }).map((x) => x.id)).toEqual(['3', '1', '2']);
});

test('criação vira música do repertório com o tom dela', () => {
  expect(toRepertoireSong({ ...LIST[0], key: 'G', durationSec: 192 })).toMatchObject({ title: 'Meu Porto Seguro', originalKey: 'G', currentKey: 'G', durationSec: 192, status: 'to_study' });
});

test('No meu tom: sem teste, teste antigo (refazer) e teste válido', () => {
  expect(vocalToneStatus(null).kind).toBe('sem-teste');
  expect(vocalToneStatus({ detector: 2 } as VocalProfile).kind).toBe('refazer');
  expect(vocalToneStatus({ detector: 3 } as VocalProfile).kind).toBe('ok');
});

test('tons: livre primeiro, nomes em português com cifra', () => {
  expect(KEYS[0].value).toBe('');
  expect(KEYS.find((k) => k.value === 'G')?.label).toBe('Sol maior (G)');
  expect(KEYS.find((k) => k.value === 'Em')?.label).toBe('Mi menor (Em)');
});

test('duração m:ss', () => {
  expect(formatDuration(192)).toBe('3:12');
  expect(formatDuration(undefined)).toBeNull();
});
