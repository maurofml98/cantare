import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { store } from '../lib/store';
import { User } from '../lib/types';
import { usePortal } from '../components/PortalTransition';
import heroStage from '@/assets/home-hero-stage.jpg';
import cardEnsaio from '@/assets/card-ensaio.jpg';
import cardCorpo from '@/assets/card-corpo.jpg';
import cardRepertorio from '@/assets/card-repertorio.jpg';
import cardPalco from '@/assets/card-palco.jpg';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { loadProjects as loadRepertoireProjects } from '@/lib/repertoire/store';
import type { RepertoireProject } from '@/lib/types';
import {
  getRepertoireSummary,
  getHomePrimaryAction,
  getNextExerciseProgress,
} from '@/lib/home/summary';

const DIARIO_EXERCISES = [
  { id: '1', name: 'Aquecimento Geral' },
  { id: '2', name: 'Respiração Profunda' },
  { id: '3', name: 'Coordenação Vocal' },
  { id: '4', name: 'Flexibilidade Vocal' },
  { id: '5', name: 'Afinação Básica' },
  { id: '6', name: 'Voz Mista' },
  { id: '7', name: 'Desaquecimento' },
];

export const Route = createFileRoute('/_app/home')({
  component: HomePage,
});

const GOLD = '#B8955A';
const INK = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.42)';
const DIM = 'rgba(232,228,220,0.22)';
const SERIF = 'Cormorant Garamond, serif';
const SANS = 'DM Sans, sans-serif';

