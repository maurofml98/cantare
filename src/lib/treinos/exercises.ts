/**
 * Aba Treinos — os exercícios da especificação da Laury (CLAUDE.md, seção 13) e o que cada um
 * mede. Um exercício é configuração: o motor (`components/treinos/TreinoEngine.tsx`) é um só e
 * percorre os 8 passos da seção 09 do PDF com o que estiver aqui.
 *
 * Só exercícios com `engine` rodam. Os outros ficam como identidade + detecção até a
 * detecção de altura ser testada com voz real e as demonstrações existirem.
 *
 * Metas: só o S sustentado tem número dela. `null` = pendente com a Laury — não inventar.
 */
import type { DetectMode } from '@/lib/audio/detectors';

export type ObjectiveId = 'respiracao' | 'flexibilidade' | 'firmeza' | 'ressonancia' | 'articulacao';

export interface Objective {
  id: ObjectiveId;
  name: string;
  /** texto da Laury (PDF, seção 01) */
  desc: string;
}

export const OBJECTIVES: Objective[] = [
  { id: 'respiracao', name: 'Respiração', desc: 'Controle respiratório e sustentação do ar.' },
  { id: 'flexibilidade', name: 'Flexibilidade', desc: 'Mobilidade e flexibilidade vocal.' },
  { id: 'firmeza', name: 'Firmeza Vocal', desc: 'Estabilidade, sustentação e sensação de voz grave e firme.' },
  { id: 'ressonancia', name: 'Ressonância', desc: 'Sensações de ressonância e projeção vocal.' },
  { id: 'articulacao', name: 'Articulação e Dicção', desc: 'Clareza, precisão articulatória e velocidade da fala.' },
];

export const OBJECTIVE_BY_ID = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<ObjectiveId, Objective>;

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
  /** o que o analisador mede; a ordem não importa */
  detect: DetectMode[];
  /** progressão da meta (segundos, pulsos…) — null até a Laury definir */
  targets: number[] | null;
  /** dúvida aberta que muda a detecção */
  pending?: string;
  /** presente = exercício pronto para o motor */
  engine?: EngineConfig;
}

export const TREINO_EXERCISES: TreinoExercise[] = [
  {
    id: 'resp-s-sustentado',
    objective: 'respiracao',
    name: 'S sustentado',
    detect: ['sustain'],
    targets: [8, 10, 12, 15],
    engine: {
      what: 'Inspire e solte o ar com som de “S”, sustentado e controlado, sem exagerar na pressão.',
      how: [
        { label: 'Inspire', cue: 'inhale' },
        { label: 'Puxe o ar', cue: 'inhale' },
        { label: 'Abdômen firme', cue: 'hold' },
        { label: 'Solte o “S”', cue: 'emit' },
      ],
      model: null,
      inhaleSec: 3,
      metric: 'longestSec',
      better: 'higher',
      goal: 'targets',
      todo: [
        'Ilustração da inspiração (inspirar → puxar o ar → abdômen firme → emitir) — hoje é só a sequência de palavras',
        'Tempo de inspiração antes do "S" (usado 3 s, provisório)',
      ],
    },
  },
  {
    id: 'resp-s-pulsado',
    objective: 'respiracao',
    name: 'S pulsado',
    detect: ['pulses'],
    // TODO(Laury): "meta progressiva de repetições" sem números — até lá, superar o próprio recorde.
    targets: null,
    engine: {
      what: 'Inspire e solte o ar com som de “S” pulsado, sem exagerar na pressão. A força vem do abdômen.',
      how: [
        { label: 'Inspire', cue: 'inhale' },
        { label: 'Abdômen firme', cue: 'hold' },
        { label: '“S” pulsado', cue: 'pulse' },
      ],
      model: null,
      reminders: ['A força vem do abdômen'],
      inhaleSec: 3,
      metric: 'pulseCount',
      better: 'higher',
      goal: 'record',
      todo: [
        'Meta progressiva de repetições (quantos pulsos em cada meta)',
        'Critério de regularidade: hoje conta todos os pulsos; o PDF pede "pulsos realizados com regularidade"',
        'Animação da contração do abdômen a cada pulso — hoje é um círculo pulsando',
        'Tempo de inspiração antes do "S" (usado 3 s, provisório)',
      ],
    },
  },
  {
    id: 'resp-x',
    objective: 'respiracao',
    name: 'Controle respiratório com "X"',
    detect: ['sustain'],
    // TODO(Laury): "mais ar e mais tempo a cada repetição" sem números — até lá, superar o próprio recorde.
    targets: null,
    engine: {
      what: 'Inspire e solte o ar com som de “X”, firmando o abdômen. A cada repetição, mais ar e mais tempo.',
      how: [
        { label: 'Inspire', cue: 'inhale' },
        { label: 'Abdômen firme', cue: 'hold' },
        { label: 'Solte o “X”', cue: 'emit' },
      ],
      model: null,
      reminders: ['Relaxe os ombros'],
      inhaleSec: 3,
      metric: 'longestSec',
      better: 'higher',
      goal: 'record',
      todo: [
        'Progressão por repetição: quantas repetições e quanto aumentar o tempo em cada uma',
        'Se a inspiração também deve crescer a cada repetição (hoje é fixa em 3 s, provisório)',
      ],
    },
  },

  { id: 'flex-labios', objective: 'flexibilidade', name: 'Escala em vibração de lábios', detect: ['pitch'], targets: null, pending: 'Desenho da escala (notas, intervalos). Vibração de lábios pode instabilizar a altura.' },
  { id: 'flex-vogais', objective: 'flexibilidade', name: 'Escala com vogais A-E-I-O-U', detect: ['pitch'], targets: null, pending: 'Desenho da escala. A vogal é mostrada, não conferida.' },
  { id: 'flex-z', objective: 'flexibilidade', name: 'Escala com som de "Z"', detect: ['pitch'], targets: null, pending: 'Desenho da escala.' },

  { id: 'firm-espaguete-vu', objective: 'firmeza', name: 'Espaguete + "VU" grave', detect: ['sustain', 'pitch'], targets: null },
  { id: 'firm-finger-kazoo', objective: 'firmeza', name: 'Finger kazoo', detect: ['pulses', 'pitch'], targets: null },
  { id: 'firm-sapo', objective: 'firmeza', name: 'Som de sapo', detect: ['pulses'], targets: null },

  { id: 'res-mastigacao', objective: 'ressonancia', name: 'Mastigação com "HUMMMM"', detect: ['sustain'], targets: null },
  { id: 'res-messa-di-voce', objective: 'ressonancia', name: 'Messa di voce', detect: ['intensity'], targets: null, pending: '"Em escala crescente": crescendo na mesma nota (intensity) ou escala ascendente (pitch)? Contradição 6.' },
  { id: 'res-humming', objective: 'ressonancia', name: 'Humming do grave ao agudo', detect: ['pitch', 'pulses'], targets: null },

  { id: 'art-trava-linguas', objective: 'articulacao', name: 'Trava-línguas cronometrado', detect: ['timer'], targets: null },
];

export const TREINO_BY_ID: Record<string, TreinoExercise> = Object.fromEntries(TREINO_EXERCISES.map((e) => [e.id, e]));

export type RunnableExercise = TreinoExercise & { engine: EngineConfig };

export const isRunnable = (e: TreinoExercise | undefined): e is RunnableExercise => !!e?.engine;

export const exercisesOf = (objective: ObjectiveId) => TREINO_EXERCISES.filter((e) => e.objective === objective);
