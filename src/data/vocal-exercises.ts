import { Warmup } from '../lib/types';

export const VOCAL_DATA: Record<string, Warmup> = {
  'geral': {
    id: 'geral',
    name: 'Aquecimento Geral',
    description: 'Preparação completa para voz de peito, cabeça e agilidade.',
    exercises: [
      { id: '1', name: 'Vibração de língua', instruction: 'Inspire pelo nariz, expire vibrando a língua em um tom confortável.', sets: 3, reps: 5, icon: '👅' },
      { id: '2', name: 'M humming', instruction: 'Mantenha os lábios fechados e produza o som "Mmmm" sentindo a vibração nos lábios.', sets: 3, reps: 10, icon: '👄' },
      { id: '3', name: 'Sirene', instruction: 'Faça um som de "U" deslizando da nota mais grave para a mais aguda suavemente.', sets: 5, reps: 3, icon: '🚨' },
      { id: '4', name: 'Articulação de vogais', instruction: 'Pronuncie A-E-I-O-U de forma exagerada, focando na abertura da boca.', sets: 2, reps: 10, icon: '🗣️' }
    ]
  },
  'agudos': {
    id: 'agudos',
    name: 'Dificuldade nos agudos',
    description: 'Focado em leveza e ressonância para notas altas.',
    exercises: [
      { id: '1', name: 'Vibração de lábios aguda', instruction: 'Vibre os lábios em escalas ascendentes curtas.', sets: 3, reps: 5, icon: '👄' },
      { id: '2', name: 'Som de N (Ng)', instruction: 'Diga "Sing" e mantenha o "Ng", focando na ressonância nasal.', sets: 3, reps: 10, icon: '👃' },
      { id: '3', name: 'Glissando leve', instruction: 'Deslize entre notas agudas com pouquíssimo esforço.', sets: 4, reps: 5, icon: '🎶' },
      { id: '4', name: 'Boca chiusa aguda', instruction: 'Humming em tons agudos, mantendo a garganta relaxada.', sets: 3, reps: 8, icon: '🤐' }
    ]
  },
  'graves': {
    id: 'graves',
    name: 'Dificuldade nos graves',
    description: 'Focado em relaxamento laríngeo e corpo na voz.',
    exercises: [
      { id: '1', name: 'Vocal Fry', instruction: 'Produza aquele som "crocante" bem grave e relaxado.', sets: 3, reps: 5, icon: '🍳' },
      { id: '2', name: 'Som de B', instruction: 'Faça o som "B-B-B" explorando a ressonância no peito.', sets: 3, reps: 10, icon: '💣' },
      { id: '3', name: 'Bocejo-Suspiro', instruction: 'Simule um bocejo e termine com um suspiro grave.', sets: 5, reps: 3, icon: '🥱' },
      { id: '4', name: 'Escala descendente', instruction: 'Cantando "Ô", desça lentamente até sua nota mais grave confortável.', sets: 3, reps: 5, icon: '📉' }
    ]
  },
  'gravacao': {
    id: 'gravacao',
    name: 'Dia de gravação',
    description: 'Preparação para precisão tonal e clareza absoluta.',
    exercises: [
      { id: '1', name: 'Humming preciso', instruction: 'Faça notas curtas e precisas em uma única oitava.', sets: 4, reps: 10, icon: '🎯' },
      { id: '2', name: 'Staccato de "Pá"', instruction: 'Diga "Pá-pá-pá" de forma rápida e seca.', sets: 3, reps: 12, icon: '⚡' },
      { id: '3', name: 'Fricativos', instruction: 'Sustente o som "Sss" ou "Zzz" por o máximo de tempo possível.', sets: 3, reps: 3, icon: '🐍' },
      { id: '4', name: 'Leitura articulada', instruction: 'Leia um texto curto exagerando cada consoante.', sets: 2, reps: 1, icon: '📖' }
    ]
  },
  'diccao': {
    id: 'diccao',
    name: 'Melhorar dicção',
    description: 'Agilidade de língua e lábios para letras rápidas.',
    exercises: [
      { id: '1', name: 'Trava-línguas', instruction: 'Repita "O rato roeu a roupa do rei de Roma" aumentando a velocidade.', sets: 5, reps: 3, icon: '🐭' },
      { id: '2', name: 'Explosão de P e B', instruction: 'Alterne "Pá-Bá-Pá-Bá" focando no movimento dos lábios.', sets: 3, reps: 15, icon: '💥' },
      { id: '3', name: 'T e D ágil', instruction: 'Repita "Tá-Dá-Tá-Dá" batendo a ponta da língua nos dentes.', sets: 3, reps: 15, icon: '🦷' },
      { id: '4', name: 'Língua no palato', instruction: 'Mova a língua rapidamente entre os dentes e o céu da boca.', sets: 3, reps: 20, icon: '👅' }
    ]
  },
  'desaquecimento': {
    id: 'desaquecimento',
    name: 'Desaquecimento pós-show',
    description: 'Relaxamento das pregas vocais após esforço intenso.',
    exercises: [
      { id: '1', name: 'Boca chiusa descendente', instruction: 'Humming suave deslizando para o grave.', sets: 3, reps: 5, icon: '📉' },
      { id: '2', name: 'Suspiro relaxado', instruction: 'Apenas inspire e solte o ar com um som de "Ah" mudo.', sets: 5, reps: 3, icon: '🌬️' },
      { id: '3', name: 'Vibração de lábios leve', instruction: 'Vibração bem lenta e com pouca pressão de ar.', sets: 3, reps: 5, icon: '👄' },
      { id: '4', name: 'Massagem laríngea', instruction: 'Massageie suavemente a lateral do pescoço com movimentos circulares.', sets: 1, reps: 1, icon: '💆' }
    ]
  }
};