function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [vocalProfile, setVocalProfile] = useState<VocalProfile | null>(null);
  const [repertoire, setRepertoire] = useState<RepertoireProject[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ completedToday: 0, streak: 1, weekly: [0, 0, 0, 0, 0, 0, 0] });
  const { enter } = usePortal();

  const refreshHomeData = useCallback(() => {
    setUser(store.getUser());
    setVocalProfile(loadVocalProfile());
    setRepertoire(loadRepertoireProjects());
    try {
      const raw = localStorage.getItem('cantare:diario');
      if (raw) {
        const p = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        const isToday = p.date === today;
        setCompletedIds(isToday && Array.isArray(p.completed) ? p.completed : []);
        setStats((s) => ({
          ...s,
          completedToday: isToday ? (p.completed?.length || 0) : 0,
          streak: p.streak || 1,
        }));
      } else {
        setCompletedIds([]);
      }
      const wraw = localStorage.getItem('cantare:diario:stats');
      if (wraw) {
        const w = JSON.parse(wraw);
        if (Array.isArray(w?.weekly)) setStats((s) => ({ ...s, weekly: w.weekly.slice(-7) }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshHomeData();
    const onFocus = () => refreshHomeData();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshHomeData();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshHomeData]);

  const day = stats.streak || 1;
  const completed = stats.completedToday;
  const total = 7;
  const progress = completed / total;

  const repSummary = useMemo(() => getRepertoireSummary(repertoire), [repertoire]);
  const nextExercise = useMemo(
    () => getNextExerciseProgress(completedIds, DIARIO_EXERCISES),
    [completedIds],
  );
  const primaryAction = useMemo(
    () => getHomePrimaryAction(vocalProfile, repertoire, { completedToday: completed, total }),
    [vocalProfile, repertoire, completed],
  );

  if (!user) return null;
  const hasRepertoire = repSummary.projectCount > 0;

  const nav = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    enter(to, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <div className="animate-slide-in space-y-6">
      {/* HERO — stage image with day counter overlaid */}
      <section
        className="relative overflow-hidden animate-card-in"
        style={{
          borderRadius: 8,
          border: '1px solid rgba(232,228,220,0.05)',
          boxShadow: '0 40px 80px -40px rgba(0,0,0,0.8)',
          animationDelay: '0.05s',
        }}
      >
        <img
          src={heroStage}
          alt=""
          className="w-full object-cover"
          style={{ height: 'clamp(220px, 34vh, 340px)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(7,8,10,0.95) 0%, rgba(7,8,10,0.4) 45%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="px-8 md:px-12 w-full flex items-start justify-between gap-6">
            <div>
              <p style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.32em', color: DIM, textTransform: 'uppercase' }}>
                Hoje
              </p>
              <div className="flex items-baseline gap-5 mt-3">
                <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(56px, 8vw, 96px)', color: INK, lineHeight: 0.9 }}>
                  Dia <em style={{ fontStyle: 'italic', color: GOLD }}>{toRoman(day)}</em>
                </h1>
                <ProgressBadge value={completed} total={total} />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>
                  Seu ensaio de hoje
                </p>
              </div>
            </div>

            {/* Streak card, top right, desktop only */}
            <div className="hidden lg:block">
              <StreakCard streak={day} weekly={stats.weekly} />
            </div>
          </div>
        </div>
      </section>

      {/* Streak card mobile/tablet */}
      <div className="lg:hidden">
        <StreakCard streak={day} weekly={stats.weekly} />
      </div>

      {/* 4 IDENTITY CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <IdentityCard
          image={cardEnsaio}
          label="Ensaio"
          value={String(total - completed)}
          unit={total - completed === 1 ? 'exercício' : 'exercícios'}
          progress={progress}
          onClick={nav('/diario')}
          delay="0.15s"
        />
        <IdentityCard
          image={cardCorpo}
          label="Corpo"
          value=""
          unit="Preparação vocal"
          onClick={nav('/saude')}
          delay="0.2s"
        />
        <IdentityCard
          image={cardRepertorio}
          label="Repertório"
          value={String(repSummary.projectCount)}
          unit={repSummary.projectCount === 1 ? 'projeto' : 'projetos'}
          onClick={nav('/repertorio')}
          delay="0.25s"
        />
        <IdentityCard
          image={cardPalco}
          label="Palco"
          value={String(day)}
          unit={day === 1 ? 'dia seguido' : 'dias seguidos'}
          onClick={nav('/diario/evolucao')}
          delay="0.3s"
        />
      </section>

      {/* CONTEXTO — Perfil Vocal · Repertório · Próximo treino */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-card-in" style={{ animationDelay: '0.32s' }}>
        <VocalProfileMiniCard profile={vocalProfile} onClick={nav('/teste-vocal')} />
        <RepertoireMiniCard
          summary={repSummary}
          onClick={nav('/repertorio')}
        />
        <NextTrainingMiniCard
          done={nextExercise.done}
          total={nextExercise.total}
          nextName={nextExercise.nextName}
          onClick={nav('/diario')}
        />
      </section>

      {/* PRÓXIMO PASSO — action bar (dinâmico) */}
      <NextStepBar
        title={primaryAction.label}
        subtitle={primaryAction.reason}
        buttonLabel={primaryAction.label}
        onClick={nav(primaryAction.to)}
      />

      {/* CONTINUE DE ONDE PAROU */}
      {hasRepertoire && (
        <section className="animate-card-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4 px-1">
            <p style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.32em', color: DIM, textTransform: 'uppercase' }}>
              Continue de onde parou
            </p>
            <a
              href="/repertorio"
              onClick={nav('/repertorio')}
              style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.24em', color: MUTED, textTransform: 'uppercase' }}
              className="hover:text-[#E8E4DC] transition-colors"
            >
              Ver todos
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Aquecimento Geral', 'Ressonância', 'Dicção', 'Relaxamento'].map((title, i) => (
              <ContinueCard
                key={title}
                title={title}
                minutes={[3, 2, 4, 2][i]}
                image={[cardEnsaio, cardCorpo, cardRepertorio, cardPalco][i]}
                onClick={nav('/diario')}
                delay={`${0.45 + i * 0.05}s`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============ COMPONENTS ============ */

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let r = '', v = n;
  for (const [num, ch] of map) while (v >= num) { r += ch; v -= num; }
  return r || 'I';
}

function ProgressBadge({ value, total }: { value: number; total: number }) {
  const p = value / total;
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} stroke="rgba(232,228,220,0.1)" strokeWidth="1.5" fill="none" />
        <circle
          cx="28" cy="28" r={r}
          stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: SANS, fontSize: 11, color: INK, letterSpacing: '0.02em' }}>
          {value}/{total}
        </span>
      </div>
    </div>
  );
}

function StreakCard({ streak, weekly }: { streak: number; weekly: number[] }) {
  const w = weekly.length === 7 ? weekly : [30, 45, 40, 55, 50, 68, 72];
  const max = Math.max(...w, 1);
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const pts = w.map((v, i) => `${(i / 6) * 100},${100 - (v / max) * 80}`).join(' ');

  return (
    <div
      className="instrument-card p-5 animate-card-in"
      style={{ width: 240, animationDelay: '0.1s' }}
      onMouseEnter={(e) => e.currentTarget.classList.add('instrument-card-hover')}
      onMouseLeave={(e) => e.currentTarget.classList.remove('instrument-card-hover')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.32em', color: DIM, textTransform: 'uppercase' }}>
            Streak
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 44, color: INK, lineHeight: 0.9 }}>
              {streak}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED, letterSpacing: '0.14em' }}>
              {streak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>
        <FlameIcon />
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full mt-3" style={{ height: 44 }}>
        <defs>
          <linearGradient id="skGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${pts} 100,100`} fill="url(#skGrad)" />
        <polyline
          points={pts}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw"
          style={{ '--dash': '260' } as React.CSSProperties}
          vectorEffect="non-scaling-stroke"
        />
        {w.map((v, i) => (
          <circle key={i} cx={(i / 6) * 100} cy={100 - (v / max) * 80} r={0.9} fill={GOLD} />
        ))}
      </svg>

      <div className="flex justify-between mt-1">
        {days.map((d, i) => (
          <span key={i} style={{ fontFamily: SANS, fontSize: 8, color: DIM, letterSpacing: '0.1em' }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5c1.2 2.5.5 4-.8 5.3-1.5 1.5-2.4 3-2.4 4.7a4.2 4.2 0 0 0 8.4 0c0-2-1-3.5-2.4-5-1-1-1.6-2.4-1-4-.6.5-1.2 1.3-1.8 2"
        stroke={GOLD}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(184,149,90,0.08)"
      />
    </svg>
  );
}

function IdentityCard({
  image, label, value, unit, progress, onClick, delay,
}: {
  image: string; label: string; value: string; unit: string; progress?: number;
  onClick: (e: React.MouseEvent) => void; delay: string;
}) {
  return (
    <a
      href="#"
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.988)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.classList.remove('instrument-card-hover');
      }}
      onMouseEnter={(e) => e.currentTarget.classList.add('instrument-card-hover')}
      className="instrument-card animate-card-in block relative overflow-hidden group"
      style={{ animationDelay: delay, aspectRatio: '3 / 4' }}
    >
      {/* Background image */}
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
        style={{ opacity: 0.55, mixBlendMode: 'screen' }}
      />
      {/* Bottom fade for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(7,8,10,0.5) 0%, rgba(7,8,10,0.2) 40%, rgba(7,8,10,0.95) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        <div>
          <p style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(184,149,90,0.75)', textTransform: 'uppercase' }}>
            {label}
          </p>
          {value && (
            <p
              className="mt-3"
              style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, color: INK, lineHeight: 0.85 }}
            >
              {value}
            </p>
          )}
          <p
            className="mt-2"
            style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}
          >
            {unit}
          </p>
        </div>

        <div className="flex items-end justify-between">
          {typeof progress === 'number' ? (
            <div className="flex-1 mr-3">
              <div style={{ height: 2, background: 'rgba(232,228,220,0.08)', borderRadius: 1 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(4, progress * 100)}%`,
                    background: `linear-gradient(90deg, ${GOLD}, rgba(184,149,90,0.4))`,
                    borderRadius: 1,
                    transition: 'width 1.2s ease-out',
                  }}
                />
              </div>
            </div>
          ) : <span />}
          <ArrowButton />
        </div>
      </div>
    </a>
  );
}

function ArrowButton() {
  return (
    <span
      className="inline-flex items-center justify-center transition-all duration-300 group-hover:border-[rgba(184,149,90,0.7)] group-hover:bg-[rgba(184,149,90,0.08)]"
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: '1px solid rgba(184,149,90,0.35)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8m-3-3 3 3-3 3" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function NextStepBar({
  onClick,
  title = 'Teste de Tessitura',
  subtitle,
  buttonLabel = 'Iniciar',
}: {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}) {
  return (
    <div
      className="instrument-card animate-card-in p-5 md:p-6 flex items-center gap-5 md:gap-8"
      style={{ animationDelay: '0.35s' }}
      onMouseEnter={(e) => e.currentTarget.classList.add('instrument-card-hover')}
      onMouseLeave={(e) => e.currentTarget.classList.remove('instrument-card-hover')}
    >
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.32em', color: DIM, textTransform: 'uppercase' }}>
          Próximo passo
        </p>
        <p
          className="mt-1 truncate"
          style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 28, color: INK }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="mt-1 truncate"
            style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Animated 3-corda wave */}
      <div className="hidden md:block flex-1 max-w-[220px]">
        <svg viewBox="0 0 220 40" className="w-full">
          {[10, 20, 30].map((y, i) => (
            <g key={i}>
              <line x1="0" y1={y} x2="220" y2={y} stroke="rgba(184,149,90,0.15)" strokeWidth="0.5" />
              <circle cx={40 + i * 60} cy={y} r="2" fill={GOLD}>
                <animate
                  attributeName="cx"
                  values={`${40 + i * 60};${60 + i * 60};${40 + i * 60}`}
                  dur={`${3 + i}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      </div>

      <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED, letterSpacing: '0.14em' }} className="hidden sm:inline">
        ≈ 3 min
      </span>

      <button
        onClick={onClick}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.985)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = '')}
        style={{
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: '#0A0B0D',
          background: `linear-gradient(180deg, #D4B071 0%, ${GOLD} 100%)`,
          padding: '12px 24px',
          borderRadius: 4,
          boxShadow: '0 8px 20px -8px rgba(184,149,90,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
          transition: 'transform 120ms ease, box-shadow 240ms ease',
          fontWeight: 500,
        }}
        className="hover:shadow-[0_12px_28px_-8px_rgba(184,149,90,0.7)]"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ---------- Context Cards (Fase 4) ---------- */

function MiniCardShell({ children, onClick, delay = '0.32s' }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; delay?: string }) {
  const Comp: any = onClick ? 'a' : 'div';
  return (
    <Comp
      href={onClick ? '#' : undefined}
      onClick={onClick}
      className="instrument-card animate-card-in block p-5"
      style={{ animationDelay: delay, minHeight: 148 }}
      onMouseEnter={(e: any) => e.currentTarget.classList.add('instrument-card-hover')}
      onMouseLeave={(e: any) => e.currentTarget.classList.remove('instrument-card-hover')}
    >
      {children}
    </Comp>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(184,149,90,0.75)', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

function VocalProfileMiniCard({ profile, onClick }: { profile: VocalProfile | null; onClick: (e: React.MouseEvent) => void }) {
  if (!profile) {
    return (
      <MiniCardShell onClick={onClick}>
        <MiniLabel>Perfil Vocal</MiniLabel>
        <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: INK, lineHeight: 1 }}>
          Descubra sua voz
        </p>
        <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
          Faça o Teste Vocal para liberar sugestões de tom.
        </p>
        <p className="mt-4" style={{ fontFamily: SANS, fontSize: 10, color: GOLD, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          Iniciar Teste Vocal →
        </p>
      </MiniCardShell>
    );
  }
  const lowConfidence = profile.confidence && profile.confidence !== 'high';
  return (
    <MiniCardShell onClick={onClick}>
      <MiniLabel>Perfil Vocal</MiniLabel>
      <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: INK, lineHeight: 1 }}>
        {profile.voiceType}
      </p>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: INK }}>
        {profile.lowestNote} → {profile.highestNote}
      </p>
      <p className="mt-1" style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>
        Confortável: {profile.comfortableLow} → {profile.comfortableHigh}
      </p>
      {lowConfidence && (
        <p className="mt-2" style={{ fontFamily: SANS, fontSize: 10, color: '#D4A574', letterSpacing: '0.04em' }}>
          Resultado estimado — refaça em ambiente silencioso.
        </p>
      )}
    </MiniCardShell>
  );
}

function RepertoireMiniCard({ summary, onClick }: { summary: ReturnType<typeof getRepertoireSummary>; onClick: (e: React.MouseEvent) => void }) {
  if (summary.projectCount === 0) {
    return (
      <MiniCardShell onClick={onClick}>
        <MiniLabel>Repertório</MiniLabel>
        <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: INK, lineHeight: 1 }}>
          Crie seu primeiro
        </p>
        <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
          Adicione músicas e receba sugestões de tom.
        </p>
        <p className="mt-4" style={{ fontFamily: SANS, fontSize: 10, color: GOLD, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          Abrir Repertório →
        </p>
      </MiniCardShell>
    );
  }
  return (
    <MiniCardShell onClick={onClick}>
      <MiniLabel>Repertório</MiniLabel>
      <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: INK, lineHeight: 1 }}>
        {summary.projectCount} {summary.projectCount === 1 ? 'projeto' : 'projetos'}
      </p>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: INK }}>
        {summary.songCount} {summary.songCount === 1 ? 'música' : 'músicas'}
      </p>
      <p className="mt-1" style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>
        {summary.recommendedCount} com tom recomendado
      </p>
      {summary.difficultCount > 0 && (
        <p className="mt-2" style={{ fontFamily: SANS, fontSize: 11, color: '#D4A574' }}>
          Atenção: {summary.difficultCount} {summary.difficultCount === 1 ? 'música difícil' : 'músicas difíceis'}
        </p>
      )}
    </MiniCardShell>
  );
}

function NextTrainingMiniCard({ done, total, nextName, onClick }: { done: number; total: number; nextName: string | null; onClick: (e: React.MouseEvent) => void }) {
  return (
    <MiniCardShell onClick={onClick}>
      <MiniLabel>Treino de hoje</MiniLabel>
      <p className="mt-3" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: INK, lineHeight: 1 }}>
        {done} <span style={{ color: MUTED, fontSize: 18 }}>/ {total}</span>
      </p>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
        {nextName ? 'Próximo:' : 'Concluído hoje.'}
      </p>
      {nextName && (
        <p className="mt-1" style={{ fontFamily: SANS, fontSize: 13, color: INK }}>
          {nextName}
        </p>
      )}
      <p className="mt-3" style={{ fontFamily: SANS, fontSize: 10, color: GOLD, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
        {nextName ? 'Continuar treino →' : 'Ver evolução →'}
      </p>
    </MiniCardShell>
  );
}

function ContinueCard({
  title, minutes, image, onClick, delay,
}: {
  title: string; minutes: number; image: string;
  onClick: (e: React.MouseEvent) => void; delay: string;
}) {
  return (
    <a
      href="#"
      onClick={onClick}
      className="instrument-card animate-card-in block relative overflow-hidden group"
      style={{ animationDelay: delay, aspectRatio: '4 / 3' }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.988)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseEnter={(e) => e.currentTarget.classList.add('instrument-card-hover')}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.classList.remove('instrument-card-hover');
      }}
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ opacity: 0.6 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 40%, rgba(7,8,10,0.95) 100%)',
        }}
      />
      <div className="relative h-full flex flex-col justify-end p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p
              className="truncate"
              style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 17, color: INK, lineHeight: 1.15 }}
            >
              {title}
            </p>
            <p
              className="mt-0.5"
              style={{ fontFamily: SANS, fontSize: 10, color: MUTED, letterSpacing: '0.12em' }}
            >
              {minutes} min
            </p>
          </div>
          <ArrowButton />
        </div>
      </div>
    </a>
  );
}
