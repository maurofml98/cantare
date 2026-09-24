import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';
import { useReducedMotion } from '@/components/diario/session/visuals/shared';
import type { SustainResult } from '@/lib/audio/detectors';
import type { DemoStep, Metric, RunnableExercise } from '@/lib/treinos/exercises';
import { evaluate, goalFor, loadAttempts, saveAttempt, type Attempt, type Evaluation, type Goal } from '@/lib/treinos/progress';
import { dec, fmt, fmtGoal, fmtU, unit } from '@/lib/treinos/format';
import { useTreinoRun, type RunOutcome, type TreinoRun } from './useTreinoRun';

/**
 * Motor único da aba Treinos: os 8 passos da seção 09 do PDF da Laury são os estados deste
 * componente. Exercício novo é configuração em `lib/treinos/exercises.ts`, nunca tela nova.
 */

type Step = 'what' | 'how' | 'model' | 'execute' | 'feedback' | 'result' | 'goal' | 'evolution';

const STEPS: { id: Step; label: string }[] = [
  { id: 'what', label: 'O que fazer' },
  { id: 'how', label: 'Como fazer' },
  { id: 'model', label: 'Modelo' },
  { id: 'execute', label: 'Executar' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'result', label: 'Resultado' },
  { id: 'goal', label: 'Meta' },
  { id: 'evolution', label: 'Evolução' },
];

const SAFETY = 'Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.';

export function TreinoEngine({ exercise }: { exercise: RunnableExercise }) {
  const cfg = exercise.engine;
  const run = useTreinoRun(exercise);
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('what');
  const [history, setHistory] = useState<Attempt[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => setHistory(loadAttempts(exercise.id)), [exercise.id]);

  // Os 8 passos aparecem sempre (numeração da Laury); sem modelo, o passo 3 é pulado.
  const index = STEPS.findIndex((s) => s.id === step);
  const next = () => {
    const n = STEPS[index + 1]?.id;
    if (n) setStep(n === 'model' && !cfg.model ? 'execute' : n);
  };

  // Passo 5: terminou a captura → avalia contra a meta vigente e registra (antes de mostrar,
  // para a tentativa não se perder se a pessoa sair no meio do resultado).
  useEffect(() => {
    if (run.phase !== 'done' || !run.outcome) return;
    const { value } = run.outcome;
    if (value !== null) {
      const hist = loadAttempts(exercise.id);
      setEvaluation(evaluate(exercise, value, hist));
      saveAttempt(exercise.id, value);
      setHistory(loadAttempts(exercise.id));
    } else setEvaluation(null);
    setStep('feedback');
  }, [run.phase, run.outcome, exercise]);

  const retry = () => {
    setEvaluation(null);
    setStep('execute');
    run.start();
  };

  const exit = () => {
    run.cancel();
    navigate({ to: '/treinos/$objectiveId', params: { objectiveId: exercise.objective } });
  };

  const goal = goalFor(exercise, history);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#07080A] text-[#E8E4DC]" style={{ fontFamily: SANS, ...LINING }}>
      <header className="flex items-center gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <Button variant="ghost" size="sm" onClick={exit} className="-ml-2 shrink-0">
          <X /> Sair
        </Button>
        <h1 className="min-w-0 truncate" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(20px, 5vw, 30px)', lineHeight: 1.1 }}>
          {exercise.name}
        </h1>
      </header>

      <Stepper steps={STEPS} index={index} skipped={cfg.model ? null : 'model'} />

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 pb-6 pt-4">
        {step === 'what' && <WhatStep ex={exercise} goal={goal} onNext={next} />}
        {step === 'how' && <HowStep demo={cfg.how} onNext={next} />}
        {step === 'model' && cfg.model && <ModelStep src={cfg.model.src} onNext={next} />}
        {step === 'execute' && <ExecuteStep ex={exercise} run={run} goal={goal} />}
        {step === 'feedback' && run.outcome && <FeedbackStep ex={exercise} outcome={run.outcome} onNext={next} onRetry={retry} />}
        {step === 'result' && evaluation && <ResultStep ex={exercise} ev={evaluation} onNext={next} />}
        {step === 'goal' && evaluation && <GoalStep ex={exercise} ev={evaluation} onNext={next} />}
        {step === 'evolution' && <EvolutionStep ex={exercise} history={history} goal={goal} onRetry={retry} onExit={exit} />}
      </main>
    </div>
  );
}

/* ---------------- moldura ---------------- */

