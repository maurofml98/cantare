import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { detectPitch, freqToMidi, freqToNoteLabel, noteLabelToMidi } from '@/lib/audio/pitch';
import { PitchPanel, type PitchSample, type PitchTarget } from '@/components/diario/PitchPanel';
import { SceneContext, type ScenePhase } from '@/components/scene/SceneContext';
import { getScene } from '@/components/scene/registry';
import { WarmupInstrumentHUD } from '@/components/diario/WarmupInstrumentHUD';
import { GoldButton, GhostButton } from '@/components/diario/ExerciseButtons';

export const Route = createFileRoute('/diario/exercicio/$exerciseId')({
  component: ExercisePage,
});

type ExerciseData = {
  id: string;
  name: string;
  objective: string;
  technique: string;
  duration: number; // seconds
  focus: string;
  region: 'cabeca' | 'misto' | 'peito';
};

const EXERCISES: Record<string, ExerciseData> = {
  '1': {
    id: '1',
    name: 'Aquecimento Geral',
    objective: 'Soltar tensão e preparar as cordas vocais',
    technique: 'Expire produzindo SSS... de forma contínua e controlada',
    duration: 180,
    focus: 'Suporte respiratório',
    region: 'misto',
  },
  '2': {
    id: '2',
    name: 'Respiração Profunda',
    objective: 'Ativar o diafragma e expandir capacidade pulmonar',
    technique: 'Inspire em 4 tempos, segure 4, expire em 8',
    duration: 30,
    focus: 'Diafragma',
    region: 'peito',
  },
  '3': {
    id: '3',
    name: 'Coordenação Vocal',
    objective: 'Alinhar ar e voz com controle',
    technique: 'Vibração de lábios em escala ascendente',
    duration: 120,
    focus: 'Coordenação fono-respiratória',
    region: 'misto',
  },
  '4': {
    id: '4',
    name: 'Flexibilidade Vocal',
    objective: 'Ampliar mobilidade entre registros',
    technique: 'Sirene com "U" do grave ao agudo',
    duration: 120,
    focus: 'Passaggio',
    region: 'cabeca',
  },
  '5': {
    id: '5',
    name: 'Afinação Básica',
    objective: 'Trabalhar precisão tonal',
    technique: 'Sustentar notas longas em "Ah"',
    duration: 180,
    focus: 'Precisão tonal',
    region: 'misto',
  },
  '6': {
    id: '6',
    name: 'Voz Mista',
    objective: 'Equilibrar peito e cabeça',
    technique: 'Escalas em "Ng" mantendo ressonância',
    duration: 120,
    focus: 'Mix',
    region: 'misto',
  },
  '7': {
    id: '7',
    name: 'Desaquecimento',
    objective: 'Relaxar as pregas vocais após o treino',
    technique: 'Humming suave descendente',
    duration: 120,
    focus: 'Relaxamento',
    region: 'peito',
  },
};

// Target note sequences for vocal exercises. Breathing exercises omit this.
const PITCH_TARGETS: Record<string, PitchTarget[]> = {
  '5': [
    { note: 'C4', duration: 2 },
    { note: 'E4', duration: 2 },
    { note: 'G4', duration: 2 },
    { note: 'C5', duration: 2 },
    { note: 'G4', duration: 2 },
    { note: 'E4', duration: 2 },
    { note: 'C4', duration: 2 },
  ],
};

const STORAGE_KEY = 'cantare:diario';

type Status = 'idle' | 'running' | 'paused' | 'done';

