import { expect, test } from 'bun:test';
import { formatClock, formatGap, showProgress } from './progress';

test('sem meta: só os minutos', () => {
  expect(showProgress(130 * 60)).toEqual({ state: 'sem-meta', minutes: 130 });
});

test('abaixo, na medida e acima da meta', () => {
  expect(showProgress(130 * 60, 180)).toMatchObject({ state: 'abaixo', diff: -50, pct: 72 });
  expect(showProgress(177 * 60, 180).state).toBe('na-medida');
  expect(showProgress(185 * 60, 180).state).toBe('na-medida');
  expect(showProgress(198 * 60, 180)).toMatchObject({ state: 'acima', diff: 18, pct: 100 });
});

test('formatos', () => {
  expect(formatClock(130)).toBe('2h10');
  expect(formatClock(180)).toBe('3h00');
  expect(formatClock(45)).toBe('45min');
  expect(formatGap(-50)).toBe('50 min');
  expect(formatGap(70)).toBe('1h10');
});
