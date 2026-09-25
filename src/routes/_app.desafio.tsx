import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';
import { useVocalMic } from '@/components/vocal/useVocalMic';
import { createTonePlayer, type TonePlayer } from '@/lib/audio/tone';
import { foldedCents, pickTargets, RESULT_TEXT, ROUNDS, scoreRounds } from '@/lib/desafio/afinacao';
import { warmedUpToday } from '@/lib/treinos/warmup';

export const Route = createFileRoute('/_app/desafio')({
  head: () => ({ meta: [{ title: 'Desafio de afinação — Cantare' }] }),
  component: DesafioPage,
});

/** Duração da nota de referência e espera máxima pela voz em cada rodada. Provisórios. */
const TONE_SEC = 1.6;
const SING_MAX_MS = 8000;
/** folga depois da nota: o alto-falante ainda soa e o microfone (sem cancelamento de eco) ouviria */
const AFTER_TONE_MS = 250;

type Stage = 'intro' | 'mic' | 'listen' | 'sing' | 'result';

/**
 * Desafio de afinação — a isca do funil (CLAUDE.md, seção 14). Três notas: ouvir e cantar de
 * volta, em qualquer oitava. Não exige aquecimento (decisão de 25/09/2026: poucos segundos,
 * não é treino); o fim encaminha para o aquecimento antes do treino de verdade.
 *
 * Usa altura, que ainda não foi validada com voz real (seção 13).
 */
