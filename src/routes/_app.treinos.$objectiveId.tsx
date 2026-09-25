import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Accordion from '@radix-ui/react-accordion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ExerciseRow, objColor } from '@/components/voz/VoicePieces';
import { LAURY_TIP } from '@/components/home/HomeSections';
import { groupsOf, isRunnable, OBJECTIVE_BY_ID, type ObjectiveId, type TreinoExercise } from '@/lib/treinos/exercises';
import { exerciseState } from '@/lib/treinos/activity';
import { goalFor, isValidAttempt, loadAllAttempts, type Attempt } from '@/lib/treinos/progress';
import { fmtGoal, fmtU } from '@/lib/treinos/format';
import { warmedUpToday } from '@/lib/treinos/warmup';
import type { DetectMode } from '@/lib/audio/detectors';

export const Route = createFileRoute('/_app/treinos/$objectiveId')({
  head: ({ params }) => ({ meta: [{ title: `${OBJECTIVE_BY_ID[params.objectiveId as ObjectiveId]?.name ?? 'Voz'} — Cantare` }] }),
  component: ObjectivePage,
});

/** O que o app acompanha, por modo de detecção — descreve o app, não dá orientação clínica. */
const MEASURES: Record<DetectMode, string> = {
  sustain: 'quanto tempo você sustenta o som',
  pulses: 'quantos pulsos você faz',
  timer: 'quanto tempo leva para ler o texto',
  pitch: 'a altura das notas que você canta',
  intensity: 'como o volume cresce na emissão',
};

/** Uma linha: meta vigente, recorde ou "primeira vez". Meta e recorde completos ficam no exercício. */
function rowLine(ex: TreinoExercise, attempts: Attempt[]): string {
  if (!isRunnable(ex)) return 'Em preparação';
  const hist = attempts.filter((a) => a.exerciseId === ex.id && isValidAttempt(a, ex.engine.metric));
  const g = goalFor(ex, hist);
  if (g.kind === 'target') return g.top ? `Meta máxima: ${fmtGoal(g.value, ex.engine.metric)}` : `Meta atual: ${fmtGoal(g.value, ex.engine.metric)}`;
  return g.value === null ? 'Primeira vez' : `Seu recorde: ${fmtU(g.value, ex.engine.metric)}`;
}

/**
 * Interior de um objetivo (redesenho de 25/09/2026): exercícios em categorias recolhíveis — cabe
 * 3 ou 20+ sem virar lista infinita. Linha compacta; detalhe no exercício.
 */
