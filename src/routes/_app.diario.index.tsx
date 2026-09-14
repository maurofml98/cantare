import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, Lock, Play, RotateCcw } from 'lucide-react';
import { EnvironmentCheckSheet } from '@/components/diario/EnvironmentCheckSheet';
import { ExerciseGlyph } from '@/components/diario/ExerciseGlyph';
import { Button, buttonVariants } from '@/components/ui/button';
import { NoteLadder } from '@/components/vocal/NoteLadder';
import { CinematicImage, CrossfadeImage, preloadAsset, type AssetName } from '@/components/media/CinematicImage';
import { DayRing } from '@/components/home/TodayTraining';
import { LAURY_TIP } from '@/components/home/HomeSections';
import { C, LINING, Panel, SANS, SERIF, TextLink, focusRing } from '@/components/home/primitives';
import { EXERCISE_LIST, PITCH_TARGETS, WARMUP_ID, isLocked, type ExerciseData } from '@/lib/diario/exercises';
import { isoDay, loadDiaryProgress, minutesToday, type DiaryProgress } from '@/lib/diario/progress';
import { loadWeekSummary, type WeekSummary } from '@/lib/home/today';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { noteLabelToMidi } from '@/lib/audio/pitch';

const SESSION_SIZES = '(max-width: 1024px) 100vw, 55vw';

export const Route = createFileRoute('/_app/diario/')({
  head: () => ({ links: [preloadAsset('cantare-diario-treino-bg', SESSION_SIZES)] }),
  component: DiarioPage,
});

const SEEN_KEY = 'cantare:diario:seen';

/** Cena de cada exercício: foto + recorte (object-position) no painel de foco. */
const EXERCISE_SCENE: Record<string, { name: AssetName; position: string }> = {
  '1': { name: 'cantare-aquecimento-vocal', position: '35% 30%' },
  '2': { name: 'cantare-respiracao-torax', position: '38% 40%' },
  '3': { name: 'cantare-diccao-articulacao', position: '65% 45%' },
  '4': { name: 'cantare-ressonancia-cabeca', position: '55% 40%' },
  '5': { name: 'cantare-afinacao', position: '20% 45%' },
  '6': { name: 'cantare-voz-mista', position: '55% 40%' },
  '7': { name: 'cantare-pos-show', position: '72% 40%' },
};

type RowState = 'done' | 'next' | 'available' | 'locked';

function formatDur(sec: number) {
  return sec < 60 ? `${sec} seg` : `${Math.round(sec / 60)} min`;
}

function DiarioPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<DiaryProgress | null>(null);
  const [week, setWeek] = useState<WeekSummary | null>(null);
  const [todayMin, setTodayMin] = useState(0);
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [selectedId, setSelectedId] = useState<string>(WARMUP_ID);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string[]>([]);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const refresh = useCallback(() => {
    const p = loadDiaryProgress();
    setProgress(p);
    setWeek(loadWeekSummary());
    setTodayMin(minutesToday());
    setProfile(loadVocalProfile());
    return p;
  }, []);

  const handledRef = useRef(false);

  useEffect(() => {
    const p = refresh();
    // O que foi concluído desde a última visita ganha a animação de check e um toast de contexto.
    // (ref evita rodar duas vezes no StrictMode e engolir o toast)
    if (!handledRef.current) try {
      handledRef.current = true;
      const key = `${SEEN_KEY}:${isoDay()}`;
      const stored = sessionStorage.getItem(key);
      const seen: string[] = stored ? JSON.parse(stored) : [];
      const fresh = p.completed.filter((id) => !seen.includes(id));
      if (stored !== null && fresh.length) {
        setJustDone(fresh);
        const nxt = EXERCISE_LIST.find((e) => !p.completed.includes(e.id));
        const last = EXERCISE_LIST.find((e) => e.id === fresh[fresh.length - 1]);
        if (last) {
          window.setTimeout(
            () => toast.success(`${last.name} concluído`, { description: nxt ? `Agora: ${nxt.name}.` : 'Treino do dia completo.' }),
            300,
          );
        }
      }
      sessionStorage.setItem(key, JSON.stringify(p.completed));
    } catch {
      /* sessionStorage indisponível */
    }
    const nxt = EXERCISE_LIST.find((e) => !p.completed.includes(e.id));
    setSelectedId(nxt?.id ?? EXERCISE_LIST[EXERCISE_LIST.length - 1].id);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const completed = progress?.completed ?? [];
  const total = EXERCISE_LIST.length;
  const done = EXERCISE_LIST.filter((e) => completed.includes(e.id)).length;
  const next = EXERCISE_LIST.find((e) => !completed.includes(e.id)) ?? null;
  const allDone = !next;
  const remainingSec = EXERCISE_LIST.filter((e) => !completed.includes(e.id)).reduce((s, e) => s + e.duration, 0);
  const totalMin = Math.round(EXERCISE_LIST.reduce((s, e) => s + e.duration, 0) / 60);
  const streak = progress?.streak ?? 0;
  const selected = EXERCISE_LIST.find((e) => e.id === selectedId) ?? EXERCISE_LIST[0];

  const stateOf = (id: string): RowState => {
    if (completed.includes(id)) return 'done';
    if (isLocked(id, completed)) return 'locked';
    if (next?.id === id) return 'next';
    return 'available';
  };

  const status = useMemo(() => {
    if (allDone) return { title: 'Treino concluído.', text: 'Sua voz trabalhou hoje. Agora é hidratar e descansar.' };
    if (done === 0) return { title: 'Seu treino está pronto.', text: `Hoje são ${totalMin} minutos. Vamos começar preparando sua voz.` };
    if (total - done === 1) return { title: 'Falta só mais um.', text: `Último exercício: ${next?.name}.` };
    return { title: `${done} de ${total} concluídos.`, text: `Agora: ${next?.name}. Faltam cerca de ${Math.max(1, Math.round(remainingSec / 60))} min.` };
  }, [allDone, done, total, totalMin, next, remainingSec]);

  const validatedToday = () => {
    try {
      return !!sessionStorage.getItem(`cantare:diario:validated:${isoDay()}`);
    } catch {
      return false;
    }
  };

  const openExercise = (id: string) => {
    if (startingId) return; // evita clique duplo
    if (isLocked(id, completed)) {
      setSelectedId(WARMUP_ID);
      setNudgeId(WARMUP_ID);
      const row = rowRefs.current[WARMUP_ID];
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      row?.querySelector<HTMLButtonElement>('button[data-start]')?.focus({ preventScroll: true });
      toast('Faça o aquecimento primeiro', { description: 'Ele prepara sua voz para o restante do treino.' });
      window.setTimeout(() => setNudgeId(null), 1200);
      return;
    }
    setSelectedId(id);
    setStartingId(id);
    if (validatedToday()) {
      navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: id } });
    } else {
      setPendingId(id);
      window.setTimeout(() => setStartingId(null), 250);
    }
  };

  const onValidationComplete = () => {
    try {
      sessionStorage.setItem(`cantare:diario:validated:${isoDay()}`, '1');
    } catch {
      /* ignore */
    }
    const id = pendingId;
    setPendingId(null);
    if (id) {
      setStartingId(id);
      navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: id } });
    }
  };

  if (!progress || !week) return null;

  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={LINING} className="grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:h-[calc(100dvh-3rem)] 2xl:grid-rows-[auto_minmax(0,1fr)]">
      {/* ===== Cabeçalho ===== */}
      <header className="flex flex-wrap items-end justify-between gap-4 px-1 lg:col-span-12">
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 4vw, 68px)', color: C.paper, lineHeight: 1 }}>
            Seu treino de <em style={{ color: C.gold }}>hoje</em>
          </h1>
          <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2 }}>
            Uma rotina completa para você evoluir com consistência.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3" style={{ fontFamily: SANS, fontSize: 14 }}>
          <span className="first-letter:uppercase" style={{ color: C.paper3 }}>{dateLabel}</span>
          <Link to="/diario/evolucao" className={buttonVariants({ variant: 'secondary', size: 'sm' })} title="Ver evolução">
            <StreakMark /> {streak > 0 ? `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}` : 'Comece sua sequência'}
          </Link>
        </div>
      </header>

      {/* ===== Coluna principal ===== */}
      <div className="flex min-h-0 flex-col gap-5 lg:col-span-7">
        <Panel
          glow
          bodyClassName="!p-0"
          media={
            <CinematicImage
              name="cantare-diario-treino-bg"
              priority
              kenBurns
              overlay="left"
              intensity={0.55}
              vignette={false}
              fade="left"
              position="78% 50%"
              className="!left-auto hidden w-[62%] sm:block"
              sizes={SESSION_SIZES}
            />
          }
        >
          <div className="grid grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6 xl:pr-[26%] 2xl:gap-8 2xl:p-7 2xl:pr-[30%]">
            <div className="hidden sm:block">
              <DayRing day={Math.max(1, streak || 1)} done={done} total={total} completed={EXERCISE_LIST.map((e) => completed.includes(e.id))} size={150} caption="exercícios" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <div className="shrink-0 sm:hidden">
                  <DayRing day={Math.max(1, streak || 1)} done={done} total={total} completed={EXERCISE_LIST.map((e) => completed.includes(e.id))} size={96} caption="" />
                </div>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.1 }} aria-live="polite">{status.title}</p>
              </div>
              <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 15, color: C.paper2, lineHeight: 1.5 }}>{status.text}</p>

              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2" style={{ fontFamily: SANS }}>
                <div>
                  <dt style={{ fontSize: 12, color: C.paper3 }}>Tempo total</dt>
                  <dd style={{ fontFamily: SERIF, fontSize: 22, color: C.paper }}>{totalMin} min</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, color: C.paper3 }}>{allDone ? 'Hoje' : 'Próximo'}</dt>
                  <dd style={{ fontFamily: SERIF, fontSize: 22, color: C.paper }}>{allDone ? `${todayMin} min treinados` : next?.name}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, color: C.paper3 }}>Sua faixa</dt>
                  <dd style={{ fontFamily: SERIF, fontSize: 22, color: profile ? C.gold : C.paper3 }}>
                    {profile ? `${profile.lowestNote} – ${profile.highestNote}` : 'sem teste vocal'}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {allDone ? (
                  <>
                    <Button size="lg" disabled className="disabled:opacity-80"><Check /> Treino concluído</Button>
                    <Link to="/diario/concluido" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>Ver resumo do dia</Link>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto sm:min-w-[210px]"
                    loading={!!startingId && startingId === next?.id}
                    loadingLabel="Preparando treino"
                    onClick={() => next && openExercise(next.id)}
                  >
                    <Play className="fill-current" /> {done === 0 ? 'Começar treino' : 'Continuar treino'}
                  </Button>
                )}
                {!profile && <TextLink to="/teste-vocal">Fazer teste vocal para personalizar</TextLink>}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Sequência do treino" subtitle="Toque em um exercício para ver o que seu corpo faz." labelledBy="sequencia" className="min-h-0 flex-1" bodyClassName="!pt-2">
          <ol className="flex flex-1 flex-col justify-between gap-1.5">
            {EXERCISE_LIST.map((ex, i) => {
              const st = stateOf(ex.id);
              const isSel = selectedId === ex.id;
              return (
                <li key={ex.id}>
                  <div
                    ref={(el) => {
                      rowRefs.current[ex.id] = el;
                    }}
                    className={`group relative flex items-center gap-2 rounded-[8px] pr-2 transition-[background-color,border-color,opacity] duration-[var(--dur-state)] ${st === 'locked' ? 'opacity-60' : ''} ${nudgeId === ex.id ? 'diario-nudge' : ''}`}
                    style={{
                      border: `1px solid ${isSel ? 'rgba(184,149,90,0.45)' : st === 'next' ? 'rgba(184,149,90,0.25)' : C.rule}`,
                      background: isSel ? 'rgba(184,149,90,0.06)' : st === 'next' ? 'rgba(184,149,90,0.03)' : 'rgba(255,255,255,0.012)',
                    }}
                  >
                    {st === 'next' && <span aria-hidden className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full" style={{ background: C.gold }} />}

                    <button
                      onClick={() => setSelectedId(ex.id)}
                      aria-pressed={isSel}
                      aria-label={`${ex.name}, ${formatDur(ex.duration)}, ${st === 'done' ? 'concluído' : st === 'locked' ? 'bloqueado até o aquecimento' : st === 'next' ? 'próximo' : 'disponível'}`}
                      className={`flex min-w-0 flex-1 items-center gap-3 rounded-[8px] py-2 pl-3 text-left transition-colors hover:bg-white/[0.02] 2xl:py-2.5 ${focusRing}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${justDone.includes(ex.id) ? 'diario-pop' : ''}`}
                        style={{
                          border: `1px solid ${st === 'done' || st === 'next' ? C.gold : 'rgba(232,228,220,0.2)'}`,
                          background: st === 'done' ? C.gold : 'transparent',
                          color: st === 'done' ? C.ink : st === 'next' ? C.gold : C.paper3,
                          fontFamily: SANS,
                          fontSize: 13,
                          transition: 'background-color var(--dur-state), color var(--dur-state)',
                        }}
                      >
                        {st === 'done' ? <Check size={16} strokeWidth={2.2} /> : i + 1}
                      </span>
                      <ExerciseGlyph id={ex.id} color={st === 'locked' ? C.paper3 : C.gold} className="hidden shrink-0 sm:block" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate" style={{ fontFamily: SANS, fontSize: 15, fontWeight: st === 'next' ? 500 : 400, color: st === 'done' ? C.paper2 : C.paper }}>{ex.name}</span>
                          {st === 'next' && (
                            <span className="shrink-0 rounded-[4px] px-1.5 py-0.5" style={{ fontFamily: SANS, fontSize: 11, color: C.ink, background: C.gold }}>Agora</span>
                          )}
                        </span>
                        <span className="block truncate" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3 }}>
                          {st === 'locked' ? 'Libera depois do aquecimento' : ex.objective}
                        </span>
                      </span>
                      <span className="shrink-0 pl-2 tabular-nums" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>{formatDur(ex.duration)}</span>
                    </button>

                    <Button
                      data-start
                      variant={st === 'next' ? 'primary' : st === 'done' ? 'ghost' : 'secondary'}
                      size="icon-sm"
                      loading={startingId === ex.id}
                      loadingLabel={`Abrindo ${ex.name}`}
                      onClick={() => openExercise(ex.id)}
                      aria-label={st === 'done' ? `Refazer ${ex.name}` : st === 'locked' ? `${ex.name} bloqueado: faça o aquecimento primeiro` : `Começar ${ex.name}`}
                      title={st === 'locked' ? 'Faça o aquecimento primeiro' : st === 'done' ? 'Refazer' : 'Começar'}
                    >
                      {st === 'done' ? <RotateCcw /> : st === 'locked' ? <Lock /> : <Play className="fill-current" />}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      {/* ===== Coluna de contexto ===== */}
      <div className="flex min-h-0 flex-col gap-5 lg:col-span-5">
        <FocusPanel exercise={selected} state={stateOf(selected.id)} onStart={() => openExercise(selected.id)} starting={startingId === selected.id} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Panel title="Sua evolução" action={{ to: '/diario/evolucao', label: 'Ver tudo' }} labelledBy="evo">
            <dl className="grid grid-cols-3 gap-2" style={{ fontFamily: SANS }}>
              <MiniStat value={String(streak)} label={streak === 1 ? 'dia seguido' : 'dias seguidos'} />
              <MiniStat value={String(week.exercises)} label="na semana" />
              <MiniStat value={week.accuracy !== null ? `${week.accuracy}%` : '—'} label="precisão" />
            </dl>
            {week.exercises === 0 && (
              <p className="mt-2" style={{ fontSize: 12, color: C.paper3, fontFamily: SANS }}>Conclua o primeiro exercício para começar seu histórico.</p>
            )}
          </Panel>

          <Panel title="Dica da Laury" labelledBy="dica">
            <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 17, color: C.paper, lineHeight: 1.35 }}>
              “{LAURY_TIP}”
            </blockquote>
            <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Laury · fonoaudióloga</p>
          </Panel>
        </div>

        <Panel title="Precisa de algo específico hoje?" action={{ to: '/saude', label: 'Ver todos' }} labelledBy="necessidades">
          <ul className="grid grid-cols-2 gap-2.5">
            {NEEDS.map((n) => (
              <li key={n.id}>
                <Link
                  to="/saude/$warmupId"
                  params={{ warmupId: n.id }}
                  className={`motion-lift group flex items-center gap-3 rounded-[6px] px-3 py-2.5 transition-[background-color,border-color,transform] duration-[var(--dur-hover)] hover:-translate-y-px hover:border-[rgba(184,149,90,0.45)] hover:bg-[rgba(184,149,90,0.05)] active:scale-[0.98] ${focusRing}`}
                  style={{ border: `1px solid ${C.rule}` }}
                >
                  <NeedMark kind={n.mark} />
                  <span className="min-w-0">
                    <span className="block truncate" style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>{n.title}</span>
                    <span className="block truncate text-[rgba(232,228,220,0.5)] transition-colors group-hover:text-[rgba(232,228,220,0.78)]" style={{ fontFamily: SANS, fontSize: 12 }}>{n.desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <EnvironmentCheckSheet open={pendingId !== null} onDismiss={() => setPendingId(null)} onComplete={onValidationComplete} />

      <style>{`
        @keyframes diario-nudge { 0%,100% { box-shadow: 0 0 0 0 rgba(184,149,90,0) } 40% { box-shadow: 0 0 0 4px rgba(184,149,90,0.35) } }
        .diario-nudge { animation: diario-nudge 1.1s var(--ease-out) 1; }
        @keyframes diario-pop { 0% { transform: scale(.6); opacity: .2 } 70% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        .diario-pop { animation: diario-pop 520ms var(--ease-out) 1; }
      `}</style>
    </div>
  );
}

/* ---------- painel do exercício selecionado ---------- */

function FocusPanel({ exercise, state, onStart, starting }: { exercise: ExerciseData; state: RowState; onStart: () => void; starting: boolean }) {
  const targets = PITCH_TARGETS[exercise.id];
  const scene = EXERCISE_SCENE[exercise.id] ?? EXERCISE_SCENE['1'];
  const subtitle = targets ? 'Afinação acontece na escada de notas.' : 'O que seu corpo faz neste exercício.';

  return (
    <Panel title={exercise.name} subtitle={subtitle} labelledBy="foco" className="min-h-[400px] flex-1">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* a foto troca com crossfade; fica fora do `key` para a camada antiga poder sair */}
        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[6px]" style={{ border: `1px solid ${C.rule}` }}>
          <CrossfadeImage name={scene.name} position={scene.position} overlay={targets ? 'right' : 'bottom'} intensity={targets ? 0.9 : 0.5} sizes="(max-width: 640px) 100vw, 20vw" />
          {targets && (
            <div key={exercise.id} className="relative flex h-full w-full items-stretch justify-end gap-3 px-3 py-2 animate-in fade-in duration-300">
              <div className="h-full min-h-[220px] w-[70px]">
                <NoteLadder
                  min={55}
                  max={79}
                  range={{ low: noteLabelToMidi(targets[0].note), high: Math.max(...targets.map((t) => noteLabelToMidi(t.note))) }}
                  ariaLabel={`Notas-alvo: ${[...new Set(targets.map((t) => t.note))].join(', ')}`}
                />
              </div>
              <ol className="flex flex-col justify-center gap-0.5" style={{ fontFamily: SERIF, fontSize: 17, color: C.gold }}>
                {targets.map((t, i) => <li key={i}>{t.note}</li>)}
              </ol>
            </div>
          )}
        </div>

        <div key={exercise.id} className="flex min-w-0 flex-col animate-in fade-in duration-300" style={{ fontFamily: SANS }}>
          <dl className="space-y-3">
            <Guide label="Objetivo" text={exercise.objective} />
            <Guide label="Como fazer" text={exercise.technique} />
            <Guide label="Foco" text={exercise.focus} gold />
          </dl>
          <p className="mt-4 pl-3" style={{ borderLeft: `2px solid ${C.warn}`, fontSize: 12.5, color: C.paper2, lineHeight: 1.45 }}>
            Sem forçar. Dor ou rouquidão? Pare e procure um profissional.
          </p>
          <div className="mt-auto pt-5">
            {state === 'locked' ? (
              <Button variant="secondary" onClick={onStart}><Lock /> Liberado após o aquecimento</Button>
            ) : (
              <Button variant={state === 'next' ? 'primary' : 'secondary'} onClick={onStart} loading={starting} loadingLabel="Abrindo exercício">
                {state === 'done' ? <><RotateCcw /> Refazer exercício</> : <><Play className="fill-current" /> Começar este exercício</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Guide({ label, text, gold = false }: { label: string; text: string; gold?: boolean }) {
  return (
    <div>
      <dt style={{ fontSize: 12, color: C.paper3 }}>{label}</dt>
      <dd style={{ fontSize: 15, color: gold ? C.gold : C.paper, lineHeight: 1.45 }}>{text}</dd>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt style={{ fontSize: 12, color: C.paper3 }}>{label}</dt>
      <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1 }}>{value}</dd>
    </div>
  );
}

/* ---------- necessidades ---------- */

const NEEDS = [
  { id: 'agudos', title: 'Nos agudos', desc: 'Leveza no alto', mark: 'up' as const },
  { id: 'graves', title: 'Nos graves', desc: 'Corpo e apoio', mark: 'down' as const },
  { id: 'geral', title: 'Antes do show', desc: 'Aquecimento geral', mark: 'warm' as const },
  { id: 'desaquecimento', title: 'Pós-show', desc: 'Desaquecer', mark: 'rest' as const },
];

function NeedMark({ kind }: { kind: 'up' | 'down' | 'warm' | 'rest' }) {
  const s = { stroke: C.gold, strokeWidth: 1.4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {kind === 'up' && <g className="transition-transform duration-[var(--dur-hover)] group-hover:-translate-y-0.5"><path d="M12 20V5m-5 5 5-5 5 5" {...s} /></g>}
      {kind === 'down' && <g className="transition-transform duration-[var(--dur-hover)] group-hover:translate-y-0.5"><path d="M12 4v15m-5-5 5 5 5-5" {...s} /></g>}
      {kind === 'warm' && <path d="M4 17h16M7 17c0-4 2-7 5-7s5 3 5 7M12 4v2" {...s} />}
      {kind === 'rest' && <path d="M2 10c3 0 4 6 7 6s3-4 6-4 3 3 7 3" {...s} />}
    </svg>
  );
}

function StreakMark() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
      <path d="M7 1c1 2.3.4 3.6-.7 4.8C5 7.1 4.2 8.4 4.2 10a2.8 2.8 0 0 0 5.6 0c0-1.7-.8-3-2-4.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
