import { expect, test } from 'bun:test';
import { exerciseState, lastAttempt, lastByObjective, relativeDay } from './activity';
import { TREINO_BY_ID } from './exercises';

const NOW = new Date(2026, 8, 25, 15);
const at = (daysAgo: number) => new Date(2026, 8, 25 - daysAgo, 10).toISOString();

test('dia relativo', () => {
  expect(relativeDay(at(0), NOW)).toBe('hoje');
  expect(relativeDay(at(1), NOW)).toBe('ontem');
  expect(relativeDay(at(5), NOW)).toBe('há 5 dias');
  expect(relativeDay(at(8), NOW)).toBe('há 1 semana');
  expect(relativeDay(at(20), NOW)).toBe('há 2 semanas');
  expect(relativeDay(at(40), NOW)).toBe('há mais de um mês');
});

const A = (exerciseId: string, daysAgo: number, value = 5) => ({ exerciseId, at: at(daysAgo), value, detector: 3 });

test('última tentativa e último treino por objetivo', () => {
  const all = [A('resp-s-sustentado', 3), A('art-desafio-2', 1), A('resp-x', 2), A('nao-existe', 0)];
  expect(lastAttempt(all)?.exerciseId).toBe('art-desafio-2');
  const by = lastByObjective(all);
  expect(by.respiracao).toBe(at(2));
  expect(by.articulacao).toBe(at(1));
  expect(by.flexibilidade).toBeUndefined();
});

test('estado do exercício', () => {
  const s = TREINO_BY_ID['resp-s-sustentado']; // escada 8 → 10 → 12 → 15
  expect(exerciseState(TREINO_BY_ID['flex-labios'], [])).toBe('preparacao');
  expect(exerciseState(s, [])).toBe('comecar');
  expect(exerciseState(s, [A(s.id, 1, 9)])).toBe('continuar');
  expect(exerciseState(s, [A(s.id, 4, 8), A(s.id, 3, 10), A(s.id, 2, 12), A(s.id, 1, 15)])).toBe('concluido');
  // tentativa do detector antigo não conta
  expect(exerciseState(s, [{ ...A(s.id, 1, 15), detector: 1 }])).toBe('comecar');
});
