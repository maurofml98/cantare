import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { store } from '@/lib/store';
import type { RepertoireProject, User } from '@/lib/types';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { loadProjects } from '@/lib/repertoire/store';
import { greetingFor, loadDiaryToday, loadWeekSummary, mostRecentProject, type WeekSummary } from '@/lib/home/today';
import { TodayTrainingCard, TreinoObjectives, VoicePanel, type ObjectiveRow } from '@/components/home/TodayTraining';
import { exercisesOf, isRunnable, OBJECTIVES } from '@/lib/treinos/exercises';
import { attemptsToday } from '@/lib/treinos/progress';
import { warmedUpToday } from '@/lib/treinos/warmup';
import { EvolutionPanel, HealthShortcuts, LauryTip, WeekRepertoire } from '@/components/home/HomeSections';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';
import { preloadAsset } from '@/components/media/CinematicImage';

export const Route = createFileRoute('/_app/home')({
  head: () => ({ links: [preloadAsset('cantare-home-treino-hoje', '(max-width: 768px) 100vw, 60vw')] }),
  component: HomePage,
});

interface HomeData {
  user: User | null;
  profile: VocalProfile | null;
  project: RepertoireProject | null;
  /** streak do Diário antigo — só o painel Evolução ainda usa */
  streak: number;
  week: WeekSummary;
  warmedUp: boolean;
  attemptsToday: number;
  objectives: ObjectiveRow[];
}

function readHomeData(): HomeData {
  return {
    user: store.getUser(),
    profile: loadVocalProfile(),
    project: mostRecentProject(loadProjects()),
    streak: loadDiaryToday().streak,
    week: loadWeekSummary(),
    warmedUp: warmedUpToday(),
    attemptsToday: attemptsToday(),
    objectives: OBJECTIVES.map((o) => {
      const list = exercisesOf(o.id);
      return { id: o.id, name: o.name, ready: list.filter(isRunnable).length, total: list.length };
    }),
  };
}

function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const refresh = useCallback(() => setData(readHomeData()), []);

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  if (!data?.user) return null;

  const name = data.user.name?.trim().split(/\s+/)[0];
  const { streak } = data;
  const subtitle = !data.warmedUp
    ? 'Aqueça a voz e escolha o que treinar hoje.'
    : data.attemptsToday > 0
      ? 'Bom treino hoje. Volte quando quiser superar sua marca.'
      : 'Voz aquecida. Escolha o que treinar.';

  /*
   * Em telas grandes (≥1536px de largura e ≥1000px de altura útil) a Home ocupa exatamente a altura da janela, em três faixas
   * proporcionais — cabe inteira em 1920×1080 sem scroll. Abaixo disso, flui em coluna.
   */
  return (
    <div
      style={LINING}
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:[@media(min-height:1000px)]:h-[calc(100dvh-3rem)] 2xl:[@media(min-height:1000px)]:grid-rows-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.66fr)]"
    >
      {/* Faixa 1 — saudação + treino do dia */}
      <div className="flex min-h-0 flex-col gap-5 lg:col-span-8">
        <header className="px-1">
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(42px, 4.4vw, 76px)', color: C.paper, lineHeight: 1 }}>
            {greetingFor()}
            {name && (
              <>
                , <em style={{ color: C.gold, fontWeight: 300 }}>{name}</em>
              </>
            )}
          </h1>
          <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 18, color: C.paper2 }}>
            {subtitle}
          </p>
        </header>
        <TodayTrainingCard
          warmedUp={data.warmedUp}
          attemptsToday={data.attemptsToday}
          readyObjectives={data.objectives.filter((o) => o.ready > 0).length}
          totalObjectives={data.objectives.length}
        />
      </div>

      <div className="min-h-0 lg:col-span-4">
        <VoicePanel profile={data.profile} />
      </div>

      {/* Faixa 2 */}
      <div className="min-h-0 lg:col-span-4">
        <TreinoObjectives objectives={data.objectives} />
      </div>
      <div className="min-h-0 lg:col-span-4">
        <WeekRepertoire project={data.project} />
      </div>
      <div className="min-h-0 lg:col-span-4">
        <LauryTip />
      </div>

      {/* Faixa 3 */}
      <div className="min-h-0 lg:col-span-6">
        <EvolutionPanel streak={streak} week={data.week} />
      </div>
      <div className="min-h-0 lg:col-span-6">
        <HealthShortcuts />
      </div>
    </div>
  );
}
