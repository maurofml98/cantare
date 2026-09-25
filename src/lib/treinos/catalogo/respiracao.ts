import type { ObjectiveCatalog } from '../types';

/** Respiração — controle e sustentação do ar (PDF da Laury, seção 03). */
export const RESPIRACAO: ObjectiveCatalog = {
  objective: 'respiracao',
  // TODO(Laury): categorias deste objetivo — os exercícios abaixo são amostra (25/09/2026).
  categories: [],
  exercises: [
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
  ],
};
