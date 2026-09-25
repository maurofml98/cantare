import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF } from '@/components/home/primitives';
import { TreinoEngine } from '@/components/treinos/TreinoEngine';
import { isRunnable, TREINO_BY_ID } from '@/lib/treinos/exercises';
import { warmedUpToday } from '@/lib/treinos/warmup';
import { loadVocalProfile } from '@/lib/vocal/profile';

export const Route = createFileRoute('/treino/$exerciseId')({
  head: ({ params }) => ({
    meta: [{ title: `${TREINO_BY_ID[params.exerciseId]?.name ?? 'Treino'} — Cantare` }],
  }),
  component: TreinoPage,
});

function TreinoPage() {
  const { exerciseId } = Route.useParams();
  const ex = TREINO_BY_ID[exerciseId];
  // localStorage só existe no navegador: decide depois de montar.
  const [ready, setReady] = useState<{ warm: boolean; tested: boolean } | null>(null);
  useEffect(() => setReady({ warm: warmedUpToday(), tested: loadVocalProfile() !== null }), []);

  if (!isRunnable(ex)) return <Gate title="Treino em preparação" text="Este exercício ainda não está disponível." />;
  if (ready === null) return null;
  // Seção 10, item 2: nenhum treino vocal sem aquecimento. Vale também para quem chega pela URL.
  if (!ready.warm) return <Gate title="Aqueça a voz primeiro" text="O aquecimento vem antes de qualquer treino. Leva poucos minutos." warmup />;
  // Seção 14: o teste vocal é feito uma vez, antes do primeiro treino — depois do aquecimento,
  // porque pede o grave e o agudo (ARQUITETURA.md). Perfil antigo (detector < 3) conta como feito.
  if (!ready.tested) return <Gate title="Antes do primeiro treino, conheça sua voz" text="Um teste rápido, feito uma vez só." vocalTest={ex.id} />;
  // `key` recria o motor ao trocar de exercício (microfone, calibração e passos do zero).
  return <TreinoEngine key={ex.id} exercise={ex} />;
}

function Gate({ title, text, warmup = false, vocalTest }: { title: string; text: string; warmup?: boolean; vocalTest?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#07080A] px-6 text-center" style={{ fontFamily: SANS }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 32, color: C.paper }}>{title}</h1>
      <p style={{ fontSize: 15, color: C.paper2 }}>{text}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {warmup && (
          <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} className={buttonVariants({ size: 'lg' })}>
            Fazer aquecimento
          </Link>
        )}
        {vocalTest && (
          <Link to="/teste-vocal/executar" search={{ next: vocalTest }} className={buttonVariants({ size: 'lg' })}>
            Fazer teste vocal
          </Link>
        )}
        <Link to="/treinos" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Voltar
        </Link>
      </div>
    </div>
  );
}
