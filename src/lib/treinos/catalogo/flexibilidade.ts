import type { ObjectiveCatalog } from '../types';

/** Flexibilidade — mobilidade em escala. Depende de altura, ainda sem teste com voz. */
export const FLEXIBILIDADE: ObjectiveCatalog = {
  objective: 'flexibilidade',
  // TODO(Laury): categorias deste objetivo — os exercícios abaixo são amostra (25/09/2026).
  categories: [],
  exercises: [
    { id: 'flex-labios', objective: 'flexibilidade', name: 'Escala em vibração de lábios', detect: ['pitch'], targets: null, pending: 'Desenho da escala (notas, intervalos). Vibração de lábios pode instabilizar a altura.' },
    { id: 'flex-vogais', objective: 'flexibilidade', name: 'Escala com vogais A-E-I-O-U', detect: ['pitch'], targets: null, pending: 'Desenho da escala. A vogal é mostrada, não conferida.' },
    { id: 'flex-z', objective: 'flexibilidade', name: 'Escala com som de "Z"', detect: ['pitch'], targets: null, pending: 'Desenho da escala.' },
  ],
};