function Stepper({ steps, index, skipped }: { steps: { id: Step; label: string }[]; index: number; skipped: Step | null }) {
  return (
    <div className="px-4 pt-3 lg:px-8">
      <ol className="mx-auto flex max-w-[640px] gap-1" aria-label="Etapas do exercício">
        {steps.map((s, i) => (
          <li
            key={s.id}
            aria-current={i === index ? 'step' : undefined}
            className="h-[3px] flex-1 rounded-full transition-colors duration-300"
            title={s.id === skipped ? `${s.label} (não se aplica)` : s.label}
            style={{ opacity: s.id === skipped ? 0.35 : 1, background: i < index ? 'rgba(184,149,90,0.55)' : i === index ? '#E8C97E' : 'rgba(232,228,220,0.1)' }}
          />
        ))}
      </ol>
      <p className="mx-auto mt-2 max-w-[640px]" style={{ fontSize: 12, letterSpacing: '0.14em', color: C.gold }}>
        {index + 1}. {steps[index]?.label.toUpperCase()}
      </p>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">{children}</div>;
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">{children}</div>;
}

const Big = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(56px, 18vw, 96px)', lineHeight: 1, color: C.paper }}>{children}</p>
);

function GoalLine({ goal, m }: { goal: Goal; m: Metric }) {
  if (goal.kind === 'target')
    return (
      <p style={{ fontSize: 14, color: C.paper2 }}>
        Meta {goal.step} de {goal.steps}: <span style={{ color: C.gold }}>{fmtGoal(goal.value, m)}</span>
      </p>
    );
  return goal.value === null ? (
    <p style={{ fontSize: 14, color: C.paper2 }}>Primeira vez: a sua marca vira a meta.</p>
  ) : (
    <p style={{ fontSize: 14, color: C.paper2 }}>
      Seu recorde: <span style={{ color: C.gold }}>{fmtU(goal.value, m)}</span>
    </p>
  );
}

/* ---------------- 1. O que fazer ---------------- */

function WhatStep({ ex, goal, onNext }: { ex: RunnableExercise; goal: Goal; onNext: () => void }) {
  return (
    <>
      <Stage>
        <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 6vw, 34px)', lineHeight: 1.25, color: C.paper }}>{ex.engine.what}</p>
        <GoalLine goal={goal} m={ex.engine.metric} />
        {import.meta.env.DEV && ex.engine.todo?.length ? (
          <ul className="text-left" style={{ fontSize: 12, color: C.warn }}>
            {ex.engine.todo.map((t) => (
              <li key={t}>TODO(Laury): {t}</li>
            ))}
          </ul>
        ) : null}
      </Stage>
      <Actions>
        <Button size="lg" onClick={onNext}>Ver como fazer</Button>
      </Actions>
    </>
  );
}

/* ---------------- 2. Como fazer ---------------- */

/*
 * TODO(Laury/design): demonstração animada de verdade (ilustração do corpo, loop da execução).
 * Hoje é a sequência de quadros com um círculo que respira no ritmo de cada um.
 */
const DEMO_MS = 1700;

function HowStep({ demo, onNext }: { demo: DemoStep[]; onNext: () => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % demo.length), DEMO_MS);
    return () => clearInterval(id);
  }, [demo.length]);
  const cue = demo[i]?.cue;
  const scale = cue === 'inhale' ? 1 : cue === 'hold' ? 1 : cue === 'emit' ? 0.55 : cue === 'pulse' ? 0.8 : 0.8;
  return (
    <>
      <Stage>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center" aria-hidden>
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(184,149,90,0.5)',
              background: 'radial-gradient(circle, rgba(184,149,90,0.16) 0%, rgba(184,149,90,0) 70%)',
              transform: `scale(${reduced ? 1 : scale})`,
              transition: `transform ${cue === 'emit' ? DEMO_MS : 900}ms ease-in-out`,
              animation: cue === 'pulse' && !reduced ? 'treino-pulse 400ms ease-out infinite' : undefined,
            }}
          />
        </div>
        <ol className="flex flex-wrap justify-center gap-x-3 gap-y-1" aria-live="polite">
          {demo.map((d, k) => (
            <li key={k} style={{ fontSize: 15, color: k === i ? C.paper : C.paper3, transition: 'color 300ms' }}>
              {k > 0 && <span style={{ color: C.paper3, marginRight: 12 }}>→</span>}
              {d.label}
            </li>
          ))}
        </ol>
      </Stage>
      <style>{'@keyframes treino-pulse{0%{transform:scale(.72)}35%{transform:scale(.86)}100%{transform:scale(.72)}}'}</style>
      <Actions>
        <Button size="lg" onClick={onNext}>Entendi</Button>
      </Actions>
    </>
  );
}

