import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { VocalTestStep, type CaptureConfidence } from '@/components/vocal/VocalTestStep';
import { useVocalMic, type VocalMic } from '@/components/vocal/useVocalMic';
import {
  buildVocalProfile,
  combineConfidence,
  saveVocalProfile,
  loadVocalProfile,
  type Confidence,
  type VocalProfile,
} from '@/lib/vocal/profile';
import { recalculateAllSongRecommendations } from '@/lib/repertoire/store';
import { freqToMidi } from '@/lib/audio/pitch';
import { warmedUpToday } from '@/lib/treinos/warmup';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF } from '@/components/home/primitives';

export const Route = createFileRoute('/teste-vocal/executar')({
  head: () => ({
    meta: [
      { title: 'Teste Vocal em andamento — Cantare' },
      { name: 'description', content: 'Fluxo guiado para medir alcance vocal e região confortável.' },
    ],
  }),
  // `next`: veio da trava do treino (teste feito uma vez, antes do primeiro treino) — ao salvar, volta ao exercício.
  validateSearch: (s: Record<string, unknown>): { next?: string } => (typeof s.next === 'string' && s.next ? { next: s.next } : {}),
  component: TesteVocalExecutar,
});

type Stage = 'intro' | 'ambiente' | 'confortavel' | 'grave' | 'aguda' | 'resultado' | 'incoerente';

