import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { C, SANS, SERIF } from '@/components/home/primitives';
import { EXERCISE_LIST, isLocked, type ExerciseData } from '@/lib/diario/exercises';
import { loadDiaryProgress } from '@/lib/diario/progress';
import { SESSIONS, type SessionConfig, type VisualType } from '@/lib/diario/sessions';
import { profileRanges } from '@/lib/home/today';
import { loadVocalProfile } from '@/lib/vocal/profile';
import { FeedbackPanel } from './FeedbackPanel';
import { useExerciseSession, type MicState, type Session } from './useExerciseSession';
import { useReducedMotion, type VisualProps } from './visuals/shared';
import { WarmupVisual } from './visuals/WarmupVisual';
import { BreathingVisual } from './visuals/BreathingVisual';
import { CoordinationVisual } from './visuals/CoordinationVisual';
import { FlexibilityVisual } from './visuals/FlexibilityVisual';
import { PitchVisual } from './visuals/PitchVisual';
import { MixedVoiceVisual } from './visuals/MixedVoiceVisual';
import { CooldownVisual } from './visuals/CooldownVisual';

const VISUALS: Record<VisualType, React.ComponentType<VisualProps>> = {
  warmup: WarmupVisual,
  breathing: BreathingVisual,
  coordination: CoordinationVisual,
  flexibility: FlexibilityVisual,
  pitch: PitchVisual,
  mixed: MixedVoiceVisual,
  cooldown: CooldownVisual,
};

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const durationLabel = (sec: number) => (sec < 60 ? `${sec} s` : `${Math.round(sec / 60)} min`);