/* ---------------- 3. Modelo ---------------- */

function ModelStep({ src, onNext }: { src: string; onNext: () => void }) {
  return (
    <>
      <Stage>
        <p style={{ fontSize: 15, color: C.paper2 }}>Ouça o modelo antes de fazer.</p>
        <audio controls src={src} className="w-full max-w-sm" />
      </Stage>
      <Actions>
        <Button size="lg" onClick={onNext}>Vamos lá</Button>
      </Actions>
    </>
  );
}

/* ---------------- 4. Executar ---------------- */

function ExecuteStep({ ex, run, goal }: { ex: RunnableExercise; run: TreinoRun; goal: Goal }) {
  const m = ex.engine.metric;
  const { phase, live } = run;

  if (phase === 'idle')
    return (
      <>
        <Stage>
          <GoalLine goal={goal} m={m} />
          <p style={{ fontSize: 13, color: C.paper3 }}>Lugar silencioso, celular a um palmo da boca. O áudio não sai do aparelho.</p>
        </Stage>
        <Actions>
          <Button size="lg" onClick={run.start}>Começar</Button>
        </Actions>
      </>
    );

  if (phase === 'opening') return <Stage><p style={{ color: C.paper2 }}>Permita o uso do microfone.</p></Stage>;

  if (phase === 'denied' || phase === 'error')
    return (
      <>
        <Stage>
          <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 300 }}>{phase === 'denied' ? 'Sem acesso ao microfone' : 'O microfone não abriu'}</p>
          <p style={{ fontSize: 14, color: C.paper2 }}>
            {phase === 'denied' ? 'Libere o microfone para este site nas configurações do navegador.' : 'Feche outros apps que usem o microfone e tente de novo.'}
          </p>
        </Stage>
        <Actions>
          <Button size="lg" onClick={run.start}>Tentar de novo</Button>
        </Actions>
      </>
    );

  if (phase === 'calibrating')
    return (
      <Stage>
        <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 300 }}>Silêncio</p>
        <p style={{ fontSize: 14, color: C.paper2 }}>Medindo o som do ambiente por 2 segundos.</p>
      </Stage>
    );

  if (phase === 'noisy')
    return (
      <>
        <Stage>
          <p style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300 }}>Ruído de fundo excessivo</p>
          <p style={{ fontSize: 14, color: C.paper2 }}>Com barulho, a medição pode sair errada.</p>
        </Stage>
        <Actions>
          <Button size="lg" onClick={run.recalibrate}>Medir de novo</Button>
          <Button size="lg" variant="ghost" onClick={run.acceptNoise}>Continuar mesmo assim</Button>
        </Actions>
      </>
    );

  if (phase === 'inhale')
    return (
      <Stage>
        <p style={{ fontSize: 15, letterSpacing: '0.14em', color: C.gold }}>INSPIRE</p>
        <Big>{live.inhaleLeft}</Big>
      </Stage>
    );

  // running (e o instante entre "done" e a troca de passo)
  return (
    <>
      <Stage>
        {ex.engine.text && (
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 6.5vw, 36px)', lineHeight: 1.3 }}>{ex.engine.text}</p>
        )}
        <LiveMeter m={m} value={live.value} emitting={live.emitting} goal={goal} />
        <Reminders list={ex.engine.reminders} />
      </Stage>
      <Actions>
        <Button size="lg" variant="secondary" onClick={run.stop}>Terminei</Button>
      </Actions>
    </>
  );
}

