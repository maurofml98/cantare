import type { ObjectiveCatalog, TreinoExercise } from '../types';

/** Os 6 desafios da seção 07 do PDF, texto da Laury sem alteração. */
const TRAVA_LINGUAS = [
  'A Iara agarra e amarra a rara arara de Araraquara.',
  'O padre pouca capa tem, porque pouca capa compra.',
  'Teto sujo, chão sujo.',
  'O pinto pia, a pipa pinga. Pinga a pipa do pinto pia. Quanto mais o pinto pia, mais a pipa pinga.',
  'O rato roeu a roupa do rei de Roma.',
  'O que é que Caca quer? Caca quer caqui. Qual caqui que Caca quer? Cacá quer qualquer caqui.',
];

/** Articulação e Dicção — clareza e velocidade (PDF da Laury, seção 07). */
export const ARTICULACAO: ObjectiveCatalog = {
  objective: 'articulacao',
  // "Trava-línguas" é o nome do próprio PDF. A modalidade futura "palavra + ritmo" (ROADMAP,
  // Fase 7) vira outra categoria quando existir. TODO(Laury): demais categorias.
  categories: [{ id: 'trava-linguas', name: 'Trava-línguas' }],
  exercises: [
    ...TRAVA_LINGUAS.map((text, i): TreinoExercise => ({
      id: `art-desafio-${i + 1}`,
      objective: 'articulacao',
      category: 'trava-linguas',
      // nome = começo do próprio texto; a lista já numera (Desafio 1…6 no PDF)
      name: text.split(/[,.?]/)[0],
      detect: ['timer'],
      // TODO(Laury): tempo-meta de cada trava-língua — até lá, superar o próprio recorde.
      targets: null,
      engine: {
        what: 'Leia o trava-língua em voz alta. Mais rápido a cada vez, sem perder a clareza.',
        how: [
          { label: 'Leia o texto', cue: 'read' },
          { label: 'Abra a boca', cue: 'read' },
          { label: 'Articule cada sílaba', cue: 'read' },
        ],
        model: null,
        text,
        // Instrução, nunca correção: o app mede tempo, não clareza (CLAUDE.md, seção 13).
        reminders: ['Abra mais a boca', 'Articule com precisão', 'Mantenha a clareza', 'Aumente a velocidade sem perder a articulação'],
        inhaleSec: 3,
        metric: 'timerSec',
        better: 'lower',
        goal: 'record',
        todo: [
          'Tempo-meta de cada trava-língua',
          'Demonstração visual do "Como fazer" (abertura de boca, articulação) — hoje é só a sequência de palavras',
          'O tempo vai do primeiro ao último som: o app não confere se o texto foi lido inteiro nem se foi bem articulado',
          ...(i === 5 ? ['O texto do PDF alterna "Caca" e "Cacá" — confirmar se é intencional'] : []),
        ],
      },
    })),
  ],
};