function TesteVocalExecutar() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  // só volta ao exercício se o perfil foi salvo; sem perfil a trava abriria de novo
  const exit = () => (next && loadVocalProfile() ? navigate({ to: '/treino/$exerciseId', params: { exerciseId: next } }) : navigate({ to: next ? '/treinos' : '/teste-vocal' }));
  const [stage, setStage] = useState<Stage>('intro');
  const [comfortHz, setComfortHz] = useState(0);
  const [lowHz, setLowHz] = useState(0);
  const [highHz, setHighHz] = useState(0);
  const [comfortConf, setComfortConf] = useState<CaptureConfidence>('high');
  const [lowConf, setLowConf] = useState<CaptureConfidence>('high');
  const [highConf, setHighConf] = useState<CaptureConfidence>('high');
  const mic = useVocalMic();
  // localStorage só existe no navegador: decide depois de montar.
  const [warm, setWarm] = useState<boolean | null>(null);
  useEffect(() => setWarm(warmedUpToday()), []);

  // sala medida e aceita → primeira nota
  useEffect(() => {
    if (stage === 'ambiente' && mic.phase === 'ready') setStage('confortavel');
  }, [stage, mic.phase]);

  const profile = useMemo<VocalProfile | null>(() => {
    if (stage !== 'resultado' || !lowHz || !highHz) return null;
    if (freqToMidi(highHz) <= freqToMidi(lowHz)) return null;
    const confidence = combineConfidence(
      lowConf as Confidence,
      highConf as Confidence,
      comfortHz > 0 ? (comfortConf as Confidence) : undefined,
    );
    return buildVocalProfile(lowHz, highHz, {
      comfortHz: comfortHz > 0 ? comfortHz : undefined,
      confidence,
    });
  }, [stage, lowHz, highHz, comfortHz, comfortConf, lowConf, highConf]);

  const finalize = () => {
    if (profile) {
      saveVocalProfile(profile);
      const summary = recalculateAllSongRecommendations(profile);
      if (summary.songs > 0) {
        toast.success('Perfil salvo. Suas sugestões de tom foram atualizadas.');
      } else {
        toast.success('Perfil salvo.');
      }
    }
    exit();
  };

  const goToAguda = () => {
    // ao terminar a grave, verifica coerência mínima assim que tivermos a aguda
    setStage('aguda');
  };

  const onHighCaptured = (hz: number, _note: string, confidence: CaptureConfidence) => {
    setHighHz(hz);
    setHighConf(confidence);
    // valida coerência aguda > grave
    if (lowHz > 0 && freqToMidi(hz) <= freqToMidi(lowHz)) {
      setStage('incoerente');
      return;
    }
    setStage('resultado');
  };

  const redoGraveAguda = () => {
    setLowHz(0); setHighHz(0);
    setLowConf('high'); setHighConf('high');
    setStage('grave');
  };

  const redoAll = () => {
    setComfortHz(0); setLowHz(0); setHighHz(0);
    setComfortConf('high'); setLowConf('high'); setHighConf('high');
    setStage('confortavel');
  };

  if (warm === null) return null;
  // Seção 10, item 2 + ARQUITETURA.md: o teste pede o grave e o agudo, então exige aquecimento no
  // dia — qualquer que seja o caminho (URL direta, página do teste ou trava do treino).
  if (!warm) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#07080A] px-6 text-center" style={{ fontFamily: SANS }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 32, color: C.paper }}>Aqueça a voz primeiro</h1>
        <p style={{ fontSize: 15, color: C.paper2 }}>O teste pede sua nota mais grave e a mais aguda. Aqueça antes.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} search={{ next: 'teste-vocal' }} className={buttonVariants({ size: 'lg' })}>
            Fazer aquecimento
          </Link>
          <Link to={next ? '/treinos' : '/teste-vocal'} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#07080A' }}>
      {/* header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <Link
          to={next ? '/treinos' : '/teste-vocal'}
          className="flex items-center gap-2 text-[#8A8A95] hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] uppercase" style={{ letterSpacing: '0.24em' }}>Sair</span>
        </Link>
        <p
          className="text-[10px] uppercase text-[#B8955A]/80"
          style={{ letterSpacing: '0.32em' }}
        >
          Cantare · Teste Vocal
        </p>
        <span className="w-10" />
      </div>

      {/* film grain */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-10">
        {stage === 'intro' && (
          <IntroPanel
            onStart={() => {
              setStage('ambiente');
              mic.start();
            }}
          />
        )}

        {stage === 'ambiente' && <EnvironmentPanel mic={mic} />}

        {stage === 'confortavel' && (
          <VocalTestStep
            instruction="confortavel"
            mic={mic}
            onCaptured={(hz, _n, c) => { setComfortHz(hz); setComfortConf(c); setStage('grave'); }}
            onCancel={() => setStage('intro')}
          />
        )}

        {stage === 'grave' && (
          <VocalTestStep
            instruction="grave"
            mic={mic}
            onCaptured={(hz, _n, c) => { setLowHz(hz); setLowConf(c); goToAguda(); }}
            onCancel={() => setStage('intro')}
          />
        )}

        {stage === 'aguda' && (
          <VocalTestStep
            instruction="aguda"
            mic={mic}
            onCaptured={onHighCaptured}
            onCancel={() => setStage('intro')}
          />
        )}

        {stage === 'incoerente' && (
          <IncoherentPanel onRedoTwo={redoGraveAguda} onRedoAll={redoAll} />
        )}

        {stage === 'resultado' && profile && (
          <ResultPanel
            profile={profile}
            comfortHz={comfortHz}
            onFinalize={finalize}
            onRestart={redoAll}
          />
        )}

        {stage === 'resultado' && !profile && (
          <IncoherentPanel onRedoTwo={redoGraveAguda} onRedoAll={redoAll} />
        )}
      </div>

      {/* progresso */}
      {['confortavel', 'grave', 'aguda'].includes(stage) && (
        <div className="relative z-10 px-6 pb-8">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <Dot active={stage === 'confortavel'} done={['grave','aguda'].includes(stage)} />
            <Line />
            <Dot active={stage === 'grave'} done={stage === 'aguda'} />
            <Line />
            <Dot active={stage === 'aguda'} done={false} />
          </div>
        </div>
      )}
    </div>
  );
}

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
        Antes de começar
      </p>
      <h1
        className="mt-3 text-white"
        style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 34, lineHeight: 1.1 }}
      >
        Você vai cantar três vezes: confortável, grave e aguda.
      </h1>
      <p className="mt-4 text-[14px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
        Encontre um lugar silencioso. Primeiro medimos 2 segundos de silêncio; depois, cante em "AAAAH" sustentado — cada nota vale quando você segurar por 1 segundo. O áudio não sai do aparelho.
      </p>
      <button
        onClick={onStart}
        className="mt-10 inline-flex h-14 items-center justify-center rounded-2xl px-8 text-[#07080A] hover:brightness-110 hover:-translate-y-[1px] active:scale-[0.985] transition"
        style={{
          background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
          boxShadow: '0 12px 40px -12px rgba(184,149,90,0.6)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
        }}
      >
        Começar →
      </button>
    </div>
  );
}

