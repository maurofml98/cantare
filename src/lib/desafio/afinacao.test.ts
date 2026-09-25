import { describe, expect, test } from 'bun:test';
import { countHits, foldedCents, pickTargets, ROUNDS, scoreRounds } from './afinacao';

describe('foldedCents', () => {
  test('mesma nota = 0', () => expect(foldedCents(60, 60)).toBe(0));
  test('uma oitava abaixo ou acima vale como a mesma nota', () => {
    expect(foldedCents(48, 60)).toBe(0);
    expect(foldedCents(72.1, 60)).toBe(10);
  });
  test('sinal: acima é positivo, abaixo negativo', () => {
    expect(foldedCents(60.3, 60)).toBe(30);
    expect(foldedCents(47.5, 60)).toBe(-50);
  });
  test('fica entre -600 e +600', () => {
    expect(Math.abs(foldedCents(66, 60))).toBe(600);
    expect(foldedCents(67, 60)).toBe(-500);
  });
});

describe('scoreRounds', () => {
  test('faixas pelo erro médio absoluto', () => {
    expect(scoreRounds([10, -20, 15])?.band).toBe('afinado');
    expect(scoreRounds([40, -50, 30])?.band).toBe('perto');
    expect(scoreRounds([120, -90, 200])?.band).toBe('caminho');
  });
  test('rodada sem voz não entra na média', () => {
    expect(scoreRounds([10, null, -10])).toEqual({ band: 'afinado', meanAbs: 10, heard: 2 });
  });
  test('menos de duas rodadas captadas = sem resultado', () => {
    expect(scoreRounds([10, null, null])).toBeNull();
    expect(scoreRounds([null, null, null])).toBeNull();
  });
});

test('pickTargets sorteia notas distintas', () => {
  const t = pickTargets(() => 0);
  expect(t).toHaveLength(ROUNDS);
  expect(new Set(t).size).toBe(ROUNDS);
});

test('countHits: acerto = até meio semitom, rodada sem voz não conta', () => {
  expect(countHits([10, -50, 51, null])).toBe(2);
});
