import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { store } from '@/lib/store';
import type { RepertoireProject, User } from '@/lib/types';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { loadProjects } from '@/lib/repertoire/store';
import {
  DIARY_EXERCISES,
  greetingFor,
  loadDiaryToday,
  loadWeeklyAccuracy,
  mostRecentProject,
  type DiaryToday,
} from '@/lib/home/today';
import { TodayTrainingCard, TrainingSequence } from '@/components/home/TodayTraining';
import { EvolutionSummary, HealthShortcuts, LauryTip, RecentProject } from '@/components/home/HomeSections';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';

export const Route = createFileRoute('/_app/home')({
  component: HomePage,
});

interface HomeData {
  user: User | null;
  profile: VocalProfile | null;
  project: RepertoireProject | null;
  diary: DiaryToday;
  accuracy: number | null;
}

function readHomeData(): HomeData {
  return {
    user: store.getUser(),
    profile: loadVocalProfile(),
    project: mostRecentProject(loadProjects()),
    diary: loadDiaryToday(),
    accuracy: loadWeeklyAccuracy(),
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

  const firstName = data.user.name?.trim().split(/\s+/)[0];
  const { completedIds, streak } = data.diary;
  const allDone = DIARY_EXERCISES.every((e) => completedIds.includes(e.id));

  return (
    <div className="mx-auto w-full max-w-6xl pb-8" style={LINING}>
      <header className="mb-7 sm:mb-10">
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 9vw, 68px)', color: C.paper, lineHeight: 1 }}>
          {greetingFor()}
          {firstName && (
            <>
              , <em style={{ color: C.gold }}>{firstName}</em>
            </>
          )}
        </h1>
        <p className="mt-3" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: C.paper2 }}>
          {allDone
            ? 'Treino feito. Agora é descansar a voz.'
            : completedIds.length > 0
              ? 'Seu treino está pela metade.'
              : 'Comece pelo aquecimento. Sua voz agradece.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
          <TodayTrainingCard exercises={DIARY_EXERCISES} completedIds={completedIds} profile={data.profile} />
          <TrainingSequence exercises={DIARY_EXERCISES} completedIds={completedIds} />
        </div>

        <div className="space-y-10 lg:col-span-5">
          <HealthShortcuts />
          <RecentProject project={data.project} />
          <LauryTip />
          <EvolutionSummary streak={streak} accuracy={data.accuracy} />
        </div>
      </div>
    </div>
  );
}