/** Microfone e ruído da sala antes da primeira nota — mesmas regras do motor de treino. */
function EnvironmentPanel({ mic }: { mic: VocalMic }) {
  const title: Record<string, string> = {
    idle: 'Preparando o microfone',
    opening: 'Permita o uso do microfone',
    calibrating: 'Silêncio',
    noisy: 'Ruído de fundo excessivo',
    contaminated: 'Captamos som no silêncio',
    denied: 'Sem acesso ao microfone',
    error: 'O microfone não abriu',
    ready: 'Pronto',
  };
  const text: Record<string, string> = {
    calibrating: 'Medindo o som do ambiente por 2 segundos.',
    noisy: 'Com barulho, a nota pode sair errada — foi assim que a mesma voz já deu soprano num dia e contralto no outro.',
    contaminated: 'Fique 2 segundos sem falar nem soprar, e meça de novo.',
    denied: 'Libere o microfone para este site nas configurações do navegador.',
    error: 'Feche outros apps que usem o microfone e tente de novo.',
  };
  const btn = 'text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors';
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="mt-3 text-white" style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 30, lineHeight: 1.1 }}>
        {title[mic.phase]}
      </h1>
      {text[mic.phase] && (
        <p className="mt-4 text-[14px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
          {text[mic.phase]}
        </p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        {(mic.phase === 'noisy' || mic.phase === 'contaminated') && (
          <button onClick={mic.recalibrate} className={btn} style={{ letterSpacing: '0.28em', color: '#E8C97E' }}>
            ↺ Medir de novo
          </button>
        )}
        {mic.phase === 'noisy' && (
          <button onClick={mic.acceptNoise} className={btn} style={{ letterSpacing: '0.28em' }}>
            Continuar mesmo assim
          </button>
        )}
        {(mic.phase === 'denied' || mic.phase === 'error') && (
          <button onClick={mic.start} className={btn} style={{ letterSpacing: '0.28em', color: '#E8C97E' }}>
            ↺ Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}

function IncoherentPanel({ onRedoTwo, onRedoAll }: { onRedoTwo: () => void; onRedoAll: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
        Captura incoerente
      </p>
      <h1
        className="mt-3 text-white"
        style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 30, lineHeight: 1.1 }}
      >
        A nota aguda ficou abaixo da nota grave.
      </h1>
      <p className="mt-4 text-[14px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
        Isso costuma acontecer por captação com muito ruído ou por dobrar de oitava.
        Vamos refazer essas duas etapas para gerar um perfil confiável.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onRedoTwo}
          className="inline-flex h-14 items-center justify-center rounded-2xl px-8 text-[#07080A] hover:brightness-110 hover:-translate-y-[1px] active:scale-[0.985] transition"
          style={{
            background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
            boxShadow: '0 12px 40px -12px rgba(184,149,90,0.6)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          Refazer grave e aguda →
        </button>
        <button
          onClick={onRedoAll}
          className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
          style={{ letterSpacing: '0.28em' }}
        >
          ↺ Refazer teste inteiro
        </button>
      </div>
    </div>
  );
}

function ResultPanel({ profile, comfortHz, onFinalize, onRestart }: {
  profile: VocalProfile; comfortHz: number; onFinalize: () => void; onRestart: () => void;
}) {
  const confLabel =
    profile.confidence === 'high' ? 'Alta' :
    profile.confidence === 'medium' ? 'Média' :
    profile.confidence === 'low' ? 'Baixa' : '—';

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
        Resultado
      </p>
      <h1
        className="mt-3 text-white"
        style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 40, lineHeight: 1.05 }}
      >
        Sua voz é <span style={{ color: '#E8C97E' }}>{profile.voiceType}</span>
      </h1>
      <p className="mt-3 text-[15px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
        Alcance detectado <b className="text-white/90">{profile.lowestNote} → {profile.highestNote}</b>
        {' · '}Região confortável <b className="text-white/90">{profile.comfortableLow} → {profile.comfortableHigh}</b>.
      </p>
      {profile.confidence && profile.confidence !== 'high' && (
        <p className="mt-2 text-[12px] text-[#B8955A]" style={{ fontWeight: 300 }}>
          Confiança da captura: {confLabel}. Você pode refazer para melhorar a precisão.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <ResultMetric label="Extensão" value={`${profile.rangeSemitones} semitons`} />
        <ResultMetric
          label="Nota confortável"
          value={profile.comfortNote ?? (comfortHz > 0 ? `${Math.round(comfortHz)} Hz` : '—')}
        />
        <ResultMetric label="Classificação" value={profile.voiceType} />
      </div>

      <div
        className="mt-8 rounded-2xl p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
          border: '1px solid rgba(184,149,90,0.2)',
        }}
      >
        <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
          Treinos recomendados
        </p>
        <p
          className="mt-2 text-white"
          style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 22 }}
        >
          {profile.recommendedExercises.length} exercícios ajustados ao seu perfil
        </p>
        <p className="mt-2 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
          Foco em respiração, afinação e {profile.rangeSemitones < 18 ? 'flexibilidade vocal' : 'controle de registro'}.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          onClick={onFinalize}
          className="inline-flex h-14 items-center justify-center rounded-2xl px-8 text-[#07080A] hover:brightness-110 hover:-translate-y-[1px] active:scale-[0.985] transition"
          style={{
            background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
            boxShadow: '0 12px 40px -12px rgba(184,149,90,0.6)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          Salvar meu perfil →
        </button>
        <button
          onClick={onRestart}
          className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
          style={{ letterSpacing: '0.28em' }}
        >
          ↺ Refazer teste
        </button>
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(184,149,90,0.14)',
      }}
    >
      <p className="text-[9px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.28em' }}>{label}</p>
      <p
        className="mt-1 text-white"
        style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 20 }}
      >
        {value}
      </p>
    </div>
  );
}

function Dot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span
      className="h-2 w-2 rounded-full"
      style={{
        background: done ? '#B8955A' : active ? '#E8C97E' : 'rgba(255,255,255,0.15)',
        boxShadow: active ? '0 0 12px rgba(232,201,126,0.7)' : undefined,
      }}
    />
  );
}
function Line() {
  return <span className="h-px flex-1" style={{ background: 'rgba(184,149,90,0.2)' }} />;
}
