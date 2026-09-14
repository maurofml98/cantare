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
  loadWeekSummary,
  mostRecentProject,
  type DiaryToday,
  type WeekSummary,
} from '@/lib/home/today';
import { TodayTrainingCard, TrainingSequence, VoicePanel } from '@/components/home/TodayTraining';
import { EvolutionPanel, HealthShortcuts, LauryTip, WeekRepertoire } from '@/components/home/HomeSections';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';

export const Route = createFileRoute('/_app/home')({
  component: HomePage,
});

interface HomeData {
  user: User | null;
  profile: VocalProfile | null;
  project: RepertoireProject | null;
  diary: DiaryToday;
  week: WeekSummary;
}

function readHomeData(): HomeData {
  return {
    user: store.getUser(),
    profile: loadVocalProfile(),
    project: mostRecentProject(loadProjects()),
    diary: loadDiaryToday(),
    week: loadWeekSummary(),
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
  const { completedIds, streak } = data.diary;
  const done = DIARY_EXERCISES.filter((e) => completedIds.includes(e.id)).length;
  const subtitle =
    done === DIARY_EXERCISES.length
      ? 'Treino feito. Hoje sua voz merece descanso.'
      : done > 0
        ? 'Seu treino está pela metade. Bora terminar?'
        : 'Sua voz está pronta para o treino de hoje.';

  /*
   * Em telas grandes (≥1536px) a Home ocupa exatamente a altura da janela, em três faixas
   * proporcionais — cabe inteira em 1920×1080 sem scroll. Abaixo disso, flui em coluna.
   */
  return (
    <div
      style={LINING}
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:h-[calc(100dvh-3rem)] 2xl:grid-rows-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.66fr)]"
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
        <TodayTrainingCard exercises={DIARY_EXERCISES} completedIds={completedIds} day={Math.max(1, streak)} />
      </div>

      <div className="min-h-0 lg:col-span-4">
        <VoicePanel profile={data.profile} />
      </div>

      {/* Faixa 2 */}
      <div className="min-h-0 lg:col-span-4">
        <TrainingSequence exercises={DIARY_EXERCISES} completedIds={completedIds} />
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