function ExercisePage() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const ex = EXERCISES[exerciseId] ?? EXERCISES['1'];
  const total = ex.duration;

  const targets = PITCH_TARGETS[ex.id];
  const isVocal = !!targets;

  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Pitch state
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  const [currentHz, setCurrentHz] = useState<number | null>(null);
  const [currentNoteLabel, setCurrentNoteLabel] = useState('—');
  const [onTarget, setOnTarget] = useState(false);
  const [pitchTime, setPitchTime] = useState(0);
  const historyRef = useRef<PitchSample[]>([]);
  const [history, setHistory] = useState<PitchSample[]>([]);
  const hitsRef = useRef({ hits: 0, samples: 0 });
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const remaining = Math.max(0, total - elapsed);
  const percent = (elapsed / total) * 100;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');

  // Compute current target midi based on elapsed time
  const currentTargetMidi = useMemo(() => {
    if (!targets) return null;
    let acc = 0;
    for (const t of targets) {
      if (elapsed < acc + t.duration) return noteLabelToMidi(t.note);
      acc += t.duration;
    }
    return null;
  }, [targets, elapsed]);

  // Timer
  useEffect(() => {
    if (status !== 'running') return;
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          window.clearInterval(tickRef.current!);
          // Compute accuracy
          const { hits, samples } = hitsRef.current;
          const acc = samples > 0 ? Math.round((hits / samples) * 100) : null;
          setAccuracy(acc);
          setStatus('done');
          markComplete(ex.id, acc, total);
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [status, total, ex.id]);

  // Mic + pitch detection
  useEffect(() => {
    if (status !== 'running') return;
    let cancelled = false;
    let lastPitchAt = 0;
    const startWall = performance.now();

    (async () => {
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const ctx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          src.connect(analyser);
          analyserRef.current = analyser;
        }

        const analyser = analyserRef.current!;
        const ctx = audioCtxRef.current!;
        const timeBuf = new Float32Array(analyser.fftSize);
        const byteBuf = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          if (!analyserRef.current) return;
          // Intensity
          analyserRef.current.getByteTimeDomainData(byteBuf);
          let sum = 0;
          for (let i = 0; i < byteBuf.length; i++) {
            const v = (byteBuf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / byteBuf.length);
          setIntensity(Math.min(1, rms * 3));

          const now = performance.now();
          const t = (now - startWall) / 1000;
          setPitchTime(t);

          if (isVocal && now - lastPitchAt > 50) {
            lastPitchAt = now;
            analyser.getFloatTimeDomainData(timeBuf);
            const freq = detectPitch(timeBuf, ctx.sampleRate);
            if (freq > 0) {
              const midi = freqToMidi(freq);
              setCurrentMidi(midi);
              setCurrentHz(freq);
              setCurrentNoteLabel(freqToNoteLabel(freq));
              const arr = historyRef.current;
              arr.push({ t, midi });
              const cutoff = t - 2;
              while (arr.length && arr[0].t < cutoff) arr.shift();
              setHistory([...arr]);

              // Accuracy: compare with current target
              let acc = 0;
              let targetMidi: number | null = null;
              for (const tg of targets!) {
                if (t < acc + tg.duration) {
                  targetMidi = noteLabelToMidi(tg.note);
                  break;
                }
                acc += tg.duration;
              }
              if (targetMidi !== null) {
                const cents = Math.abs((midi - targetMidi) * 100);
                const hit = cents <= 50;
                setOnTarget(hit);
                hitsRef.current.samples++;
                if (hit) hitsRef.current.hits++;
              }
            } else {
              setCurrentMidi(null);
              setCurrentHz(null);
              setCurrentNoteLabel('—');
              setOnTarget(false);
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.warn('Microfone indisponível', err);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, isVocal, targets]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const start = () => {
    startedAtRef.current = Date.now();
    setStatus('running');
  };
  const pause = () => {
    setPauseCount((c) => c + 1);
    setInterrupted(true);
    setStatus('paused');
  };
  const resume = () => setStatus('running');
  const restart = () => {
    setElapsed(0);
    setPauseCount(0);
    setInterrupted(false);
    setActualDuration(0);
    startedAtRef.current = null;
    historyRef.current = [];
    setHistory([]);
    hitsRef.current = { hits: 0, samples: 0 };
    setAccuracy(null);
    setCurrentMidi(null);
    setCurrentNoteLabel('—');
    setOnTarget(false);
    setStatus('idle');
  };
  const finishNow = () => {
    const dur = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : elapsed;
    setActualDuration(dur);
    const { hits, samples } = hitsRef.current;
    const acc = samples > 0 ? Math.round((hits / samples) * 100) : null;
    setAccuracy(acc);
    setInterrupted(true);
    setStatus('done');
    markComplete(ex.id, acc, dur);
  };
  const exit = () => navigate({ to: '/diario' });

  // When timer naturally reaches end
  useEffect(() => {
    if (status === 'done' && actualDuration === 0) {
      setActualDuration(
        startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : total,
      );
    }
  }, [status, actualDuration, total]);

  const index = ['1', '2', '3', '4', '5', '6', '7'].indexOf(ex.id) + 1;
  const nextId = index < 7 ? String(index + 1) : null;

  const goNext = () => {
    if (nextId) {
      navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: nextId } });
    } else {
      navigate({ to: '/diario/concluido' });
    }
  };
  const repeat = () => restart();

  const stars = !interrupted ? 3 : pauseCount <= 1 ? 2 : 1;
  const durationLabel = (() => {
    const s = actualDuration || elapsed;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
  })();

  const size = 260;
  const stroke = 2;
  const radius = size / 2 - 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;




  const regions: { key: ExerciseData['region']; label: string; sub: string }[] = [
    { key: 'cabeca', label: 'Cabeça', sub: 'Leve' },
    { key: 'misto', label: 'Misto', sub: 'Balanceado' },
    { key: 'peito', label: 'Peito', sub: 'Potente' },
  ];

  // Scene context — derived state for the visual world layer
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const scenePhase: ScenePhase =
    status === 'idle' ? 'idle'
    : status === 'done' ? 'outro'
    : percent < 8 ? 'intro'
    : percent > 88 ? 'peak'
    : 'active';
  // Ciclo respiratório 4·4·8 para o exercício de Respiração (id "2")
  const breath = useMemo(() => {
    if (ex.id !== '2') return null;
    const CYCLE = 16;
    const t = elapsed + (status === 'running' ? 0 : 0);
    const c = t % CYCLE;
    let phase: 'inspire' | 'hold' | 'expire' | 'rest';
    let prog: number;
    let amount: number;
    if (c < 4) {
      phase = 'inspire';
      prog = c / 4;
      amount = prog; // 0 → 1
    } else if (c < 8) {
      phase = 'hold';
      prog = (c - 4) / 4;
      amount = 1; // segurar cheio
    } else {
      phase = 'expire';
      prog = (c - 8) / 8;
      amount = 1 - prog; // 1 → 0
    }
    if (status !== 'running') {
      phase = 'rest';
      amount = 0.35;
    }
    // easing suave
    const eased = amount < 0.5 ? 2 * amount * amount : 1 - Math.pow(-2 * amount + 2, 2) / 2;
    return { phase, progress: prog, amount: eased };
  }, [ex.id, elapsed, status]);

  const sceneCtx = {
    phase: scenePhase,
    progress: Math.min(1, percent / 100),
    intensity,
    pitchHz: currentHz,
    accuracy: accuracy != null ? accuracy / 100 : 0,
    reducedMotion,
    breathPhase: breath?.phase,
    breathProgress: breath?.progress,
    breathAmount: breath?.amount,
  };
  const SceneComponent = getScene(ex.id);

  return (
    <SceneContext.Provider value={sceneCtx}>
    <div
      className="fixed inset-0 bg-[#07080A] text-white z-50 flex flex-col overflow-hidden"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Scene — visual world (behind everything) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <SceneComponent />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.10]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          }}
        />
      </div>
      {/* HUD + content layer */}
      <div className="relative z-10 flex flex-col h-full">

      {/* Masthead editorial — integra sair, título, tempo, hairline dourado */}
      <div className="px-6 pt-6">
        <div className="flex items-end justify-between gap-4">
          <button
            onClick={exit}
            className="group flex items-center gap-2 text-[#8A8A95] hover:text-white transition-colors"
            aria-label="Sair"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] tracking-[0.22em] uppercase" style={{ fontWeight: 400 }}>
              Sair
            </span>
          </button>

          <div className="text-center">
            <p
              className="text-[9px] uppercase text-[#B8955A]/80"
              style={{ letterSpacing: '0.32em', fontWeight: 400 }}
            >
              Ato {['I','II','III','IV','V','VI','VII'][index-1]} · de VII
            </p>
            <p
              className="mt-1 text-white"
              style={{
                fontFamily: 'Newsreader, serif',
                fontWeight: 300,
                fontSize: 17,
                letterSpacing: '0.04em',
              }}
            >
              {ex.name}
            </p>
          </div>

          {/* Indicador de captação — pulsa com intensidade da voz */}
          <div className="flex items-center gap-2 min-w-[62px] justify-end">
            {status === 'running' && (
              <>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: intensity > 0.05 ? '#E8C97E' : '#3A3A42',
                    boxShadow: intensity > 0.05
                      ? `0 0 ${6 + intensity * 14}px rgba(232,201,126,${0.5 + intensity * 0.4})`
                      : 'none',
                    transition: 'background-color 200ms, box-shadow 120ms',
                  }}
                />
                <span
                  className="text-[9px] uppercase text-[#8A8A95]"
                  style={{ letterSpacing: '0.22em', fontWeight: 400 }}
                >
                  {intensity > 0.05 ? 'Voz' : 'Silêncio'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Brass rule + progresso contínuo */}
        <div className="relative mt-4 h-px w-full">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, rgba(184,149,90,0.20) 20%, rgba(184,149,90,0.28) 50%, rgba(184,149,90,0.20) 80%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${percent}%`,
              background:
                'linear-gradient(to right, rgba(232,201,126,0.9), rgba(184,149,90,1))',
              boxShadow: `0 0 ${6 + intensity * 14}px rgba(232,201,126,${0.35 + intensity * 0.4})`,
              transition: 'width 900ms ease-out, box-shadow 200ms',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Body silhouette — oculto quando a Scene já entrega o corpo (ex.: WarmupScene) */}
        {/* Silhueta ocultada — todas as cenas usam agora o HUD instrumental unificado */}
        {false && (
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-3 pointer-events-none">
          <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
            <circle cx="40" cy="20" r="14" stroke={ex.region === 'cabeca' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
            <path d="M40 34 L40 110 M20 60 L60 60 M40 110 L25 180 M40 110 L55 180" stroke={ex.region === 'peito' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
            <ellipse cx="40" cy="80" rx="22" ry="30" stroke={ex.region === 'misto' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
          </svg>
          <div className="space-y-2 text-[10px] text-[#666677] text-center">
            {regions.map((r) => (
              <p key={r.key} className={ex.region === r.key ? 'text-[#B8955A]/70' : ''} style={{ letterSpacing: '0.08em' }}>
                {r.label} / {r.sub}
              </p>
            ))}
          </div>
        </div>
        )}

        {/* Idle: instruction */}
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center animate-in fade-in duration-500">
            <h1
              className="text-white mb-4"
              style={{
                fontFamily: 'Newsreader, serif',
                fontWeight: 300,
                fontSize: 32,
                lineHeight: 1.1,
              }}
            >
              {ex.name}
            </h1>
            <p
              className="text-[14px] text-[#888899] mb-2"
              style={{ fontWeight: 300 }}
            >
              {ex.objective}
            </p>
            <p
              className="text-[13px] text-[#666677] mb-8"
              style={{ fontWeight: 300 }}
            >
              {ex.technique}
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <span
                className="px-4 py-1.5 rounded-full text-[12px] bg-[#1E1E22] text-[#B8955A]"
                style={{ fontWeight: 400 }}
              >
                {ex.duration >= 60 ? `${Math.round(ex.duration / 60)} min` : `${ex.duration} segundos`}
              </span>
              <span
                className="px-4 py-1.5 rounded-full text-[12px] bg-[#1E1E22] text-[#888899]"
                style={{ fontWeight: 400 }}
              >
                {ex.focus}
              </span>
            </div>
          </div>
        )}

        {/* Running / Paused: timer */}
        {(status === 'running' || status === 'paused') && (
          <div className="h-full flex flex-col items-center justify-center px-4 md:px-6 gap-6 animate-in fade-in duration-500">
            {/* Timer — oculto quando a Scene tem seu próprio protagonismo visual */}
            {false && (
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#B8955A"
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-white leading-none"
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontWeight: 300,
                    fontSize: 72,
                  }}
                >
                  {mm}:{ss}
                </span>
              </div>

              {!isVocal && (
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-1.5 h-32 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#B8955A] transition-all duration-100"
                    style={{ height: `${intensity * 100}%` }}
                  />
                </div>
              )}
            </div>
            )}

            {/* Painel "Fase Atual" — exclusivo Respiração */}
            {ex.id === '2' && breath && (
              <div
                className="absolute right-4 md:right-8 top-24 md:top-1/2 md:-translate-y-1/2 w-[180px] rounded-2xl px-5 py-4"
                style={{
                  background: 'rgba(13,13,15,0.72)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(184,149,90,0.14)',
                  boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)',
                }}
              >
                <p
                  className="text-[9px] uppercase text-[#B8955A]/80"
                  style={{ letterSpacing: '0.28em', fontWeight: 400 }}
                >
                  Fase Atual
                </p>
                <p
                  className="mt-2 text-white capitalize"
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontWeight: 300,
                    fontSize: 28,
                    lineHeight: 1.1,
                  }}
                >
                  {breath.phase === 'inspire' ? 'Inspire' : breath.phase === 'hold' ? 'Segure' : breath.phase === 'expire' ? 'Expire' : 'Pausa'}
                </p>
                <div className="mt-3 flex items-baseline gap-1.5 text-[#8A8A95] text-[11px]" style={{ letterSpacing: '0.05em' }}>
                  <span className="text-[#E8C97E]" style={{ fontFamily: 'Newsreader, serif', fontSize: 18 }}>
                    {mm}:{ss}
                  </span>
                  <span>restantes</span>
                </div>
                {/* Anel de progresso da fase */}
                <div className="relative mt-3 h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#B8955A]"
                    style={{
                      width: `${(breath.progress || 0) * 100}%`,
                      transition: 'width 900ms linear',
                      boxShadow: '0 0 8px rgba(232,201,126,0.5)',
                    }}
                  />
                </div>
              </div>
            )}


            {/* Pitch panel for vocal exercises */}
            {isVocal && targets && (
              <div className="w-full max-w-2xl px-2">
                <PitchPanel
                  targets={targets}
                  currentTime={pitchTime}
                  currentMidi={currentMidi}
                  history={history}
                  currentNoteLabel={currentNoteLabel}
                  onTarget={onTarget}
                />
              </div>
            )}

            <p
              className="text-[13px] text-[#666677] italic text-center max-w-xs"
              style={{ fontWeight: 300 }}
            >
              {status === 'paused'
                ? 'Treino pausado'
                : isVocal
                  ? 'Siga as notas em dourado com sua voz'
                  : 'Mantenha a expiração constante'}
            </p>

            {status === 'paused' && (
              <div className="absolute inset-0 bg-[#07080A]/60 backdrop-blur-sm pointer-events-none" />
            )}
          </div>
        )}

        {/* Done — Result screen */}
        {status === 'done' && (
          <div className="h-full overflow-y-auto animate-in fade-in duration-500">
            <div className="max-w-md mx-auto px-6 pt-4">
              <div className="text-center">
                <h1
                  className="text-white"
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontWeight: 300,
                    fontSize: 28,
                    lineHeight: 1.2,
                  }}
                >
                  Exercício Concluído
                </h1>
                <p
                  className="text-[13px] text-[#888899] mt-1"
                  style={{ fontWeight: 300 }}
                >
                  {ex.name}
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center justify-center gap-4 mt-8">
                {[0, 1, 2].map((i) => {
                  const filled = i < stars;
                  return (
                    <svg
                      key={i}
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill={filled ? '#B8955A' : 'none'}
                      stroke={filled ? '#B8955A' : 'rgba(255,255,255,0.15)'}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      style={{
                        opacity: filled ? 1 : 0.9,
                        animation: filled
                          ? `starPop 0.5s ease-out ${i * 0.2}s both`
                          : undefined,
                      }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  );
                })}
              </div>
              <style>{`@keyframes starPop { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }`}</style>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                {[
                  { label: 'Duração', value: durationLabel },
                  { label: 'Precisão', value: accuracy !== null ? `${accuracy}%` : '—' },
                  { label: 'Sequência', value: `Dia 1 · ${index}/7`, small: true },
                  { label: 'XP Ganho', value: '+15 XP', gold: true },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: '#0D0F12' }}
                  >
                    <p
                      className="text-[11px] uppercase text-[#666677]"
                      style={{ fontWeight: 300, letterSpacing: '0.1em' }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="mt-1"
                      style={{
                        fontFamily: 'Newsreader, serif',
                        fontWeight: 600,
                        fontSize: m.small ? 18 : 24,
                        color: m.gold ? '#B8955A' : '#fff',
                        lineHeight: 1.1,
                      }}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI message */}
              <div
                className="mt-4 rounded-xl p-4 flex gap-3"
                style={{
                  backgroundColor: '#0D0F12',
                  borderLeft: '2px solid #B8955A',
                }}
              >
                <span className="text-[#B8955A] text-sm leading-none mt-0.5">♦</span>
                <p
                  className="text-[13px] text-[#B8B8C0] italic"
                  style={{ fontWeight: 300, lineHeight: 1.5 }}
                >
                  {accuracy === null
                    ? 'Bom trabalho! Você completou o exercício. Sua voz está pronta para o próximo.'
                    : accuracy >= 80
                      ? 'Excelente afinação! Sua voz seguiu bem a melodia.'
                      : accuracy >= 50
                        ? 'Boa tentativa. Foque nas notas mais agudas.'
                        : 'Continue praticando. A consistência vem com o tempo.'}
                </p>
              </div>

              {/* Actions */}
              <div
                className="mt-8 space-y-4"
                style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
              >
                <GoldButton onClick={goNext} size="lg" className="w-full">
                  {nextId ? 'Próximo exercício →' : 'Finalizar dia →'}
                </GoldButton>
                <GhostButton onClick={repeat} size="sm" className="w-full">
                  ↺ Repetir este exercício
                </GhostButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HUD instrumental unificado — todos os exercícios */}
      {status !== 'done' && (
        <WarmupInstrumentHUD
          ex={ex}
          status={status}
          intensity={intensity}
          elapsed={elapsed}
          total={total}
          onToggle={status === 'idle' ? start : status === 'running' ? pause : resume}
        />
      )}

      {/* Bottom dock antigo removido — HUD unificado assume o controle */}
      {false && (
        <div
          className="relative z-10 px-6 pt-5 pb-8"
          style={{
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
            background:
              'linear-gradient(to top, rgba(7,8,10,0.92) 0%, rgba(7,8,10,0.55) 55%, transparent 100%)',
          }}
        >
          <div className="max-w-md mx-auto">
            {/* Trilho de latão */}
            <div className="relative flex items-center gap-3 mb-5">
              <span className="text-[#B8955A]/60 text-[10px] leading-none">◆</span>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(184,149,90,0.35) 15%, rgba(184,149,90,0.45) 50%, rgba(184,149,90,0.35) 85%, transparent)',
                }}
              />
              <span
                className="text-[9px] uppercase text-[#8A8A95]"
                style={{ letterSpacing: '0.32em', fontWeight: 400 }}
              >
                {status === 'idle' ? 'Prepare-se' : status === 'running' ? 'Em cena' : 'Pausa'}
              </span>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(184,149,90,0.35) 15%, rgba(184,149,90,0.45) 50%, rgba(184,149,90,0.35) 85%, transparent)',
                }}
              />
              <span className="text-[#B8955A]/60 text-[10px] leading-none">◆</span>
            </div>

            {/* Botão principal */}
            <button
              onClick={status === 'idle' ? start : status === 'running' ? pause : resume}
              className="group relative w-full h-16 rounded-2xl text-[#07080A] transition-all active:scale-[0.985] overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
                boxShadow:
                  '0 1px 0 rgba(255,240,200,0.55) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 12px 40px -12px rgba(184,149,90,0.6)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.32em',
              }}
            >
              {/* brilho de varredura sutil */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                }}
              />
              <span className="relative uppercase">
                {status === 'idle' ? '◈ Iniciar' : status === 'running' ? '❚❚ Pausar' : '▶ Retomar'}
              </span>
            </button>

            {status !== 'idle' && (
              <div className="mt-5 flex items-center justify-center gap-10">
                <button
                  onClick={restart}
                  className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
                  style={{ letterSpacing: '0.28em', fontWeight: 400 }}
                >
                  ↺ Reiniciar
                </button>
                <span className="text-[#B8955A]/30 text-[8px]">◆</span>
                <button
                  onClick={finishNow}
                  className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
                  style={{ letterSpacing: '0.28em', fontWeight: 400 }}
                >
                  ✓ Finalizar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
    </SceneContext.Provider>
  );
}

const STATS_KEY = 'cantare:diario:stats';

function saveStats(id: string, accuracy: number | null, duration: number) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(STATS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const day = all[today] || { entries: {} };
    day.entries[id] = { accuracy, duration };
    all[today] = day;
    localStorage.setItem(STATS_KEY, JSON.stringify(all));
  } catch {}
}

function markComplete(id: string, accuracy: number | null = null, duration: number = 0) {
  saveStats(id, accuracy, duration);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const p = raw
      ? JSON.parse(raw)
      : { date: today, completed: [], streak: 0, lastCompletedDate: null };
    if (p.date !== today) {
      p.date = today;
      p.completed = [];
    }
    if (!p.completed.includes(id)) p.completed.push(id);
    if (p.completed.length === 7 && p.lastCompletedDate !== today) {
      p.streak = p.lastCompletedDate === yesterday ? (p.streak || 0) + 1 : 1;
      p.lastCompletedDate = today;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}
