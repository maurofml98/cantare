import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ObjectivesGrid, ResumeHero, SectionTitle, VocalProfileShortcut, VocalTestEntry, WarmupFirst, WarmupToday, type ObjectiveItem } from '@/components/voz/VoicePieces';
import { exercisesOf, isRunnable, OBJECTIVE_BY_ID, OBJECTIVES, TREINO_BY_ID, type RunnableExercise } from '@/lib/treinos/exercises';
import { goalFor, isValidAttempt, loadAllAttempts, type Attempt } from '@/lib/treinos/progress';
import { lastAttempt, lastByObjective, relativeDay } from '@/lib/treinos/activity';
import { fmtGoal, fmtU } from '@/lib/treinos/format';
import { warmedUpToday } from '@/lib/treinos/warmup';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';

export const Route = createFileRoute('/_app/treinos/')({
  head: () => ({ meta: [{ title: 'Voz — Cantare' }] }),
  component: VozPage,
});

interface VozData {
  warmedUp: boolean;
  attempts: Attempt[];
  profile: VocalProfile | null;
}

function readData(): VozData {
  let attempts: Attempt[] = [];
  try {
    attempts = loadAllAttempts();
  } catch {
    /* histórico ilegível: a tela segue como usuário novo */
  }
  return { warmedUp: warmedUpToday(), attempts, profile: loadVocalProfile() };
}

/** Uma linha verdadeira sobre a meta — detalhe completo fica no exercício. */
function goalLine(ex: RunnableExercise, attempts: Attempt[]): string {
  const hist = attempts.filter((a) => a.exerciseId === ex.id && isValidAttempt(a, ex.engine.metric));
  const g = goalFor(ex, hist);
  if (g.kind === 'target') return g.top ? `Meta máxima batida: ${fmtGoal(g.value, ex.engine.metric)}.` : `Meta atual: ${fmtGoal(g.value, ex.engine.metric)}.`;
  return g.value === null ? '' : `Seu recorde: ${fmtU(g.value, ex.engine.metric)}.`;
}

/**
 * Aba Voz (redesenho de 25/09/2026, referência `referencias/voz-ref.png`). Uma arquitetura, vários
 * estados: usuário novo (aquecer primeiro), usuário ativo (continuar de onde parou domina),
 * aquecimento feito ou não, com ou sem teste vocal. A regra clínica continua: treino só depois do
 * aquecimento do dia (CLAUDE.md, seção 10).
 */
function VozPage() {
  const [data, setData] = useState<VozData | null>(null);
  useEffect(() => {
    const read = () => setData(readData());
    read();
    const on = () => document.visibilityState === 'visible' && read();
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const header = (
    <header className="flex items-start justify-between gap-3 px-1">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[36px]" style={{ color: 'var(--c-text)', lineHeight: 1.05 }}>
          Cuide da sua <span style={{ color: 'var(--c-primary-ink)' }}>voz</span>
        </h1>
        <p className="mt-1 text-[15px] sm:text-[16px]" style={{ color: 'var(--c-text-2)' }}>Aqueça, treine e acompanhe sua evolução.</p>
      </div>
      <ThemeToggle className="shrink-0 lg:hidden" />
    </header>
  );

  if (!data) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5" role="status" aria-label="Carregando">
        {header}
        <div className="h-[220px] rounded-[24px]" style={{ background: 'var(--c-surface-blue)' }} />
        <div className="h-[132px] rounded-[16px]" style={{ background: 'var(--c-surface-blue)' }} />
      </div>
    );
  }

  const last = lastAttempt(data.attempts);
  const resume = last ? (TREINO_BY_ID[last.exerciseId] as RunnableExercise) : null;
  const byObjective = lastByObjective(data.attempts);
  const objectives: ObjectiveItem[] = OBJECTIVES.map((o) => {
    const ready = exercisesOf(o.id).some(isRunnable);
    const when = byObjective[o.id];
    return { id: o.id, name: o.name, desc: o.desc, ready, line: !ready ? 'Em preparação' : when ? `Último treino: ${relativeDay(when)}` : 'Ainda não iniciado' };
  });

  // Usuário ativo = já treinou e há exercício para retomar.
  if (resume && last) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 sm:gap-6">
        {header}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-5">
          <ResumeHero
            exercise={resume}
            objectiveName={OBJECTIVE_BY_ID[resume.objective].name}
            when={relativeDay(last.at)}
            goal={goalLine(resume, data.attempts)}
            warmedUp={data.warmedUp}
          />
          <WarmupToday warmedUp={data.warmedUp} />
        </div>
        <section aria-labelledby="objetivos" className="flex flex-col gap-3">
          <span id="objetivos"><SectionTitle>Escolha um objetivo</SectionTitle></span>
          <ObjectivesGrid items={objectives} />
        </section>
        <VocalProfileShortcut profile={data.profile} />
      </div>
    );
  }

  // Usuário novo: primeiro aquecer, depois escolher o objetivo, por fim conhecer a voz.
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 sm:gap-6">
      {header}
      {data.warmedUp ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="flex flex-col justify-center gap-2 rounded-[24px] p-5 text-white sm:p-7" style={{ background: 'var(--c-resume)' }}>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">Voz aquecida</p>
            <p className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[32px]" style={{ lineHeight: 1.1 }}>Agora escolha o que treinar.</p>
            <p className="text-[15px]">Os objetivos estão logo abaixo.</p>
          </section>
          <WarmupToday warmedUp />
        </div>
      ) : (
        <WarmupFirst n={1} />
      )}
      <section aria-labelledby="objetivos-novo" className="flex flex-col gap-3">
        <span id="objetivos-novo"><SectionTitle n={2}>Escolha um objetivo</SectionTitle></span>
        <ObjectivesGrid items={objectives} />
      </section>
      {data.profile ? <VocalProfileShortcut profile={data.profile} /> : <VocalTestEntry n={3} />}
    </div>
  );
}