function LiveMeter({ m, value, emitting, goal }: { m: Metric; value: number; emitting: boolean; goal: Goal }) {
  const mark = goal.value;
  const frac = mark ? Math.min(1, value / mark) : 0;
  const reached = mark !== null && m !== 'timerSec' && value >= mark;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Big>{fmt(value, m)}</Big>
      <p style={{ fontSize: 13, color: emitting ? C.gold : C.paper3 }}>{emitting ? 'captando' : unit(m)}</p>
      {mark !== null && m !== 'timerSec' && (
        <div className="w-full max-w-sm">
          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
            <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${frac * 100}%`, background: reached ? '#E8C97E' : C.gold }} />
          </div>
          <p className="mt-2 text-right" style={{ fontSize: 12, color: reached ? '#E8C97E' : C.paper3 }}>
            {reached ? 'meta alcançada' : `meta ${fmtGoal(mark, m)}`}
          </p>
        </div>
      )}
    </div>
  );
}

function Reminders({ list }: { list?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!list || list.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % list.length), 3500);
    return () => clearInterval(id);
  }, [list]);
  if (!list?.length) return null;
  return (
    <p aria-live="polite" style={{ fontSize: 13, letterSpacing: '0.14em', color: C.gold }}>
      {list[i % list.length].toUpperCase()}
    </p>
  );
}

/* ---------------- 5. Feedback ---------------- */

function FeedbackStep({ ex, outcome, onNext, onRetry }: { ex: RunnableExercise; outcome: RunOutcome; onNext: () => void; onRetry: () => void }) {
  const m = ex.engine.metric;
  if (outcome.value === null)
    return (
      <>
        <Stage>
          <p style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 300 }}>Não captamos o som</p>
          <p style={{ fontSize: 14, color: C.paper2 }}>Aproxime o celular da boca e tente de novo.</p>
        </Stage>
        <Actions>
          <Button size="lg" onClick={onRetry}><RotateCcw /> Tentar de novo</Button>
        </Actions>
      </>
    );

  const sustain = outcome.analysis.sustain;
  const pulses = outcome.analysis.pulses;
  return (
    <>
      <Stage>
        {m === 'longestSec' && sustain && <SegmentsBar s={sustain} />}
        {m === 'longestSec' && sustain && (
          <p style={{ fontSize: 16, color: C.paper2 }}>
            {sustain.segments.length > 1
              ? `Quebrou em ${dec(sustain.firstSec)} s. Maior trecho contínuo: ${dec(sustain.longestSec)} s.`
              : `Som contínuo por ${dec(sustain.longestSec)} s.`}
          </p>
        )}
        {m === 'pulseCount' && pulses && <PulseDots onsets={pulses.onsets} />}
        {m === 'pulseCount' && pulses && <p style={{ fontSize: 16, color: C.paper2 }}>{pulses.count} pulsos.</p>}
        {m === 'timerSec' && <p style={{ fontSize: 16, color: C.paper2 }}>Do primeiro ao último som: {dec(outcome.value)} s.</p>}
      </Stage>
      <Actions>
        <Button size="lg" onClick={onNext}>Ver resultado</Button>
        <Button size="lg" variant="ghost" onClick={onRetry}><RotateCcw /> Refazer</Button>
      </Actions>
    </>
  );
}

/** Trechos de emissão numa linha do tempo: onde o som quebrou. */
function SegmentsBar({ s }: { s: SustainResult }) {
  const t0 = s.segments[0]?.[0] ?? 0;
  const end = Math.max(1, (s.segments[s.segments.length - 1]?.[1] ?? 1) - t0);
  return (
    <div className="relative h-10 w-full max-w-md" role="img" aria-label={`${s.segments.length} trecho(s) de som`}>
      <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: C.rule }} />
      {s.segments.map(([a, b], k) => (
        <div
          key={k}
          className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
          style={{ left: `${((a - t0) / end) * 100}%`, width: `${Math.max(0.8, ((b - a) / end) * 100)}%`, background: b - a === s.longestSec ? '#E8C97E' : C.gold }}
        />
      ))}
    </div>
  );
}

function PulseDots({ onsets }: { onsets: number[] }) {
  const t0 = onsets[0] ?? 0;
  const end = Math.max(0.5, (onsets[onsets.length - 1] ?? 0) - t0);
  return (
    <div className="relative h-10 w-full max-w-md" role="img" aria-label={`${onsets.length} pulsos no tempo`}>
      <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: C.rule }} />
      {onsets.map((t, k) => (
        <span key={k} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${((t - t0) / end) * 100}%`, background: C.gold }} />
      ))}
    </div>
  );
}

/* ---------------- 6. Resultado ---------------- */

function ResultStep({ ex, ev, onNext }: { ex: RunnableExercise; ev: Evaluation; onNext: () => void }) {
  const m = ex.engine.metric;
  const g = ev.goal.value;
  const lower = ex.engine.better === 'lower';
  const gap = g === null ? null : Math.abs(ev.value - g);
  return (
    <>
      <Stage>
        {ev.record && <p style={{ fontSize: 13, letterSpacing: '0.14em', color: '#E8C97E' }}>RECORDE PESSOAL</p>}
        <Big>{fmt(ev.value, m)}</Big>
        <p style={{ fontSize: 14, color: C.paper3 }}>{unit(m)}</p>
        {g !== null && (
          <>
            <CompareBars value={ev.value} mark={g} lower={lower} />
            <p style={{ fontSize: 16, color: ev.met ? '#E8C97E' : C.paper2 }}>
              {ev.met
                ? ev.goal.kind === 'target' ? 'Meta batida.' : 'Você superou sua marca.'
                : `Faltou ${fmtU(gap!, m)} para ${ev.goal.kind === 'target' ? 'a meta' : 'o recorde'}.`}
            </p>
          </>
        )}
        <p style={{ fontSize: 12, color: C.paper3 }}>{SAFETY}</p>
      </Stage>
      <Actions>
        <Button size="lg" onClick={onNext}>Próxima meta</Button>
      </Actions>
    </>
  );
}

