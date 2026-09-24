import { describe, expect, test } from 'bun:test';
import { TREINO_BY_ID, type RunnableExercise } from './exercises';
import { DETECTOR_VERSION } from '@/lib/audio/detectors';
import { countInvalidAttempts, evaluate, goalFor, isValidAttempt, loadAttempts, measure, MIN_VALID_DETECTOR, saveAttempt, estimateSyllables, suspicious, type Attempt } from './progress';

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

describe('versão do detector', () => {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window ??= globalThis;
  (globalThis as { localStorage?: unknown }).localStorage ??= {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  const KEY = 'cantare:treinos:tentativas';

  test('tentativa sem versão (anterior à correção) não vale', () => expect(isValidAttempt({ exerciseId: s.id, at: '', value: 20 }, 'longestSec')).toBe(false));
  test('tentativa da versão mínima vale', () =>
    expect(isValidAttempt({ exerciseId: s.id, at: '', value: 9, detector: MIN_VALID_DETECTOR.longestSec }, 'longestSec')).toBe(true));

  test('recorde inflado antigo sai da meta; a nova tentativa grava a versão', () => {
    // 3,6 s de trava-língua e 15 s de "S" medidos pelo detector com erro
    store.set(KEY, JSON.stringify([{ exerciseId: s.id, at: '2026-09-23T10:00:00Z', value: 15 }, { exerciseId: 'art-desafio-1', at: '2026-09-23T10:00:00Z', value: 3.6 }]));
    expect(loadAttempts(s.id)).toEqual([]);
    expect(countInvalidAttempts(s.id)).toBe(1);
    expect(goalFor(s, loadAttempts(s.id))).toMatchObject({ value: 8, step: 1 });
    saveAttempt(s.id, 9);
    expect(loadAttempts(s.id)).toMatchObject([{ value: 9, detector: DETECTOR_VERSION }]);
    // nada é apagado do aparelho
    expect(JSON.parse(store.get(KEY)!)).toHaveLength(3);
  });
});

describe('trava-língua: tempo suspeito pede confirmação', () => {
  const tl = TREINO_BY_ID['art-desafio-3'] as RunnableExercise; // "Teto sujo, chão sujo." — 7 sílabas
  const at = (...v: number[]): Attempt[] => v.map((value) => ({ exerciseId: tl.id, at: '', value, detector: DETECTOR_VERSION }));

  test('sílabas: "Teto sujo, chão sujo." = 7', () => expect(estimateSyllables('Teto sujo, chão sujo.')).toBe(7));
  test('sílabas: "qu"/"gu" + e/i não contam o u (quer-ca-qui)', () => expect(estimateSyllables('quer caqui')).toBe(3));
  test('primeira tentativa rápida demais para o texto (7 sílabas em 0,5 s)', () => expect(suspicious(tl, 0.5, [])).toBe('rapido-demais'));
  test('primeira tentativa plausível', () => expect(suspicious(tl, 1.5, [])).toBeNull());
  test('melhora de mais de 25% sobre o recorde', () => expect(suspicious(tl, 1.4, at(2.5, 2.0))).toBe('melhora-grande'));
  test('melhora normal passa', () => expect(suspicious(tl, 1.8, at(2.5, 2.0))).toBeNull());
  test('só vale para trava-língua', () => expect(suspicious(s, 0.1, [])).toBeNull());
});
