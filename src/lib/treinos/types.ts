/**
 * Tipos da aba Treinos. Os exercícios ficam em `catalogo/` (um arquivo por objetivo); a
 * montagem e as consultas, em `exercises.ts`.
 */
import type { DetectMode } from '@/lib/audio/detectors';

export type ObjectiveId = 'respiracao' | 'flexibilidade' | 'firmeza' | 'ressonancia' | 'articulacao';

export interface Objective {
  id: ObjectiveId;
  name: string;
  /** texto da Laury (PDF, seção 01) */
  desc: string;
}

/** O número que o exercício produz, lido do resultado dos detectores. */
export type Metric =
  /** maior trecho de emissão contínua, em segundos */
  | 'longestSec'
  /** ataques contados no envelope */
  | 'pulseCount'
  /** do primeiro som ao último, em segundos (trava-línguas) */
  | 'timerSec';

/**
 * De onde vem a meta:
 * - `targets`: escada numérica da Laury (ex.: 8 → 10 → 12 → 15 s). No topo, a meta para lá.
 * - `record`: sem número definido, a meta é superar o próprio recorde (seção 02 do PDF).
 */
export type GoalMode = 'targets' | 'record';

/** Um quadro da demonstração do passo "Como fazer". */
export interface DemoStep {
  label: string;
  /** o que o quadro anima; sem animação própria ainda, só o ritmo da sequência */
  cue?: 'inhale' | 'hold' | 'emit' | 'pulse' | 'read';
}

export interface EngineConfig {
  /** 1. O que fazer — uma frase, texto da Laury */
  what: string;
  /** 2. Como fazer — sequência demonstrada em loop */
  how: DemoStep[];
  /** 3. Modelo — referência auditiva. `null` = não se aplica (o passo é pulado) */
  model: null | { src: string };
  /** texto mostrado durante a execução (trava-línguas) */
  text?: string;
  /** lembretes visuais durante a execução, texto da Laury */
  reminders?: string[];
  /** contagem de preparo antes de abrir o som (segundos com "Inspire") */
  inhaleSec?: number;
  metric: Metric;
  /** tempo de trava-língua: menor é melhor */
  better: 'higher' | 'lower';
  goal: GoalMode;
  /** o que falta a Laury definir neste exercício — aparece como TODO na tela em desenvolvimento */
  todo?: string[];
}

export interface TreinoExercise {
  id: string;
  objective: ObjectiveId;
  name: string;
  /** id de uma `Category` do mesmo objetivo; ausente = sem categoria */
  category?: string;
  /** o que o analisador mede; a ordem não importa */
  detect: DetectMode[];
  /** progressão da meta (segundos, pulsos…) — null até a Laury definir */
  targets: number[] | null;
  /** dúvida aberta que muda a detecção */
  pending?: string;
  /** presente = exercício pronto para o motor */
  engine?: EngineConfig;
}

export type RunnableExercise = TreinoExercise & { engine: EngineConfig };

/**
 * Agrupamento dentro de um objetivo. A Laury disse que os 3 exercícios por objetivo são amostra
 * e que vai abastecer com muito mais (25/09/2026): a categoria organiza a lista quando crescer.
 * Nome e desenho das categorias são dela — não inventar.
 */
export interface Category {
  /** único dentro do objetivo */
  id: string;
  name: string;
  desc?: string;
}

/** Um arquivo de `catalogo/`: as categorias e os exercícios de um objetivo. */
export interface ObjectiveCatalog {
  objective: ObjectiveId;
  categories: Category[];
  exercises: TreinoExercise[];
}
