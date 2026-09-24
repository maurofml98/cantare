import { describe, expect, test } from 'bun:test';
import { TREINO_BY_ID, type RunnableExercise } from './exercises';
import { evaluate, goalFor, measure, type Attempt } from './progress';

const s = TREINO_BY_ID['resp-s-sustentado'] as RunnableExercise;
const hist = (...v: number[]): Attempt[] => v.map((value) => ({ exerciseId: s.id, at: '', value }));
const record: RunnableExercise = { ...s, targets: null, engine: { ...s.engine, goal: 'record' } };
const timer: RunnableExercise = { ...record, engine: { ...record.engine, metric: 'timerSec', better: 'lower' } };

describe('escada 8 → 10 → 12 → 15', () => {
  test('começa em 8', () => expect(goalFor(s, [])).toMatchObject({ kind: 'target', value: 8, step: 1, top: false }));
  test('sobe um degrau por meta batida, não pula', () => expect(goalFor(s, hist(14))).toMatchObject({ value: 10, step: 2 }));
  test('tentativa abaixo não muda a meta', () => expect(goalFor(s, hist(8, 9.9))).toMatchObject({ value: 10 }));
  test('para no teto de 15', () => expect(goalFor(s, hist(8, 10, 12, 15, 20))).toMatchObject({ value: 15, step: 4, top: true }));
  test('avaliação: bate e anuncia a próxima', () => {
    const ev = evaluate(s, 8, []);
    expect(ev.met).toBe(true);
    expect(ev.record).toBe(false);
    expect(ev.next).toMatchObject({ value: 10 });
  });
});

describe('modo recorde', () => {
  test('primeira vez não tem meta', () => {
    const ev = evaluate(record, 5, []);
    expect(ev.goal).toEqual({ kind: 'record', value: null });
    expect(ev.met).toBe(false);
    expect(ev.record).toBe(false);
    expect(evaluate(record, 6, hist(5)).record).toBe(true);
  });
  test('empatar não é superar', () => expect(evaluate(record, 5, hist(5)).met).toBe(false));
  test('tempo: menor é melhor', () => {
    expect(evaluate(timer, 4.2, hist(5, 4.5)).met).toBe(true);
    expect(evaluate(timer, 4.6, hist(5, 4.5)).record).toBe(false);
  });
});

describe('measure', () => {
  test('arredonda como a tela (7,96 conta como 8,0)', () =>
    expect(measure({ sustain: { segments: [[0, 7.96]], firstSec: 7.96, longestSec: 7.96, spanSec: 7.96 } }, 'longestSec')).toBe(8));
  test('nada captado = null', () => expect(measure({ sustain: { segments: [], firstSec: 0, longestSec: 0, spanSec: 0 } }, 'longestSec')).toBeNull());
});
