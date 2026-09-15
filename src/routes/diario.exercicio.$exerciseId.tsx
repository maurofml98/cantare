import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ExerciseSession } from '@/components/diario/session/ExerciseSession';
import { EXERCISES, isLocked } from '@/lib/diario/exercises';
import { loadDiaryProgress } from '@/lib/diario/progress';

export const Route = createFileRoute('/diario/exercicio/$exerciseId')({
  head: ({ params }) => ({
    meta: [{ title: `${EXERCISES[params.exerciseId]?.name ?? 'Exercício'} — Cantare` }],
  }),
  component: ExercisePage,
});

function ExercisePage() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const ex = EXERCISES[exerciseId] ?? EXERCISES['1'];

  // Aquecimento é obrigatório: também vale para quem chega pela URL.
  useEffect(() => {
    if (isLocked(ex.id, loadDiaryProgress().completed)) {
      toast('Faça o aquecimento primeiro', { description: 'Ele prepara sua voz para o restante do treino.' });
      navigate({ to: '/diario', replace: true });
    }
  }, [ex.id, navigate]);

  // `key` recria a sessão ao trocar de exercício (relógio, microfone e métricas do zero).
  return <ExerciseSession key={ex.id} exercise={ex} />;
}
