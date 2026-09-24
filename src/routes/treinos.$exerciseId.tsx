import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF } from '@/components/home/primitives';
import { TreinoEngine } from '@/components/treinos/TreinoEngine';
import { isRunnable, TREINO_BY_ID } from '@/lib/treinos/exercises';
import { warmedUpToday } from '@/lib/treinos/warmup';

export const Route = createFileRoute('/treinos/$exerciseId')({
  head: ({ params }) => ({
    meta: [{ title: `${TREINO_BY_ID[params.exerciseId]?.name ?? 'Treino'} — Cantare` }],
  }),
  component: TreinoPage,
});

function TreinoPage() {
  const { exerciseId } = Route.useParams();
  const ex = TREINO_BY_ID[exerciseId];
  // localStorage só existe no navegador: decide depois de montar.
  const [warm, setWarm] = useState<boolean | null>(null);
  useEffect(() => setWarm(warmedUpToday()), []);

  if (!isRunnable(ex)) return <Gate title="Treino em preparação" text="Este exercício ainda não está disponível." />;
  if (warm === null) return null;
  // Seção 10, item 2: nenhum treino vocal sem aquecimento. Vale também para quem chega pela URL.
  if (!warm) return <Gate title="Aqueça a voz primeiro" text="O aquecimento vem antes de qualquer treino. Leva poucos minutos." warmup />;
  // `key` recria o motor ao trocar de exercício (microfone, calibração e passos do zero).
  return <TreinoEngine key={ex.id} exercise={ex} />;
}

function Gate({ title, text, warmup = false }: { title: string; text: string; warmup?: boolean }) {
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
        <Link to="/home" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Voltar
        </Link>
      </div>
    </div>
  );
}
