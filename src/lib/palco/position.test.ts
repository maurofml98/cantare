import { expect, test } from 'bun:test';
import { resumeIndex } from './position';

const SEQ = ['a', 'b', 'c', 'd'];

test('sem posição salva: começa do início', () => {
  expect(resumeIndex(SEQ, null)).toBe(0);
});

test('retoma pela música, mesmo que ela tenha mudado de lugar', () => {
  expect(resumeIndex(SEQ, { songId: 'c', songIndex: 0 })).toBe(2);
});

test('música saiu do show: fica no mesmo ponto, sem voltar para a 1', () => {
  expect(resumeIndex(SEQ, { songId: 'x', songIndex: 2 })).toBe(2);
  expect(resumeIndex(SEQ, { songId: 'x', songIndex: 9 })).toBe(3);
});

test('show vazio', () => {
  expect(resumeIndex([], { songId: 'a', songIndex: 3 })).toBe(0);
});
