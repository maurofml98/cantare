import type { ObjectiveCatalog } from '../types';

/** Firmeza Vocal — voz grave, estável, "de radialista". */
export const FIRMEZA: ObjectiveCatalog = {
  objective: 'firmeza',
  // TODO(Laury): categorias deste objetivo — os exercícios abaixo são amostra (25/09/2026).
  categories: [],
  exercises: [
    { id: 'firm-espaguete-vu', objective: 'firmeza', name: 'Espaguete + "VU" grave', detect: ['sustain', 'pitch'], targets: null },
    { id: 'firm-finger-kazoo', objective: 'firmeza', name: 'Finger kazoo', detect: ['pulses', 'pitch'], targets: null },
    { id: 'firm-sapo', objective: 'firmeza', name: 'Som de sapo', detect: ['pulses'], targets: null },
  ],
};
