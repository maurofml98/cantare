import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { loadProjects } from '@/lib/repertoire/store';
import { pickShows } from '@/lib/home/shows';
import { repertoiresSince, usageWindowStart, USAGE_DAYS } from '@/lib/home/usage';
import { attemptsSince } from '@/lib/treinos/progress';
import { loadLastChallenge } from '@/lib/desafio/afinacao';
import { preloadAsset } from '@/components/media/CinematicImage';
import { HomeHeader } from '@/components/home/claro/HomeHeader';
import { NextShowCard, type ShowsState } from '@/components/home/claro/NextShowCard';
import { CreateMusicCard } from '@/components/home/claro/CreateMusicCard';
import { PitchChallengeCard, type ChallengeState } from '@/components/home/claro/PitchChallengeCard';
import { PlayComingSoon } from '@/components/home/claro/PlayComingSoon';
import { VocalHealthCard } from '@/components/home/claro/VocalHealthCard';
import { UsageSummary, type UsageState } from '@/components/home/claro/UsageSummary';

export const Route = createFileRoute('/_app/home')({
  head: () => ({ links: [preloadAsset('cantare-home-palco', '(max-width: 640px) 100vw, 30vw')] }),
  component: HomePage,
});

interface HomeData {
  name?: string;
  shows: ShowsState;
  challenge: ChallengeState;
  usage: UsageState;
}

const LOADING: HomeData = { shows: { status: 'loading' }, challenge: { status: 'loading' }, usage: { status: 'loading' } };

/** Tudo vem do aparelho (localStorage). Cada bloco falha sozinho, sem derrubar a Home. */
function readHomeData(): HomeData {
  const name = store.getUser()?.name?.trim().split(/\s+/)[0];
  let shows: ShowsState;
  let usage: UsageState;
  try {
    const projects = loadProjects();
    const pick = pickShows(projects);
    shows = pick ? { status: 'loaded', pick } : { status: 'empty' };
    const since = usageWindowStart();
    // "músicas criadas": 0 real — a função ainda não existe
    usage = { status: 'loaded', usage: { songsCreated: 0, repertoires: repertoiresSince(projects, since), trainings: attemptsSince(since) } };
  } catch {
    shows = { status: 'error' };
    usage = { status: 'error' };
  }
  return { name, shows, usage, challenge: { status: 'loaded', last: loadLastChallenge() } };
}

/**
 * Home — nova linguagem visual (redesenho de 25/09/2026, referência `referencias/home-ref.png`).
 * Ordem da Laury: repertório (dominante), criar música, desafio de afinação, Play, saúde vocal,
 * evolução por uso. Treino não aparece aqui: vive na aba Voz.
 */
function HomePage() {
  const [data, setData] = useState<HomeData>(LOADING);
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

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 sm:gap-5">
      <HomeHeader name={data.name} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12">
        <div className="sm:col-span-2 lg:col-span-12">
          <NextShowCard state={data.shows} />
        </div>
        <div className="lg:col-span-7">
          <CreateMusicCard />
        </div>
        <div className="lg:col-span-5">
          <PitchChallengeCard state={data.challenge} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <PlayComingSoon />
        </div>
        <div className="lg:col-span-5">
          <VocalHealthCard />
        </div>
        <div className="lg:col-span-4">
          <UsageSummary state={data.usage} days={USAGE_DAYS} />
        </div>
      </div>
    </div>
  );
}
