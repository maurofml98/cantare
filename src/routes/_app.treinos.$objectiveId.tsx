import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';
import { PageTitle, WarmupNotice, exerciseStatus, useClientValue } from '@/components/treinos/TabParts';
import { exercisesOf, groupsOf, isRunnable, OBJECTIVE_BY_ID, type ObjectiveId, type TreinoExercise } from '@/lib/treinos/exercises';

export const Route = createFileRoute('/_app/treinos/$objectiveId')({
  head: ({ params }) => ({ meta: [{ title: `${OBJECTIVE_BY_ID[params.objectiveId as ObjectiveId]?.name ?? 'Treinos'} — Cantare` }] }),
  component: ObjectivePage,
});

/**
 * Lista do objetivo, agrupada por categoria (`groupsOf`). Com mais de uma categoria aparece o
 * filtro — a lista vai crescer muito (25/09/2026). Sem categoria, a lista fica como antes.
 */
function ObjectivePage() {
  const { objectiveId } = Route.useParams();
  const objective = OBJECTIVE_BY_ID[objectiveId as ObjectiveId];
  const list = objective ? exercisesOf(objective.id) : [];
  const groups = objective ? groupsOf(objective.id) : [];
  const [filter, setFilter] = useState<string | null>(null);
  const status = useClientValue(() => Object.fromEntries(list.map((e) => [e.id, exerciseStatus(e)])), {} as Record<string, string>);
  const categorized = groups.some((g) => g.category);
  const shown = filter ? groups.filter((g) => g.category?.id === filter) : groups;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/treinos" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} -ml-3 mb-2`}>
          <ArrowLeft /> Treinos
        </Link>
        {objective ? <PageTitle title={objective.name} text={objective.desc} /> : <PageTitle title="Objetivo não encontrado" text="Escolha um dos treinos disponíveis." />}
      </div>
      <WarmupNotice />
      {groups.length > 1 && (
        <div role="group" aria-label="Categorias" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {[{ id: null, name: 'Todos' }, ...groups.flatMap((g) => (g.category ? [{ id: g.category.id, name: g.category.name }] : []))].map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id ?? 'todos'}
                onClick={() => setFilter(c.id)}
                aria-pressed={active}
                className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-2 transition-colors ${focusRing}`}
                // ativo = texto dourado + traço embaixo, sem pill colorida (docs/DESIGN.md)
                style={{ fontFamily: SANS, fontSize: 14, color: active ? C.gold : C.paper2, borderBottom: `2px solid ${active ? C.gold : 'transparent'}` }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      {shown.map((g) => (
        <section key={g.category?.id ?? 'sem-categoria'} className="flex flex-col gap-3" aria-label={g.category?.name ?? 'Exercícios'}>
          {categorized && (
            <h2 className="px-1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.1 }}>
              {g.category?.name ?? 'Outros'}
              {g.category?.desc && <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 14, color: C.paper3 }}>{g.category.desc}</span>}
            </h2>
          )}
          <ol className="flex flex-col gap-3">
            {g.exercises.map((ex, i) => (
              <ExerciseRow key={ex.id} ex={ex} n={i + 1} status={status[ex.id]} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function ExerciseRow({ ex, n, status }: { ex: TreinoExercise; n: number; status?: string }) {
  const ready = isRunnable(ex);
  const body = (
    <>
      <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: ready ? C.gold : C.paper3, lineHeight: 1, minWidth: 28 }}>{n}</span>
      <span className="min-w-0 flex-1">
        <span className="block" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.15 }}>{ex.name}</span>
        <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 14, color: ready ? C.paper2 : C.paper3 }}>
          {status ?? (ready ? '' : 'Em preparação')}
        </span>
      </span>
      {ready && <span style={{ fontFamily: SANS, fontSize: 14, color: C.gold }}>Treinar</span>}
    </>
  );
  const cls = 'flex items-center gap-5 rounded-[8px] px-5 py-4';
  const style = { border: `1px solid ${C.rule}`, background: 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)' };
  return (
    <li>
      {ready ? (
        <Link to="/treino/$exerciseId" params={{ exerciseId: ex.id }} className={`${cls} transition-colors duration-[var(--dur-hover)] hover:border-[rgba(184,149,90,0.45)] ${focusRing}`} style={style}>
          {body}
        </Link>
      ) : (
        <div className={cls} style={{ ...style, opacity: 0.62 }} aria-disabled>
          {body}
        </div>
      )}
    </li>
  );
}
