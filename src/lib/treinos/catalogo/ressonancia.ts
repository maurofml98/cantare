import type { ObjectiveCatalog } from '../types';

/** Ressonância — sensação e projeção. */
export const RESSONANCIA: ObjectiveCatalog = {
  objective: 'ressonancia',
  // TODO(Laury): categorias deste objetivo — os exercícios abaixo são amostra (25/09/2026).
  categories: [],
  exercises: [
    { id: 'res-mastigacao', objective: 'ressonancia', name: 'Mastigação com "HUMMMM"', detect: ['sustain'], targets: null },
    { id: 'res-messa-di-voce', objective: 'ressonancia', name: 'Messa di voce', detect: ['intensity'], targets: null, pending: '"Em escala crescente": crescendo na mesma nota (intensity) ou escala ascendente (pitch)? Contradição 6.' },
    { id: 'res-humming', objective: 'ressonancia', name: 'Humming do grave ao agudo', detect: ['pitch', 'pulses'], targets: null },
  ],
};