function CompareBars({ value, mark, lower }: { value: number; mark: number; lower: boolean }) {
  const max = Math.max(value, mark) || 1;
  const rows = [
    { label: 'Você', v: value, color: '#E8C97E' },
    { label: lower ? 'Marca' : 'Meta', v: mark, color: 'rgba(232,228,220,0.25)' },
  ];
  return (
    <div className="w-full max-w-sm space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-12 text-left" style={{ fontSize: 12, color: C.paper3 }}>{r.label}</span>
          <div className="h-2 flex-1 rounded-full" style={{ background: 'rgba(232,228,220,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${(r.v / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- 7. Meta ---------------- */

function GoalStep({ ex, ev, onNext }: { ex: RunnableExercise; ev: Evaluation; onNext: () => void }) {
  const m = ex.engine.metric;
  const n = ev.next;
  return (
    <>
      <Stage>
        {n.kind === 'target' && ex.targets ? (
          <>
            <ol className="flex items-end gap-3" aria-label="Escada de metas">
              {ex.targets.map((t, k) => {
                const done = k < n.step - 1 || (n.top && k === n.step - 1);
                const cur = k === n.step - 1 && !n.top;
                return (
                  <li key={t} className="flex flex-col items-center gap-2">
                    <span style={{ fontFamily: SERIF, fontSize: cur ? 40 : 26, fontWeight: 300, color: cur ? C.paper : done ? C.gold : C.paper3 }}>{t}</span>
                    <span className="h-1 w-8 rounded-full" style={{ background: cur ? '#E8C97E' : done ? C.gold : 'rgba(232,228,220,0.1)' }} />
                  </li>
                );
              })}
            </ol>
            <p style={{ fontSize: 16, color: C.paper2 }}>
              {n.top ? 'Você chegou à meta máxima. Mantenha.' : `${ev.met ? 'Próxima meta' : 'A meta continua'}: ${fmtGoal(n.value, m)}.`}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 16, color: C.paper2 }}>
            Próxima meta: {ex.engine.better === 'lower' ? 'ficar abaixo de' : 'passar de'} <span style={{ color: C.gold }}>{fmtU(n.value ?? ev.value, m)}</span>.
          </p>
        )}
      </Stage>
      <Actions>
        <Button size="lg" onClick={onNext}>Ver evolução</Button>
      </Actions>
    </>
  );
}

/* ---------------- 8. Evolução ---------------- */

const RECENT = 12;

function EvolutionStep({ ex, history, goal, onRetry, onExit }: { ex: RunnableExercise; history: Attempt[]; goal: Goal; onRetry: () => void; onExit: () => void }) {
  const m = ex.engine.metric;
  const recent = history.slice(-RECENT);
  const max = Math.max(...recent.map((a) => a.value), goal.value ?? 0) || 1;
  return (
    <>
      <Stage>
        <div className="flex h-40 w-full max-w-md items-end gap-1.5" role="img" aria-label={`Últimas ${recent.length} tentativas`}>
          {recent.map((a, k) => (
            <div key={a.at + k} className="flex h-full flex-1 flex-col justify-end">
              <div className="rounded-t-[3px]" style={{ height: `${(a.value / max) * 100}%`, background: k === recent.length - 1 ? '#E8C97E' : 'rgba(184,149,90,0.45)' }} />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: C.paper2 }}>
          {history.length} {history.length === 1 ? 'tentativa' : 'tentativas'}
          {history.length > 0 && ` · melhor: ${fmtU(ex.engine.better === 'higher' ? Math.max(...history.map((a) => a.value)) : Math.min(...history.map((a) => a.value)), m)}`}
        </p>
      </Stage>
      <Actions>
        <Button size="lg" onClick={onRetry}><RotateCcw /> Tentar de novo</Button>
        <Button size="lg" variant="ghost" onClick={onExit}>Voltar</Button>
      </Actions>
    </>
  );
}