function ObjectivePage() {
  const { objectiveId } = Route.useParams();
  const objective = OBJECTIVE_BY_ID[objectiveId as ObjectiveId];
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [warm, setWarm] = useState(true);
  useEffect(() => {
    try {
      setAttempts(loadAllAttempts());
    } catch {
      setAttempts([]);
    }
    setWarm(warmedUpToday());
  }, []);

  if (!objective) {
    return (
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-1">
        <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--c-text)' }}>Objetivo não encontrado</h1>
        <Link to="/treinos" className="c-focus w-fit rounded-sm font-bold underline underline-offset-4" style={{ color: 'var(--c-primary-ink)' }}>Voltar para Voz</Link>
      </div>
    );
  }

  const c = objColor(objective.id);
  const groups = groupsOf(objective.id);
  const all = groups.flatMap((g) => g.exercises);
  const modes = [...new Set(all.filter(isRunnable).flatMap((e) => e.detect))];
  // abertas: as categorias com exercício disponível (sem nenhuma, a primeira) — 20+ exercícios sem rolagem infinita
  const withReady = groups.filter((g) => g.exercises.some(isRunnable)).map((g) => g.category?.id ?? 'sem-categoria');
  const openByDefault = withReady.length ? withReady : groups.slice(0, 1).map((g) => g.category?.id ?? 'sem-categoria');

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <Link to="/treinos" className="c-focus mb-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] text-[14px] font-bold" style={{ color: 'var(--c-primary-ink)' }}>
            <ArrowLeft size={16} aria-hidden /> Voz
          </Link>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-9 w-1.5 rounded-full" style={{ background: c.fill }} />
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[36px]" style={{ color: 'var(--c-text)', lineHeight: 1.05 }}>{objective.name}</h1>
          </div>
          <p className="mt-1.5 text-[15px] sm:text-[16px]" style={{ color: 'var(--c-text-2)' }}>{objective.desc}</p>
        </div>
        <ThemeToggle className="mt-10 shrink-0 lg:hidden" />
      </header>

      {!warm && (
        <p className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-4 py-3 text-[15px] font-semibold" style={{ background: 'var(--c-pending-bg)', color: 'var(--c-pending-ink)' }}>
          Aqueça antes de treinar.
          <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} search={{ next: 'treinos' }} className="c-focus rounded-sm font-bold underline underline-offset-4">Fazer aquecimento</Link>
        </p>
      )}

      <Tabs.Root defaultValue="exercicios" className="flex flex-col gap-4">
        <Tabs.List aria-label={`Seções de ${objective.name}`} className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
          {[['exercicios', 'Exercícios'], ['sobre', 'Sobre'], ['dicas', 'Dicas']].map(([v, l]) => (
            <Tabs.Trigger
              key={v}
              value={v}
              className="c-focus -mb-px min-h-[48px] border-b-2 border-transparent px-4 text-[15px] font-bold text-[var(--c-text-2)] transition-colors duration-150 data-[state=active]:border-[var(--c-primary)] data-[state=active]:text-[var(--c-primary-ink)]"
            >
              {l}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="exercicios" className="outline-none">
          {attempts === null ? (
            <div role="status" aria-label="Carregando" className="h-[200px] rounded-[16px]" style={{ background: 'var(--c-surface-blue)' }} />
          ) : all.length === 0 ? (
            <p className="rounded-[16px] border border-dashed px-5 py-6 text-[15px]" style={{ borderColor: 'var(--c-line-strong)', color: 'var(--c-text-2)' }}>
              Os exercícios deste objetivo estão sendo preparados com a fonoaudióloga.
            </p>
          ) : (
            <Accordion.Root type="multiple" defaultValue={openByDefault} className="flex flex-col gap-3">
              {groups.map((g) => {
                const id = g.category?.id ?? 'sem-categoria';
                return (
                  <Accordion.Item key={id} value={id} className="overflow-hidden rounded-[16px] border" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                    <Accordion.Header>
                      <Accordion.Trigger className="c-focus group flex min-h-[56px] w-full items-center gap-3 px-4 text-left" style={{ background: c.bg }}>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-extrabold uppercase tracking-[0.04em]" style={{ color: c.ink }}>{g.category?.name ?? 'Exercícios'}</span>
                          {g.category?.desc && <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>{g.category.desc}</span>}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--c-text-2)' }}>
                          {g.exercises.length} {g.exercises.length === 1 ? 'exercício' : 'exercícios'}
                        </span>
                        <ChevronDown size={20} aria-hidden className="shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90" style={{ color: 'var(--c-text-2)' }} />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content>
                      <ul>
                        {g.exercises.map((ex) => (
                          <ExerciseRow key={ex.id} exercise={ex} objective={objective.id} line={rowLine(ex, attempts)} state={exerciseState(ex, attempts)} />
                        ))}
                      </ul>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
          )}
        </Tabs.Content>

        <Tabs.Content value="sobre" className="outline-none">
          <div className="flex flex-col gap-3 rounded-[16px] border p-5" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
            <p className="text-[16px]" style={{ color: 'var(--c-text)' }}>{objective.desc}</p>
            {modes.length > 0 && (
              <>
                <p className="text-[14px] font-bold" style={{ color: 'var(--c-text)' }}>O que o app acompanha pelo microfone</p>
                <ul className="list-disc pl-5 text-[15px]" style={{ color: 'var(--c-text-2)' }}>
                  {modes.map((m) => <li key={m}>{MEASURES[m]}</li>)}
                </ul>
              </>
            )}
            <p className="text-[13px]" style={{ color: 'var(--c-text-2)' }}>O áudio é analisado no seu aparelho e não sai dele.</p>
          </div>
        </Tabs.Content>

        <Tabs.Content value="dicas" className="outline-none">
          {/* TODO(Laury): dicas por objetivo — hoje é a dica geral provisória */}
          <figure className="rounded-[16px] border p-5" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.06em]" style={{ color: c.ink }}>Dica da fonoaudióloga</p>
            <blockquote className="mt-2 text-[17px] font-semibold" style={{ color: 'var(--c-text)', lineHeight: 1.45 }}>“{LAURY_TIP}”</blockquote>
            <figcaption className="mt-2 text-[14px]" style={{ color: 'var(--c-text-2)' }}>Laury · Fonoaudióloga, voz artística</figcaption>
          </figure>
          <p className="mt-3 px-1 text-[13px]" style={{ color: 'var(--c-text-2)' }}>Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
