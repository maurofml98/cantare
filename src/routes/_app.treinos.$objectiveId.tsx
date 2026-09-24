import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';
import { PageTitle, WarmupNotice, exerciseStatus, useClientValue } from '@/components/treinos/TabParts';
import { exercisesOf, isRunnable, OBJECTIVE_BY_ID, type ObjectiveId } from '@/lib/treinos/exercises';

export const Route = createFileRoute('/_app/treinos/$objectiveId')({
  head: ({ params }) => ({ meta: [{ title: `${OBJECTIVE_BY_ID[params.objectiveId as ObjectiveId]?.name ?? 'Treinos'} — Cantare` }] }),
  component: ObjectivePage,
});

function ObjectivePage() {
  const { objectiveId } = Route.useParams();
  const objective = OBJECTIVE_BY_ID[objectiveId as ObjectiveId];
  const list = objective ? exercisesOf(objective.id) : [];
  const status = useClientValue(() => Object.fromEntries(list.map((e) => [e.id, exerciseStatus(e)])), {} as Record<string, string>);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/treinos" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} -ml-3 mb-2`}>
          <ArrowLeft /> Treinos
        </Link>
        {objective ? <PageTitle title={objective.name} text={objective.desc} /> : <PageTitle title="Objetivo não encontrado" text="Escolha um dos treinos disponíveis." />}
      </div>
      <WarmupNotice />
      <ol className="flex flex-col gap-3">
        {list.map((ex, i) => {
          const ready = isRunnable(ex);
          const body = (
            <>
              <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: ready ? C.gold : C.paper3, lineHeight: 1, minWidth: 28 }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.15 }}>{ex.name}</span>
                <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 14, color: ready ? C.paper2 : C.paper3 }}>
                  {status[ex.id] ?? (ready ? '' : 'Em preparação')}
                </span>
              </span>
              {ready && <span style={{ fontFamily: SANS, fontSize: 14, color: C.gold }}>Treinar</span>}
            </>
          );
          const cls = 'flex items-center gap-5 rounded-[8px] px-5 py-4';
          const style = { border: `1px solid ${C.rule}`, background: 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)' };
          return (
            <li key={ex.id}>
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
        })}
      </ol>
    </div>
  );
}