export function ExerciseSession({ exercise }: { exercise: ExerciseData }) {
  const cfg = SESSIONS[exercise.id];
  const session = useExerciseSession(exercise, cfg);
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<string[]>([]);
  const [range, setRange] = useState<VisualProps['range']>(null);

  useEffect(() => {
    setCompleted(loadDiaryProgress().completed);
    const profile = loadVocalProfile();
    if (profile) {
      const r = profileRanges(profile);
      setRange({ low: r.range.low, high: r.range.high, comfortLow: r.comfortable.low, comfortHigh: r.comfortable.high });
    }
  }, []);
  useEffect(() => {
    if (session.status === 'done') setCompleted(loadDiaryProgress().completed);
  }, [session.status]);

  const index = EXERCISE_LIST.findIndex((e) => e.id === exercise.id);
  const prev = EXERCISE_LIST[index - 1] ?? null;
  const next = EXERCISE_LIST[index + 1] ?? null;
  const nextLocked = next ? isLocked(next.id, completed) : false;
  const progress = Math.min(1, session.snap.elapsed / session.totalMs);
  const Visual = VISUALS[cfg.visual];

  const exit = () => navigate({ to: '/diario' });
  const goTo = (id: string) => navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: id } });
  const goNext = () => {
    if (next) goTo(next.id);
    else if (completed.length >= EXERCISE_LIST.length) navigate({ to: '/diario/concluido' });
    else exit();
  };

  const tip = useMemo(() => {
    if (session.status === 'paused') return 'Pausado. Continue quando estiver pronto.';
    if (session.status === 'done') return 'Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.';
    if (session.status === 'running') return progress < 0.5 ? cfg.tips.early : cfg.tips.late;
    return cfg.tips.idle;
  }, [session.status, progress, cfg]);

  // Atalhos: espaço inicia/pausa, Esc sai.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, button, a')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (session.status === 'idle') session.start();
        else if (session.status === 'running') session.pause();
        else if (session.status === 'paused') session.resume();
      }
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#07080A] text-[#E8E4DC] lg:overflow-hidden" style={{ fontFamily: SANS }}>
      {/* ================= Cabeçalho ================= */}
      <header className="sess-title flex items-center gap-3 px-4 pb-3 pt-3 sm:gap-5 lg:px-8 lg:pt-5">
        <Button variant="ghost" size="sm" onClick={exit} className="-ml-2 shrink-0 text-[rgba(232,228,220,0.72)]">
          <X /> Sair
        </Button>
        <span aria-hidden className="hidden h-8 w-px sm:block" style={{ background: C.rule }} />
        <div className="min-w-0">
          <p style={{ fontSize: 12.5, color: C.paper3 }}>
            Exercício {index + 1} de {EXERCISE_LIST.length}
          </p>
          <h1 className="truncate" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(22px, 1.7vw, 30px)', lineHeight: 1.1 }}>
            {exercise.name}
          </h1>
        </div>
        <ol className="ml-auto hidden w-full max-w-[520px] items-center gap-1.5 md:flex" aria-label="Progresso do treino">
          {EXERCISE_LIST.map((e, i) => {
            const isCur = i === index;
            const done = completed.includes(e.id);
            return (
              <li key={e.id} className="relative h-[4px] flex-1 overflow-hidden rounded-full" style={{ background: done && !isCur ? '#B8955A' : 'rgba(232,228,220,0.1)' }} title={`${i + 1}. ${e.name}${done ? ' · concluído' : ''}`}>
                {isCur && <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out" style={{ width: `${(session.status === 'done' ? 1 : progress) * 100}%`, background: '#E8C97E' }} />}
              </li>
            );
          })}
        </ol>
        <MicChip mic={session.mic} status={session.status} voiced={session.snap.voiced} onRetry={session.retryMic} />
      </header>

      {/* ================= Área principal ================= */}
      <main className="flex min-h-0 flex-1 flex-col px-4 pb-2 lg:px-8">
        <div
          className="flex flex-1 flex-col gap-6 lg:grid lg:min-h-0 lg:grid-cols-[minmax(290px,21%)_minmax(0,1fr)_minmax(280px,20%)] lg:gap-0 lg:overflow-hidden lg:rounded-[14px] lg:border lg:border-[rgba(232,228,220,0.08)] lg:bg-[linear-gradient(180deg,#0D0F12_0%,#08090B_100%)]"
        >
          {/* palco */}
          <section
            aria-label={`Visual do exercício ${exercise.name}`}
            className="sess-stage relative aspect-[16/11] w-full overflow-hidden rounded-[12px] sm:aspect-[16/9] lg:col-start-2 lg:row-start-1 lg:aspect-auto lg:rounded-none lg:[mask-image:linear-gradient(90deg,transparent_0%,#000_6%,#000_94%,transparent_100%)]"
          >
            <Visual exerciseId={exercise.id} cfg={cfg} session={session} reduced={reduced} range={range} />
            {session.status === 'paused' && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-[rgba(7,8,10,0.35)] pt-[6%]">
                <span className="rounded-full px-4 py-1.5" style={{ fontSize: 13, letterSpacing: '0.1em', color: C.paper, background: 'rgba(7,8,10,0.7)', border: `1px solid ${C.rule}` }}>PAUSADO</span>
              </div>
            )}
            {session.status === 'done' && <Completion exercise={exercise} next={next} session={session} cfg={cfg} remaining={EXERCISE_LIST.length - completed.length} />}
          </section>

          {/* o que fazer */}
          <aside className="sess-guide flex min-h-0 flex-col px-1 lg:col-start-1 lg:row-start-1 lg:justify-center lg:overflow-y-auto lg:px-8 lg:py-8" aria-label="Como fazer">
            <p style={{ fontSize: 12, letterSpacing: '0.12em', color: '#C9A15E' }}>O QUE FAZER</p>
            <dl className="mt-4 space-y-4">
              <Guide label="Objetivo" text={exercise.objective} />
              <Guide label="Como fazer" text={exercise.technique} emphasis />
              <div className="grid grid-cols-2 gap-4">
                <Guide label="Foco" text={exercise.focus} gold />
                <Guide label="Duração" text={durationLabel(exercise.duration)} />
              </div>
            </dl>

            {(session.status === 'idle' || session.status === 'starting') && (
              <div className="mt-6">
                <p style={{ fontSize: 12.5, color: C.paper3 }}>Antes de começar</p>
                <ul className="mt-2 space-y-1.5">
                  {cfg.before.map((b) => (
                    <li key={b} className="flex items-center gap-2.5" style={{ fontSize: 14, color: C.paper2 }}>
                      <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: '#B8955A' }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p key={tip} className="mt-7 flex gap-2.5 border-l-2 py-1 pl-3 animate-in fade-in duration-300" style={{ borderColor: session.status === 'done' || tip.includes('Pare') ? C.warn : '#B8955A', fontSize: 13.5, color: C.paper2, lineHeight: 1.5 }}>
              {tip}
            </p>
          </aside>

          {/* feedback */}
          <aside className="sess-guide flex min-h-0 flex-col px-1 lg:col-start-3 lg:row-start-1 lg:justify-center lg:border-l lg:px-7 lg:py-8" style={{ borderColor: C.rule }} aria-label="Feedback">
            <FeedbackPanel cfg={cfg} session={session} range={range} />
          </aside>
        </div>
      </main>

      {/* ================= Controle da sessão ================= */}
      <footer
        className="sess-controls sticky bottom-0 z-10 border-t border-[rgba(232,228,220,0.08)] bg-[#07080A] px-4 pt-3 lg:static lg:border-t-0 lg:bg-transparent lg:px-8 lg:pb-5"
        style={{ paddingBottom: 'calc(0.9rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6">
          <div>
            {prev && (
              <Button variant="ghost" size="md" onClick={() => goTo(prev.id)} title={`Anterior: ${prev.name}`} className="text-[rgba(232,228,220,0.72)] max-sm:px-2">
                <ChevronLeft /> <span className="hidden sm:inline">Anterior</span>
              </Button>
            )}
          </div>

          <Center session={session} next={next} nextLocked={nextLocked} onNext={goNext} dayComplete={completed.length >= EXERCISE_LIST.length} />

          <div className="flex justify-end">
            {next && session.status !== 'done' && (
              <Button
                variant="ghost"
                size="md"
                disabled={nextLocked}
                onClick={goNext}
                title={nextLocked ? 'Conclua o aquecimento para liberar' : `Próximo: ${next.name}`}
                className="text-right text-[rgba(232,228,220,0.72)] max-sm:px-2"
              >
                <span className="hidden flex-col items-end leading-tight sm:flex">
                  <span style={{ fontSize: 11.5, color: C.paper3 }}>{nextLocked ? 'Libera após o aquecimento' : 'Próximo'}</span>
                  <span>{next.name}</span>
                </span>
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Guide({ label, text, gold = false, emphasis = false }: { label: string; text: string; gold?: boolean; emphasis?: boolean }) {
  return (
    <div>
      <dt style={{ fontSize: 12.5, color: C.paper3 }}>{label}</dt>
      <dd className="mt-0.5" style={emphasis ? { fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(20px, 1.45vw, 25px)', color: C.paper, lineHeight: 1.25 } : { fontSize: 15, color: gold ? '#E8C97E' : C.paper, lineHeight: 1.45 }}>
        {text}
      </dd>
    </div>
  );
}

function Center({ session, next, nextLocked, onNext, dayComplete }: { session: Session; next: ExerciseData | null; nextLocked: boolean; onNext: () => void; dayComplete: boolean }) {
  const { status } = session;
  if (status === 'idle' || status === 'starting') {
    return (
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={session.start}
          loading={status === 'starting'}
          loadingLabel={session.mic === 'requesting' ? 'Aguardando o microfone' : 'Preparando'}
          className="group h-14 w-full max-w-[420px] text-[16px] shadow-[0_18px_40px_-18px_rgba(184,149,90,0.65)] hover:-translate-y-px sm:min-w-[340px]"
        >
          <Play className="fill-current transition-transform duration-200 group-hover:translate-x-0.5" /> Começar exercício
        </Button>
      </div>
    );
  }
  if (status === 'done') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="lg" onClick={session.restart}>
          <RotateCcw /> Repetir
        </Button>
        <Button size="lg" onClick={onNext} disabled={nextLocked} className="group min-w-[240px]">
          {next ? 'Próximo exercício' : dayComplete ? 'Ver resumo do dia' : 'Voltar ao treino'}
          <ChevronRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>
    );
  }
  const pct = Math.min(100, (session.snap.elapsed / session.totalMs) * 100);
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6">
      <div className="min-w-0 flex-1 sm:max-w-[320px]">
        <p className="flex items-baseline justify-between tabular-nums" aria-live="off">
          <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 28, lineHeight: 1 }}>{clock(session.snap.elapsed)}</span>
          <span style={{ fontSize: 13, color: C.paper3 }}>{clock(session.totalMs)}</span>
        </p>
        <div className="relative mt-2 h-[4px] rounded-full" style={{ background: 'rgba(232,228,220,0.1)' }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Tempo do exercício">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: '#E8C97E' }} />
          <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pct}%`, background: '#FFF1CF', boxShadow: '0 0 10px rgba(232,201,126,0.6)' }} />
        </div>
      </div>
      {status === 'running' ? (
        <Button variant="secondary" size="lg" onClick={session.pause} className="min-w-[132px]">
          <Pause className="fill-current" /> Pausar
        </Button>
      ) : (
        <Button size="lg" onClick={session.resume} className="min-w-[132px]">
          <Play className="fill-current" /> Continuar
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={session.restart} title="Recomeçar do início" aria-label="Recomeçar do início" className="hidden text-[rgba(232,228,220,0.6)] sm:inline-flex">
        <RotateCcw />
      </Button>
    </div>
  );
}

function Completion({ exercise, next, session, cfg, remaining }: { exercise: ExerciseData; next: ExerciseData | null; session: Session; cfg: SessionConfig; remaining: number }) {
  const acc = session.snap.accuracy;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(7,8,10,0.5)] p-4 animate-in fade-in duration-500" role="status">
      <div className="max-w-[440px] rounded-[14px] px-7 py-6 text-center sm:px-10 sm:py-8" style={{ background: 'rgba(9,10,12,0.82)', border: '1px solid rgba(184,149,90,0.3)' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" className="mx-auto" aria-hidden>
          <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(184,149,90,0.35)" strokeWidth="1.5" />
          <path d="M17 29 l7.5 7.5 L40 21" fill="none" stroke="#E8C97E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="sess-check" />
        </svg>
        <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(26px, 2.2vw, 36px)', lineHeight: 1.1 }}>Exercício concluído</p>
        <p className="mt-1.5" style={{ fontSize: 14, color: C.paper2 }}>
          {exercise.name} · {durationLabel(exercise.duration)}
          {cfg.visual === 'pitch' && acc !== null && <> · {acc}% de precisão</>}
        </p>
        <p className="mt-3" style={{ fontSize: 15, color: C.paper, lineHeight: 1.45 }}>
          {next ? (
            <>Bom trabalho. Vamos para <span style={{ color: '#E8C97E' }}>{next.name}</span>.</>
          ) : remaining <= 0 ? (
            'Treino do dia completo. Agora é hidratar e descansar.'
          ) : (
            `Bom trabalho. ${remaining === 1 ? 'Falta 1 exercício' : `Faltam ${remaining} exercícios`} do treino de hoje.`
          )}
        </p>
      </div>
    </div>
  );
}

function MicChip({ mic, status, voiced, onRetry }: { mic: MicState; status: Session['status']; voiced: boolean; onRetry: () => void }) {
  // Microfone só aparece quando precisa de atenção ou está captando.
  if (mic === 'requesting')
    return <Chip tone="neutral">Pedindo acesso ao microfone…</Chip>;
  if (mic === 'denied')
    return (
      <Chip tone="warn">
        Microfone bloqueado.{' '}
        <button type="button" onClick={onRetry} className="underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#B8955A]/70">Tentar de novo</button>
      </Chip>
    );
  if (mic === 'error')
    return (
      <Chip tone="warn">
        Não foi possível usar o microfone.{' '}
        <button type="button" onClick={onRetry} className="underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#B8955A]/70">Tentar de novo</button>
      </Chip>
    );
  if (mic === 'unsupported') return <Chip tone="warn">Este navegador não permite captar áudio</Chip>;
  if (mic === 'active' && status === 'running')
    return (
      <Chip tone="neutral">
        <span aria-hidden className="h-2 w-2 rounded-full transition-colors" style={{ background: voiced ? '#E8C97E' : 'rgba(232,228,220,0.3)' }} />
        Ouvindo
      </Chip>
    );
  return null;
}

function Chip({ tone, children }: { tone: 'neutral' | 'warn'; children: React.ReactNode }) {
  return (
    <p
      className="ml-auto flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 md:ml-0"
      role={tone === 'warn' ? 'alert' : undefined}
      style={{ fontSize: 12.5, color: tone === 'warn' ? '#E3B3A2' : C.paper2, border: `1px solid ${tone === 'warn' ? 'rgba(200,127,106,0.4)' : C.rule}`, background: tone === 'warn' ? 'rgba(200,127,106,0.08)' : 'rgba(232,228,220,0.03)' }}
    >
      {children}
    </p>
  );
}
