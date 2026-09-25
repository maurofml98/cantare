import { Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Check, ChevronRight, MapPin, Music2, Plus } from 'lucide-react';
import type { RepertoireProject } from '@/lib/types';
import { showDateLabel, summarizeShow, type ShowPick } from '@/lib/home/shows';
import { assetSrc, assetSrcSet } from '@/components/media/CinematicImage';
import { Eyebrow, LinkButton, Skeleton } from './ui';

export type ShowsState = { status: 'loading' } | { status: 'error' } | { status: 'empty' } | { status: 'loaded'; pick: ShowPick };

/** Cores das faixas laterais dos outros shows — só identificam, a informação está no texto. */
const STRIPES = ['var(--c-coral)', 'var(--c-purple)'];

/**
 * O bloco dominante da Home: o próximo show. Maior que todos os outros, em azul, com a foto
 * de palco só como apoio.
 */
export function NextShowCard({ state }: { state: ShowsState }) {
  return (
    <section
      aria-labelledby="repertorio-titulo"
      className="relative overflow-hidden rounded-[24px] p-4 sm:p-6 lg:p-8"
      style={{ background: 'linear-gradient(135deg, #2A7BFF 0%, #176BFF 45%, #0B4FD1 100%)', boxShadow: '0 10px 30px rgba(23, 107, 255, 0.22)' }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-1 pb-4 sm:pb-5">
        <div className="min-w-0">
          <h2 id="repertorio-titulo" className="text-[28px] font-extrabold tracking-[-0.02em] text-white sm:text-[36px] lg:text-[44px]" style={{ lineHeight: 1.05 }}>
            Repertório
          </h2>
          <p className="mt-1 text-[15px] font-medium text-white/90 sm:text-[17px]">Seus shows organizados e prontos para cantar.</p>
        </div>
        {state.status === 'loaded' && (
          <Link
            to="/repertorio"
            search={{ novo: true }}
            className="c-press inline-flex min-h-[48px] items-center gap-2 rounded-[14px] px-4 text-[15px] font-bold text-white outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:px-5"
            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.85)' }}
          >
            <Plus size={18} strokeWidth={2.5} /> Novo show
          </Link>
        )}
      </header>

      {state.status === 'loading' && <LoadingBody />}
      {state.status === 'error' && <ErrorBody />}
      {state.status === 'empty' && <EmptyBody />}
      {state.status === 'loaded' && <LoadedBody pick={state.pick} />}
    </section>
  );
}

function StageImage({ className = '' }: { className?: string }) {
  return (
    <img
      src={assetSrc('cantare-home-palco', 960)}
      srcSet={assetSrcSet('cantare-home-palco')}
      sizes="(max-width: 640px) 100vw, 30vw"
      alt=""
      loading="eager"
      decoding="async"
      className={`h-full w-full rounded-[16px] object-cover ${className}`}
      // a foto é noturna; clareada para conversar com o tema claro (filtro estático, barato)
      style={{ objectPosition: '28% 40%', filter: 'brightness(1.35) saturate(1.1)' }}
    />
  );
}

function LoadedBody({ pick }: { pick: ShowPick }) {
  const { main, kind, others } = pick;
  const s = summarizeShow(main);
  const date = showDateLabel(main.date);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-5">
      <article className="grid grid-cols-1 gap-4 rounded-[20px] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:p-6">
        <div className="h-[120px] sm:order-2 sm:h-auto sm:min-h-[220px]">
          <StageImage />
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:order-1">
          <Eyebrow>{kind === 'upcoming' ? 'Próximo show' : 'Último editado'}</Eyebrow>
          <h3 className="break-words text-[28px] font-extrabold tracking-[-0.02em] sm:text-[36px]" style={{ color: 'var(--c-text)', lineHeight: 1.05 }}>
            {main.name}
          </h3>
          <ul className="flex flex-col gap-2 text-[15px] font-medium sm:text-[16px]" style={{ color: 'var(--c-text)' }}>
            {(date || main.venue) && (
              <li className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {date && <Meta icon={<CalendarDays size={18} />}>{date}</Meta>}
                {main.venue && <Meta icon={<MapPin size={18} />}>{main.venue}</Meta>}
              </li>
            )}
            <li>
              <Meta icon={<Music2 size={18} />}>
                {s.songs} {s.songs === 1 ? 'música' : 'músicas'} · {s.blocks} {s.blocks === 1 ? 'bloco' : 'blocos'}
              </Meta>
            </li>
            {s.songs > 0 && (
              <li>
                <KeysStatus missing={s.missingKeys} />
              </li>
            )}
          </ul>
          <div className="mt-auto pt-2">
            <LinkButton to="/repertorio/$projectId" params={{ projectId: main.id }} className="w-full sm:w-auto">
              Abrir repertório <ArrowRight size={18} strokeWidth={2.5} />
            </LinkButton>
          </div>
        </div>
      </article>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[15px] font-bold text-white">{others.length ? 'Outros shows' : 'Seus shows'}</p>
          <Link to="/repertorio" className="rounded-sm text-[14px] font-semibold text-white/90 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white">
            Ver todos
          </Link>
        </div>
        {others.map((p, i) => <OtherShow key={p.id} p={p} stripe={STRIPES[i % STRIPES.length]} />)}
        {others.length === 0 && (
          <Link
            to="/repertorio"
            search={{ novo: true }}
            className="c-lift flex min-h-[88px] items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-white/50 px-4 text-[15px] font-bold text-white outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          >
            <Plus size={18} /> Montar outro show
          </Link>
        )}
      </div>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden style={{ color: 'var(--c-text-2)' }}>{icon}</span>
      {children}
    </span>
  );
}

