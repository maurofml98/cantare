import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';
import { isRunnable, type TreinoExercise } from '@/lib/treinos/exercises';
import { fmtGoal, fmtU } from '@/lib/treinos/format';
import { best, goalFor, loadAttempts } from '@/lib/treinos/progress';
import { warmedUpToday } from '@/lib/treinos/warmup';

/** Peças compartilhadas pelas telas da aba Treinos (objetivos e exercícios). */

export function PageTitle({ title, text }: { title: React.ReactNode; text: string }) {
  return (
    <header className="px-1">
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 4vw, 68px)', color: C.paper, lineHeight: 1 }}>{title}</h1>
      <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2 }}>{text}</p>
    </header>
  );
}

/** Aviso de aquecimento pendente: o treino trava sem ele (CLAUDE.md, seção 10). */
export function WarmupNotice() {
  const [warm, setWarm] = useState(true);
  useEffect(() => setWarm(warmedUpToday()), []);
  if (warm) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] px-5 py-4" style={{ border: '1px solid rgba(184,149,90,0.35)', background: 'rgba(184,149,90,0.06)' }}>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.paper }}>Antes de treinar, aqueça a voz.</p>
      <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} className={`rounded-sm underline-offset-4 hover:underline ${focusRing}`} style={{ fontFamily: SANS, fontSize: 14, color: C.gold }}>
        Fazer aquecimento
      </Link>
    </div>
  );
}

/** Situação de um exercício pronto: meta vigente ou recorde. */
export function exerciseStatus(ex: TreinoExercise): string {
  if (!isRunnable(ex)) return 'Em preparação';
  const hist = loadAttempts(ex.id);
  const g = goalFor(ex, hist);
  const m = ex.engine.metric;
  if (g.kind === 'target') return g.top ? `Meta máxima: ${fmtGoal(g.value, m)}` : `Meta ${g.step} de ${g.steps}: ${fmtGoal(g.value, m)}`;
  const b = best(ex, hist);
  return b === null ? 'Primeira vez' : `Recorde: ${fmtU(b, m)}`;
}

/** Lê o histórico só no navegador (localStorage) e reavalia ao voltar para a aba. */
export function useClientValue<T>(read: () => T, fallback: T): T {
  const [v, setV] = useState(fallback);
  useEffect(() => {
    setV(read());
    const on = () => document.visibilityState === 'visible' && setV(read());
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
