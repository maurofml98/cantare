/**
 * Configuração das sessões guiadas (/diario/exercicio/$id).
 * Uma estrutura, sete experiências: cada exercício escolhe visual, métricas, captação e dicas.
 *
 * TODO(Laury): dicas, "antes de começar", ciclo respiratório e ritmo da curva de flexibilidade
 * são provisórios. Tempos respiratórios vêm do texto atual do exercício ("Inspire em 4 tempos,
 * segure 4, expire em 8"), lidos como segundos.
 */

export type VisualType = 'warmup' | 'breathing' | 'coordination' | 'flexibility' | 'pitch' | 'mixed' | 'cooldown';

/** Métricas que o motor realmente calcula (ver useExerciseSession). */
export type MetricKey =
  | 'intensity' // RMS do microfone
  | 'continuity' // % do tempo ativo com som acima do limiar
  | 'breathPhase' // fase do guia respiratório (relógio, não medição)
  | 'breathCycle'
  | 'stability' // desvio-padrão da altura nos últimos ~1,2 s
  | 'sync' // % do tempo ativo com emissão sonora com altura definida
  | 'note' // nota detectada
  | 'direction' // inclinação da altura nos últimos ~0,6 s
  | 'target' // nota-alvo + desvio em cents
  | 'accuracy' // % das leituras a até 50 cents do alvo
  | 'range' // nota em relação à faixa do Teste Vocal
  | 'softening'; // intensidade recente vs. primeiros 20 s

export interface SessionConfig {
  slug: string;
  visual: VisualType;
  image: string; // sem extensão: /aquecimento/treino-x → -960.webp / -1600.webp
  /** Recorte da imagem no palco: centro ou ancorada à esquerda. */
  align: 'center' | 'left';
  /** Precisa de microfone? Respiração é guiada pelo relógio e não capta áudio. */
  mic: boolean;
  /** Roda detecção de altura (autocorrelação). */
  pitch: boolean;
  metrics: MetricKey[];
  before: string[];
  /** Dica por etapa: idle, primeira metade, segunda metade. */
  tips: { idle: string; early: string; late: string };
  /** Frase curta no palco durante a execução. */
  cue: string;
  breath?: { inhale: number; hold: number; exhale: number };
  /** Segundos para ir do grave ao agudo e voltar. */
  curveCycle?: number;
}

const SAFETY = 'Sem forçar. Dor ou rouquidão? Pare.';
const MIC_BEFORE = ['Lugar silencioso', 'Celular a um palmo da boca'];

export const SESSIONS: Record<string, SessionConfig> = {
  '1': {
    slug: 'aquecimento-geral',
    visual: 'warmup',
    image: '/aquecimento/treino-aquecimento-geral',
    align: 'center',
    mic: true,
    pitch: false,
    metrics: ['intensity', 'continuity'],
    before: MIC_BEFORE,
    tips: {
      idle: 'A onda cresce com o aquecimento. Comece suave.',
      early: 'Inspire pelo nariz, expire com controle. Sinta o ar sustentando o som.',
      late: SAFETY,
    },
    cue: 'Solte o ar em “sss”, contínuo',
  },
  '2': {
    slug: 'respiracao-profunda',
    visual: 'breathing',
    image: '/aquecimento/treino-respiracao-profunda',
    align: 'center',
    mic: false,
    pitch: false,
    metrics: ['breathPhase', 'breathCycle'],
    before: ['Não usa o microfone', 'Siga a fase indicada no círculo'],
    tips: {
      idle: 'O círculo mostra quando inspirar, segurar e expirar.',
      early: 'Inspire pelo nariz, expire com controle.',
      late: 'Se sentir tontura, pare e respire normalmente.',
    },
    cue: 'Siga o ciclo',
    breath: { inhale: 4, hold: 4, exhale: 8 },
  },
  '3': {
    slug: 'coordenacao-vocal',
    visual: 'coordination',
    image: '/aquecimento/treino-coordenacao-vocal',
    align: 'center',
    mic: true,
    pitch: true,
    metrics: ['sync', 'stability', 'intensity'],
    before: MIC_BEFORE,
    tips: {
      idle: 'O centro acende quando sua emissão fica contínua.',
      early: 'Ar e som juntos: mantenha a vibração dos lábios sem interromper.',
      late: SAFETY,
    },
    cue: 'Vibre os lábios subindo a escala',
  },
  '4': {
    slug: 'flexibilidade-vocal',
    visual: 'flexibility',
    image: '/aquecimento/treino-flexibilidade-vocal',
    align: 'center',
    mic: true,
    pitch: true,
    metrics: ['note', 'direction', 'continuity'],
    before: MIC_BEFORE,
    tips: {
      idle: 'O ponto dourado sobe e desce. Acompanhe com a voz.',
      early: 'Sirene em “u”: deslize, sem degraus.',
      late: SAFETY,
    },
    cue: 'Acompanhe a curva',
    curveCycle: 8,
  },
  '5': {
    slug: 'afinacao-basica',
    visual: 'pitch',
    image: '/aquecimento/treino-afinacao-basica',
    align: 'left',
    mic: true,
    pitch: true,
    metrics: ['target', 'accuracy'],
    before: MIC_BEFORE,
    tips: {
      idle: 'Cante a nota-alvo e leve o marcador até o centro.',
      early: 'Sustente o “ah” e ajuste devagar.',
      late: SAFETY,
    },
    cue: 'Encontre a nota',
  },
  '6': {
    slug: 'voz-mista',
    visual: 'mixed',
    image: '/aquecimento/treino-voz-mista',
    align: 'center',
    mic: true,
    pitch: true,
    metrics: ['note', 'range', 'stability'],
    before: MIC_BEFORE,
    tips: {
      idle: 'A régua à direita mostra onde sua nota cai na sua faixa.',
      early: 'Busque passar entre grave e agudo sem trocas bruscas.',
      late: SAFETY,
    },
    cue: 'Equilíbrio entre peito e cabeça',
  },
  '7': {
    slug: 'desaquecimento',
    visual: 'cooldown',
    image: '/aquecimento/treino-desaquecimento',
    align: 'center',
    mic: true,
    pitch: false,
    metrics: ['intensity', 'softening'],
    before: MIC_BEFORE,
    tips: {
      idle: 'A onda vai se acalmando junto com a sua voz.',
      early: 'Humming suave, descendo devagar.',
      late: 'Deixe o som ficar cada vez mais leve.',
    },
    cue: 'Deixe a voz desacelerar',
  },
};

/** Posição no ciclo respiratório para um instante (s). */
export function breathAt(cfg: NonNullable<SessionConfig['breath']>, t: number) {
  const cycle = cfg.inhale + cfg.hold + cfg.exhale;
  const index = Math.floor(t / cycle);
  const c = t - index * cycle;
  if (c < cfg.inhale) return { phase: 'inhale' as const, phaseT: c, phaseLen: cfg.inhale, fill: c / cfg.inhale, index, cycle };
  if (c < cfg.inhale + cfg.hold) return { phase: 'hold' as const, phaseT: c - cfg.inhale, phaseLen: cfg.hold, fill: 1, index, cycle };
  const e = c - cfg.inhale - cfg.hold;
  return { phase: 'exhale' as const, phaseT: e, phaseLen: cfg.exhale, fill: 1 - e / cfg.exhale, index, cycle };
}

export const BREATH_LABEL = { inhale: 'Inspire', hold: 'Segure', exhale: 'Expire' } as const;
