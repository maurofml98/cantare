import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { store } from '@/lib/store';
import type { RepertoireProject, User } from '@/lib/types';
import { loadProjects } from '@/lib/repertoire/store';
import { greetingFor, mostRecentProject } from '@/lib/home/today';
import { repertoiresSince, usageWindowStart, USAGE_DAYS, type Usage } from '@/lib/home/usage';
import { attemptsSince } from '@/lib/treinos/progress';
import {
  CreateMusicCard,
  HealthShortcuts,
  PlayCard,
  TuningChallengeCard,
  UsagePanel,
  WeekRepertoire,
} from '@/components/home/HomeSections';
import { C, LINING, SANS, SERIF } from '@/components/home/primitives';

export const Route = createFileRoute('/_app/home')({
  component: HomePage,
});

interface HomeData {
  user: User | null;
  project: RepertoireProject | null;
  usage: Usage;
}

function readHomeData(): HomeData {
  const projects = loadProjects();
  const since = usageWindowStart();
  return {
    user: store.getUser(),
    project: mostRecentProject(projects),
    usage: { songsCreated: null, repertoires: repertoiresSince(projects, since), trainings: attemptsSince(since) },
  };
}

/**
 * Home do ecossistema (CLAUDE.md, topo e seção 14): repertório no topo, criar música, desafio
 * de afinação como porta para o treino, saúde vocal e evolução por uso do app. Treino não é a
 * cara da Home.
 */
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

  return (
    <div style={LINING} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <header className="px-1 lg:col-span-12">
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(42px, 4.4vw, 76px)', color: C.paper, lineHeight: 1 }}>
          {greetingFor()}
          {name && (
            <>
              , <em style={{ color: C.gold, fontWeight: 300 }}>{name}</em>
            </>
          )}
        </h1>
        <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 18, color: C.paper2 }}>
          Seu repertório, sua música, sua voz.
        </p>
      </header>

      {/* Faixa 1 — o público é músico: repertório primeiro */}
      <div className="min-h-[300px] lg:col-span-8">
        <WeekRepertoire project={data.project} />
      </div>
      <div className="lg:col-span-4">
        <CreateMusicCard />
      </div>

      {/* Faixa 2 — a isca do funil e os jogos */}
      <div className="lg:col-span-8">
        <TuningChallengeCard />
      </div>
      <div className="lg:col-span-4">
        <PlayCard />
      </div>

      {/* Faixa 3 */}
      <div className="lg:col-span-7">
        <HealthShortcuts />
      </div>
      <div className="lg:col-span-5">
        <UsagePanel usage={data.usage} days={USAGE_DAYS} />
      </div>
    </div>
  );
}