/** Estado dos tons: texto + marca (não depende só de cor). */
function KeysStatus({ missing }: { missing: number }) {
  if (missing === 0) {
    return (
      <span className="inline-flex items-center gap-2" style={{ color: 'var(--c-green-ink)' }}>
        <span aria-hidden className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: 'var(--c-green)' }}>
          <Check size={12} strokeWidth={3} color="#fff" />
        </span>
        Tons definidos
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2" style={{ color: 'var(--c-orange-ink)' }}>
      <span aria-hidden className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[12px] font-extrabold text-white" style={{ background: 'var(--c-orange)' }}>!</span>
      {missing} {missing === 1 ? 'música sem tom' : 'músicas sem tom'}
    </span>
  );
}

function OtherShow({ p, stripe }: { p: RepertoireProject; stripe: string }) {
  const s = summarizeShow(p);
  const date = showDateLabel(p.date);
  return (
    <Link
      to="/repertorio/$projectId"
      params={{ projectId: p.id }}
      className="c-lift flex min-h-[88px] items-center gap-3 rounded-[16px] bg-white py-3 pl-3 pr-3 outline-none focus-visible:ring-4 focus-visible:ring-white/70"
    >
      <span aria-hidden className="w-1 self-stretch rounded-full" style={{ background: stripe }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-bold" style={{ color: 'var(--c-text)' }}>{p.name}</span>
        {(date || p.venue) && (
          <span className="mt-0.5 block truncate text-[13px]" style={{ color: 'var(--c-text-2)' }}>
            {[date, p.venue].filter(Boolean).join(' · ')}
          </span>
        )}
        <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--c-text-2)' }}>
          {s.songs} {s.songs === 1 ? 'música' : 'músicas'} · {s.blocks} {s.blocks === 1 ? 'bloco' : 'blocos'}
        </span>
      </span>
      <ChevronRight size={20} style={{ color: 'var(--c-text-2)' }} aria-hidden />
    </Link>
  );
}

function EmptyBody() {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-[20px] bg-white p-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:p-8">
      <div className="flex flex-col justify-center gap-3">
        <Eyebrow>Primeiro passo</Eyebrow>
        <h3 className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[34px]" style={{ color: 'var(--c-text)', lineHeight: 1.08 }}>
          Seu próximo show começa aqui.
        </h3>
        <p className="text-[15px] sm:text-[17px]" style={{ color: 'var(--c-text-2)' }}>Organize músicas, tons e blocos em um só lugar.</p>
        <div className="pt-2">
          <LinkButton to="/repertorio" search={{ novo: true }} className="w-full sm:w-auto">
            <Plus size={18} strokeWidth={2.5} /> Criar primeiro repertório
          </LinkButton>
        </div>
      </div>
      <div className="h-[140px] sm:h-auto sm:min-h-[240px]">
        <StageImage />
      </div>
    </div>
  );
}

function LoadingBody() {
  return (
    <div role="status" aria-label="Carregando seus shows" className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 rounded-[20px] bg-white p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="mt-4 h-12 w-48" />
      </div>
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="h-[88px] rounded-[16px] bg-white/25" />
        <div className="h-[88px] rounded-[16px] bg-white/25" />
      </div>
    </div>
  );
}

function ErrorBody() {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[20px] bg-white p-6">
      <h3 className="text-[22px] font-extrabold" style={{ color: 'var(--c-text)' }}>Não conseguimos ler seus shows</h3>
      <p className="text-[15px]" style={{ color: 'var(--c-text-2)' }}>Os dados ficam neste aparelho. Abra o repertório para conferir.</p>
      <div>
        <LinkButton to="/repertorio">Abrir repertório</LinkButton>
      </div>
    </div>
  );
}