function DesafioPage() {
  const mic = useVocalMic();
  const [stage, setStage] = useState<Stage>('intro');
  const [targets, setTargets] = useState(() => pickTargets());
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState<(number | null)[]>([]);
  const errorsRef = useRef<(number | null)[]>([]);
  const [live, setLive] = useState<number | null>(null);
  const alive = useRef(false);
  const player = useRef<TonePlayer | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  // `capture` muda quando a calibração termina; a rodada roda fora do render
  const capture = useRef(mic.capture);
  capture.current = mic.capture;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancel.current?.();
      player.current?.close();
      player.current = null;
    };
  }, []);

  const playRound = async (i: number, notes: number[]) => {
    if (!alive.current || !player.current) return;
    setRound(i);
    setLive(null);
    setStage('listen');
    await player.current!.play(notes[i], TONE_SEC);
    await new Promise((r) => setTimeout(r, AFTER_TONE_MS));
    if (!alive.current) return;
    setStage('sing');
    const target = notes[i];
    let finished = false;
    const finish = (err: number | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      cancel.current?.();
      cancel.current = null;
      errorsRef.current = [...errorsRef.current, err];
      setErrors(errorsRef.current);
      if (i + 1 < notes.length) setTimeout(() => playRound(i + 1, notes), 700);
      else setStage('result');
    };
    const timer = setTimeout(() => finish(null), SING_MAX_MS);
    cancel.current = capture.current(
      'confortavel',
      (l) => setLive(l.midi === null ? null : foldedCents(l.midi, target)),
      (end) => {
        const hold = end.kind === 'done' ? end.hold : end.approx;
        finish(hold ? foldedCents(hold.midi, target) : null);
      },
    );
  };

  // sala medida → primeira nota
  useEffect(() => {
    if (stage === 'mic' && mic.phase === 'ready') playRound(0, targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mic.phase]);

  const begin = () => {
    // o player nasce no toque: iOS só libera áudio iniciado por gesto
    player.current ??= createTonePlayer();
    errorsRef.current = [];
    setErrors([]);
    if (mic.phase === 'ready') {
      playRound(0, targets);
    } else {
      setStage('mic');
      mic.start();
    }
  };

  const again = () => {
    const t = pickTargets();
    setTargets(t);
    errorsRef.current = [];
    setErrors([]);
    playRound(0, t);
  };

  return (
    <div style={LINING} className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center gap-8 px-1">
      {stage === 'intro' && <Intro onStart={begin} />}
      {stage === 'mic' && <MicPanel mic={mic} />}
      {(stage === 'listen' || stage === 'sing') && <RoundPanel stage={stage} round={round} live={live} />}
      {stage === 'result' && <ResultPanel errors={errors} onAgain={again} />}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(34px, 6vw, 52px)', color: C.paper, lineHeight: 1.05 }}>{children}</h1>;
}

function Text({ children }: { children: React.ReactNode }) {
  return <p className="mt-3" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2, lineHeight: 1.5 }}>{children}</p>;
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <Title>
        Você é <em style={{ color: C.gold }}>afinado</em>?
      </Title>
      <Text>Ouça a nota e cante de volta, na altura que for confortável. São {ROUNDS} notas.</Text>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>O áudio fica no seu aparelho.</p>
      <button onClick={onStart} className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-8 w-full sm:w-auto`}>
        Começar
      </button>
    </div>
  );
}

function MicPanel({ mic }: { mic: ReturnType<typeof useVocalMic> }) {
  const title: Record<string, string> = {
    idle: 'Preparando o microfone',
    opening: 'Permita o uso do microfone',
    calibrating: 'Silêncio por 2 segundos',
    noisy: 'Ambiente com barulho',
    contaminated: 'Captamos som no silêncio',
    denied: 'Sem acesso ao microfone',
    error: 'O microfone não abriu',
    ready: 'Pronto',
  };
  const text: Record<string, string> = {
    calibrating: 'Medindo o som do ambiente.',
    noisy: 'Com barulho, a nota pode sair errada.',
    contaminated: 'Fique 2 segundos sem falar nem soprar, e meça de novo.',
    denied: 'Libere o microfone para este site nas configurações do navegador.',
    error: 'Feche outros apps que usem o microfone e tente de novo.',
  };
  return (
    <div>
      <Title>{title[mic.phase]}</Title>
      {text[mic.phase] && <Text>{text[mic.phase]}</Text>}
      <div className="mt-8 flex flex-wrap gap-3">
        {(mic.phase === 'noisy' || mic.phase === 'contaminated') && (
          <button onClick={mic.recalibrate} className={buttonVariants({ variant: 'secondary' })}>
            Medir de novo
          </button>
        )}
        {mic.phase === 'noisy' && (
          <button onClick={mic.acceptNoise} className={buttonVariants({ variant: 'ghost' })}>
            Continuar mesmo assim
          </button>
        )}
        {(mic.phase === 'denied' || mic.phase === 'error') && (
          <button onClick={mic.start} className={buttonVariants({ variant: 'secondary' })}>
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}

/** Linha = nota-alvo; ponto = a voz agora, acima ou abaixo (±1,5 semitom visíveis). */
function RoundPanel({ stage, round, live }: { stage: 'listen' | 'sing'; round: number; live: number | null }) {
  const y = live === null ? null : 60 - (Math.max(-150, Math.min(150, live)) / 150) * 48;
  const close = live !== null && Math.abs(live) <= 25;
  return (
    <div>
      <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
        Nota {round + 1} de {ROUNDS}
      </p>
      <Title>{stage === 'listen' ? 'Ouça' : 'Agora cante'}</Title>
      <svg viewBox="0 0 320 120" className="mt-8 w-full" aria-hidden>
        <line x1="0" x2="320" y1="60" y2="60" stroke={stage === 'listen' ? C.gold : 'rgba(184,149,90,0.45)'} strokeWidth="1.5" />
        {stage === 'listen' && <circle cx="160" cy="60" r="7" fill={C.gold} className="animate-pulse" />}
        {stage === 'sing' && y !== null && (
          <circle cx="160" cy={y} r="8" fill={close ? C.gold : C.paper} style={{ transition: 'cy 90ms linear' }} />
        )}
      </svg>
      <p className="mt-4" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>
        {stage === 'listen' ? 'Guarde a nota.' : 'Segure a nota até o ponto parar na linha.'}
      </p>
    </div>
  );
}

function ResultPanel({ errors, onAgain }: { errors: (number | null)[]; onAgain: () => void }) {
  const score = scoreRounds(errors);
  if (!score) {
    return (
      <div>
        <Title>Não ouvimos sua voz</Title>
        <Text>Cante mais perto do celular, segurando cada nota por um segundo.</Text>
        <button onClick={onAgain} className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-8`}>
          Tentar de novo
        </button>
      </div>
    );
  }
  const r = RESULT_TEXT[score.band];
  // Decisão de 25/09/2026: o desafio dispensa aquecimento, o treino não (CLAUDE.md, seção 10).
  const warm = warmedUpToday();
  return (
    <div>
      <Title>{r.title}</Title>
      <Text>{r.text}</Text>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {warm ? (
          <Link to="/treinos" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            Treinar agora
          </Link>
        ) : (
          <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} search={{ next: 'treinos' }} className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            Aquecer e treinar
          </Link>
        )}
        <button onClick={onAgain} className={buttonVariants({ variant: 'ghost' })}>
          Jogar de novo
        </button>
      </div>
      {!warm && (
        <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
          Todo treino começa pelo aquecimento.
        </p>
      )}
    </div>
  );
}
