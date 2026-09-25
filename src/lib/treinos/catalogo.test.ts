import { describe, expect, test } from 'bun:test';
import { CATALOGS, groupsOf, OBJECTIVES, TREINO_EXERCISES } from './exercises';

/** Rede de segurança do catálogo: vai crescer muito, abastecido pela Laury (25/09/2026). */
describe('catálogo de treinos', () => {
  test('um catálogo por objetivo', () => {
    expect(CATALOGS.map((c) => c.objective).sort()).toEqual(OBJECTIVES.map((o) => o.id).sort());
  });

  test('ids de exercício únicos', () => {
    const ids = TREINO_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const c of CATALOGS) {
    describe(c.objective, () => {
      test('exercícios pertencem ao objetivo do arquivo', () => {
        for (const e of c.exercises) expect(e.objective).toBe(c.objective);
      });
      test('ids de categoria únicos', () => {
        const ids = c.categories.map((k) => k.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
      test('toda categoria usada existe no objetivo', () => {
        const ids = new Set(c.categories.map((k) => k.id));
        for (const e of c.exercises) if (e.category) expect(ids.has(e.category)).toBe(true);
      });
      test('agrupar não perde nem duplica exercício', () => {
        const grouped = groupsOf(c.objective).flatMap((g) => g.exercises.map((e) => e.id));
        expect(grouped.sort()).toEqual(c.exercises.map((e) => e.id).sort());
      });
    });
  }
});

test('grupos seguem a ordem das categorias; sem categoria por último', () => {
  const g = groupsOf('articulacao');
  expect(g[0].category?.id).toBe('trava-linguas');
  expect(g.every((x) => x.exercises.length > 0)).toBe(true);
});
