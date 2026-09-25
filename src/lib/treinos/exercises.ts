/**
 * Aba Treinos — os exercícios da especificação da Laury (CLAUDE.md, seção 13) e o que cada um
 * mede. Um exercício é configuração: o motor (`components/treinos/TreinoEngine.tsx`) é um só e
 * percorre os 8 passos da seção 09 do PDF com o que estiver aqui.
 *
 * Só exercícios com `engine` rodam. Os outros ficam como identidade + detecção até a
 * detecção de altura ser testada com voz real e as demonstrações existirem.
 *
 * Metas: só o S sustentado tem número dela. `null` = pendente com a Laury — não inventar.
 *
 * Os exercícios vivem em `catalogo/`, um arquivo por objetivo, agrupados por categoria — a Laury
 * vai abastecer muito mais que os 3 por objetivo de hoje (25/09/2026). Exercício novo = entrada
 * no catálogo do objetivo; `catalogo.test.ts` confere ids e categorias.
 */
import type { Category, Objective, ObjectiveCatalog, ObjectiveId, RunnableExercise, TreinoExercise } from './types';
import { RESPIRACAO } from './catalogo/respiracao';
import { FLEXIBILIDADE } from './catalogo/flexibilidade';
import { FIRMEZA } from './catalogo/firmeza';
import { RESSONANCIA } from './catalogo/ressonancia';
import { ARTICULACAO } from './catalogo/articulacao';

export type * from './types';

export const OBJECTIVES: Objective[] = [
  { id: 'respiracao', name: 'Respiração', desc: 'Controle respiratório e sustentação do ar.' },
  { id: 'flexibilidade', name: 'Flexibilidade', desc: 'Mobilidade e flexibilidade vocal.' },
  { id: 'firmeza', name: 'Firmeza Vocal', desc: 'Estabilidade, sustentação e sensação de voz grave e firme.' },
  { id: 'ressonancia', name: 'Ressonância', desc: 'Sensações de ressonância e projeção vocal.' },
  { id: 'articulacao', name: 'Articulação e Dicção', desc: 'Clareza, precisão articulatória e velocidade da fala.' },
];

export const OBJECTIVE_BY_ID = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<ObjectiveId, Objective>;

export const CATALOGS: ObjectiveCatalog[] = [RESPIRACAO, FLEXIBILIDADE, FIRMEZA, RESSONANCIA, ARTICULACAO];

export const TREINO_EXERCISES: TreinoExercise[] = CATALOGS.flatMap((c) => c.exercises);

export const TREINO_BY_ID: Record<string, TreinoExercise> = Object.fromEntries(TREINO_EXERCISES.map((e) => [e.id, e]));

export const isRunnable = (e: TreinoExercise | undefined): e is RunnableExercise => !!e?.engine;

export const exercisesOf = (objective: ObjectiveId) => TREINO_EXERCISES.filter((e) => e.objective === objective);

export interface ExerciseGroup {
  /** null = exercícios sem categoria */
  category: Category | null;
  exercises: TreinoExercise[];
}

/**
 * Exercícios do objetivo agrupados na ordem das categorias do catálogo; os sem categoria vêm
 * por último. Categoria vazia não aparece.
 */
export function groupsOf(objective: ObjectiveId): ExerciseGroup[] {
  const cat = CATALOGS.find((c) => c.objective === objective);
  const list = exercisesOf(objective);
  const groups: ExerciseGroup[] = (cat?.categories ?? []).map((category) => ({ category, exercises: list.filter((e) => e.category === category.id) }));
  groups.push({ category: null, exercises: list.filter((e) => !e.category) });
  return groups.filter((g) => g.exercises.length > 0);
}
