/**
 * Aba Treinos — os exercícios da especificação da Laury (CLAUDE.md, seção 13; os 6
 * trava-línguas compartilham uma entrada) e o que cada um mede. Por enquanto só identidade +
 * detecção: textos, demonstrações, séries e o resto dos 8 passos entram com o motor.
 *
 * Metas: só o S sustentado tem número dela. `null` = pendente com a Laury — não inventar.
 */
import type { DetectMode } from '@/lib/audio/detectors';

export type ObjectiveId = 'respiracao' | 'flexibilidade' | 'firmeza' | 'ressonancia' | 'articulacao';

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
}

export const TREINO_EXERCISES: TreinoExercise[] = [
  { id: 'resp-s-sustentado', objective: 'respiracao', name: 'S sustentado', detect: ['sustain'], targets: [8, 10, 12, 15] },
  { id: 'resp-s-pulsado', objective: 'respiracao', name: 'S pulsado', detect: ['pulses'], targets: null },
  { id: 'resp-x', objective: 'respiracao', name: 'Controle respiratório com "X"', detect: ['sustain'], targets: null },

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
