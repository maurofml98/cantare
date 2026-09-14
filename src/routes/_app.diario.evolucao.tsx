import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PerformanceChart, type ChartMetric } from '@/components/evolucao/PerformanceChart';
import { RangeBody } from '@/components/evolucao/RangeBody';
import { LAURY_TIP } from '@/components/home/HomeSections';
import { C, LINING, Panel, SANS, SERIF, Segmented } from '@/components/home/primitives';
import {
  achievements as buildAchievements,
  areaProgress,
  consumeNewAchievements,
  lastFourWeeks,
  loadDailyStats,
  summarize,
  type Achievement,
  type PeriodDays,
} from '@/lib/diario/history';
import { loadDiaryProgress } from '@/lib/diario/progress';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import type { DailyStats } from '@/lib/diario/progress';

export const Route = createFileRoute('/_app/diario/evolucao')({
  component: EvolucaoPage,
});

const PERIODS: { value: PeriodDays; label: string }[] = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '3 meses' },
];

function EvolucaoPage() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [metric, setMetric] = useState<ChartMetric>('accuracy');
  const [compareMetric, setCompareMetric] = useState<'accuracy' | 'minutes'>('minutes');
  const [allOpen, setAllOpen] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);

  useEffect(() => {
    const s = loadDailyStats();
    const p = loadDiaryProgress();
    setStats(s);
    setStreak(p.streak);
    setProfile(loadVocalProfile());
    const list = buildAchievements(s, p.streak);
    const newIds = consumeNewAchievements(list);
    if (newIds.length) {
      setFresh(newIds);
      const first = list.find((a) => a.id === newIds[0]);
      window.setTimeout(() => toast.success(`Conquista desbloqueada: ${first?.label}`, { description: first?.requirement }), 400);
    }
  }, []);

  const current = useMemo(() => (stats ? summarize(stats, period) : null), [stats, period]);
  const previous = useMemo(() => (stats ? summarize(stats, period, 1) : null), [stats, period]);
  const areas = useMemo(() => (stats ? areaProgress(stats, period) : []), [stats, period]);
  const weeks = useMemo(() => (stats ? lastFourWeeks(stats) : []), [stats]);
  const achs = useMemo(() => (stats ? buildAchievements(stats, streak) : []), [stats, streak]);

  // Estrutura estável enquanto lê o localStorage (evita mostrar "0" como dado real).
  if (!stats || !current || !previous) return <EvolucaoSkeleton />;

  const isNew = current.exercises === 0 && previous.exercises === 0 && Object.keys(stats).length === 0;
  const periodLabel = PERIODS.find((p) => p.value === period)!.label.replace('3 meses', '3 meses');

  const trend = (now: number | null, before: number | null, unit = '') => {
    if (now === null || before === null || previous.exercises === 0) return null;
    const d = now - before;
    if (d === 0) return { text: `igual ao período anterior`, up: null as boolean | null };
    return { text: `${d > 0 ? '+' : ''}${d}${unit} vs. período anterior`, up: d > 0 };
  };

  const hoursMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min` : `${m} min`);
  const insight =
    previous.exercises > 0 && current.exercises > previous.exercises
      ? 'Você treinou mais neste período.'
      : current.accuracy !== null && previous.accuracy !== null && current.accuracy > previous.accuracy
        ? 'Sua precisão vem melhorando.'
        : current.activeDays > 0
          ? 'Continue treinando para formar um histórico mais confiável.'
          : null;

  return (
    <div style={LINING} className={`grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:h-[calc(100dvh-3rem)] ${isNew ? '2xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)]' : '2xl:grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,0.95fr)]'}`}>
      {/* ===== Cabeçalho ===== */}
      <header className="flex flex-wrap items-end justify-between gap-4 px-1 lg:col-span-8">
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 4vw, 68px)', color: C.paper, lineHeight: 1 }}>
            Minha <em style={{ color: C.gold }}>evolução</em>
          </h1>
          <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2 }}>
            {insight ?? 'Acompanhe seu progresso e veja como sua voz está evoluindo.'}
          </p>
        </div>
        <Segmented label="Período" options={PERIODS} value={period} onChange={setPeriod} />
      </header>

      <Panel className="lg:col-span-4" bodyClassName="!py-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 19, color: C.paper, lineHeight: 1.35 }}>“{LAURY_TIP}”</blockquote>
            <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Laury · fonoaudióloga</p>
          </div>
          {/* TODO(asset): foto da Laury em src/assets/laury.jpg */}
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ border: `1px solid ${C.gold}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: C.gold }} aria-hidden>L</span>
        </div>
      </Panel>

      {isNew ? (
        <NewUserStory profile={profile} />
      ) : (
        <>
          {/* ===== Métricas ===== */}
          <dl className="grid grid-cols-2 gap-4 lg:col-span-8 xl:grid-cols-4">
            <Metric label="Sequência" value={String(streak)} unit={streak === 1 ? 'dia seguido' : 'dias seguidos'} note={streak ? 'Treino completo todos os dias' : 'Complete um treino para iniciar'} />
            <Metric label="Exercícios" value={String(current.exercises)} unit={`em ${periodLabel}`} note={`${current.activeDays} ${current.activeDays === 1 ? 'dia' : 'dias'} com treino`} trend={trend(current.exercises, previous.exercises)} />
            <Metric label="Tempo total" value={hoursMin(current.minutes)} unit={`em ${periodLabel}`} note={`${current.fullDays} ${current.fullDays === 1 ? 'dia completo' : 'dias completos'}`} trend={trend(current.minutes, previous.minutes, ' min')} />
            <Metric
              label="Precisão média"
              value={current.accuracy !== null ? `${current.accuracy}%` : '—'}
              unit="nos exercícios cantados"
              note={current.accuracy === null ? 'Aparece após um exercício de afinação' : 'Notas dentro de ±50 cents do alvo'}
              trend={trend(current.accuracy, previous.accuracy, '%')}
            />
          </dl>

          {/* ===== Gráfico ===== */}
          <Panel title="Desempenho ao longo do tempo" subtitle="Passe ou toque nos pontos para ver o dia." labelledBy="desempenho" className="min-h-[320px] lg:col-span-8">
            <div className="mb-3 flex justify-end">
              <Segmented
                label="Métrica do gráfico"
                size="sm"
                options={[
                  { value: 'accuracy' as ChartMetric, label: 'Precisão' },
                  { value: 'minutes' as ChartMetric, label: 'Tempo' },
                  { value: 'exercises' as ChartMetric, label: 'Exercícios' },
                ]}
                value={metric}
                onChange={setMetric}
              />
            </div>
            <div className="relative min-h-[200px] flex-1">
              <PerformanceChart days={current.days} metric={metric} />
              {metric === 'accuracy' && current.accuracy === null && (
                <p className="absolute inset-0 flex items-center justify-center text-center" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>
                  Conclua um exercício de afinação para acompanhar sua precisão.
                </p>
              )}
            </div>
          </Panel>
        </>
      )}

      {/* ===== Extensão vocal ===== */}
      <Panel
        title="Sua extensão vocal"
        subtitle={profile ? `Último teste em ${new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')} · estimativa` : 'Ainda sem teste'}
        action={profile ? { to: '/teste-vocal', label: 'Refazer teste' } : undefined}
        labelledBy="extensao"
        className={`lg:col-span-4 2xl:row-start-2 2xl:col-start-9 ${isNew ? '2xl:row-span-3' : '2xl:row-span-2'}`}
      >
        <div className="min-h-0 flex-1">
          <RangeBody profile={profile} />
        </div>
        {profile && (
          <p className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.rule}`, fontFamily: SANS, fontSize: 12.5, color: C.paper3, lineHeight: 1.45 }}>
            Faça novos testes ao longo do tempo para acompanhar mudanças na sua extensão.
          </p>
        )}
      </Panel>

      {!isNew && (
        <>
          {/* ===== Áreas ===== */}
          <Panel title="Áreas em evolução" subtitle={`No período de ${periodLabel}.`} labelledBy="areas" className="lg:col-span-4">
            <ul className="flex flex-1 flex-col justify-between gap-2">
              {areas.map((a, i) => (
                <li key={a.id} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3" title={a.detail}>
                  <span style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>{a.name}</span>
                  <span className="relative h-[6px] overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.07)' }}>
                    <span
                      className="absolute inset-y-0 left-0 rounded-full evo-grow"
                      style={{ width: `${Math.max(a.value, 2)}%`, background: a.kind === 'precisao' ? C.gold : 'rgba(184,149,90,0.55)', animationDelay: `${i * 60}ms` }}
                    />
                  </span>
                  <span className="w-[120px] text-right" style={{ fontFamily: SANS, fontSize: 12.5 }}>
                    <span style={{ color: C.paper }}>{a.value}%</span>{' '}
                    <span style={{ color: C.paper3 }}>{a.kind === 'precisao' ? 'precisão' : 'constância'}</span>
                    {a.delta !== null && a.delta !== 0 && (
                      <span className="block" style={{ color: a.delta > 0 ? '#7FB59A' : '#C98B78' }}>{a.delta > 0 ? '↑' : '↓'} {Math.abs(a.delta)} pts</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* ===== Comparativo ===== */}
          <Panel title="Comparativo de progresso" subtitle="Últimas 4 semanas" labelledBy="comparativo" className="lg:col-span-4">
            <div className="mb-2 flex justify-end">
              <Segmented
                label="Métrica do comparativo"
                size="sm"
                options={[{ value: 'minutes' as const, label: 'Tempo' }, { value: 'accuracy' as const, label: 'Precisão' }]}
                value={compareMetric}
                onChange={setCompareMetric}
              />
            </div>
            <WeekBars weeks={weeks} metric={compareMetric} />
          </Panel>
        </>
      )}

      {/* ===== Conquistas ===== */}
      <Panel title="Conquistas" subtitle={`${achs.filter((a) => a.unlocked).length} de ${achs.length} desbloqueadas`} labelledBy="conquistas" className={isNew ? 'lg:col-span-8' : 'lg:col-span-4'}>
        <ul className="grid flex-1 grid-cols-2 gap-2.5">
          {achs.slice(0, 4).map((a) => <AchievementTile key={a.id} a={a} isNew={fresh.includes(a.id)} />)}
        </ul>
        <div className="mt-3 flex justify-end">
          <Button variant="link" onClick={() => setAllOpen(true)}>Ver todas as conquistas</Button>
        </div>
      </Panel>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="border-white/10 bg-[#0F1114] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">Conquistas</DialogTitle>
            <DialogDescription>Cada uma marca um passo do seu treino.</DialogDescription>
          </DialogHeader>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {achs.map((a) => <AchievementTile key={a.id} a={a} isNew={fresh.includes(a.id)} />)}
          </ul>
        </DialogContent>
      </Dialog>

      <style>{`
        .evo-grow { transform-origin: left; animation: evo-grow 600ms var(--ease-out) both; }
        @keyframes evo-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .evo-new { animation: evo-new 900ms var(--ease-out) 2; }
        @keyframes evo-new { 0%,100% { box-shadow: 0 0 0 0 rgba(184,149,90,0) } 50% { box-shadow: 0 0 0 4px rgba(184,149,90,0.3) } }
      `}</style>
    </div>
  );
}

/* ---------- peças ---------- */

function Metric({ label, value, unit, note, trend }: { label: string; value: string; unit: string; note: string; trend?: { text: string; up: boolean | null } | null }) {
  return (
    <div className="rounded-[8px] p-4 2xl:p-5" style={{ border: `1px solid ${C.rule}`, background: 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)' }}>
      <dt style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>{label}</dt>
      <dd>
        <span className="mt-1 block" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(34px, 2.6vw, 46px)', color: C.paper, lineHeight: 1 }}>{value}</span>
        <span className="block" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>{unit}</span>
        {trend ? (
          <span className="mt-2 block" style={{ fontFamily: SANS, fontSize: 12, color: trend.up === null ? C.paper3 : trend.up ? '#7FB59A' : '#C98B78' }}>
            {trend.up === null ? '' : trend.up ? '↑ ' : '↓ '}{trend.text}
          </span>
        ) : (
          <span className="mt-2 block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{note}</span>
        )}
      </dd>
    </div>
  );
}

function WeekBars({ weeks, metric }: { weeks: { label: string; accuracy: number | null; minutes: number }[]; metric: 'accuracy' | 'minutes' }) {
  const vals = weeks.map((w) => (metric === 'accuracy' ? w.accuracy : w.minutes));
  const max = metric === 'accuracy' ? 100 : Math.max(15, ...vals.map((v) => v ?? 0));
  const empty = vals.every((v) => !v);
  return (
    <div className="relative flex min-h-[150px] flex-1 items-end gap-4 px-2 pb-6 pt-2" key={metric}>
      {weeks.map((w, i) => {
        const v = vals[i];
        return (
          <div key={w.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={v === null ? 'Sem medição' : `${v}${metric === 'accuracy' ? '%' : ' min'}`}>
            <span className="mb-1 opacity-70 transition-opacity group-hover:opacity-100" style={{ fontFamily: SANS, fontSize: 12, color: C.paper2 }}>
              {v === null ? '—' : `${v}${metric === 'accuracy' ? '%' : ''}`}
            </span>
            <span
              className="w-full max-w-[44px] rounded-t-[4px] evo-rise transition-[filter] group-hover:brightness-125"
              style={{ height: `${v ? Math.max(3, (v / max) * 100) : 2}%`, background: i === weeks.length - 1 ? C.gold : 'rgba(184,149,90,0.45)', animationDelay: `${i * 70}ms` }}
            />
            <span className="absolute -bottom-5" style={{ fontFamily: SANS, fontSize: 12, color: i === weeks.length - 1 ? C.gold : C.paper3 }}>{w.label}</span>
          </div>
        );
      })}
      {empty && (
        <p className="absolute inset-0 flex items-center justify-center text-center" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
          {metric === 'accuracy' ? 'Sem exercícios de afinação nas últimas semanas.' : 'Sem treino nas últimas semanas.'}
        </p>
      )}
      <style>{`.evo-rise { transform-origin: bottom; animation: evo-rise 550ms var(--ease-out) both } @keyframes evo-rise { from { transform: scaleY(0) } to { transform: scaleY(1) } }`}</style>
    </div>
  );
}

function AchievementTile({ a, isNew }: { a: Achievement; isNew: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-[8px] p-3 transition-colors ${isNew ? 'evo-new' : ''}`}
      style={{ border: `1px solid ${a.unlocked ? 'rgba(184,149,90,0.4)' : C.rule}`, background: a.unlocked ? 'rgba(184,149,90,0.06)' : 'rgba(255,255,255,0.01)' }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
        {a.unlocked ? <AchGlyph kind={a.glyph} /> : <Lock size={18} strokeWidth={1.4} color="rgba(232,228,220,0.35)" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate" style={{ fontFamily: SANS, fontSize: 14, color: a.unlocked ? C.paper : C.paper2, fontWeight: a.unlocked ? 500 : 400 }}>{a.label}</span>
          {isNew && <span className="rounded-[4px] px-1.5 text-[11px]" style={{ background: C.gold, color: C.ink, fontFamily: SANS }}>Nova</span>}
        </span>
        <span className="block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.35 }}>
          {a.unlocked ? 'Desbloqueada' : a.requirement}
        </span>
      </span>
    </li>
  );
}

function AchGlyph({ kind }: { kind: Achievement['glyph'] }) {
  const s = { stroke: C.gold, strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      {kind === 'voice' && (<><rect x="11" y="4" width="8" height="13" rx="4" {...s} /><path d="M7 14a8 8 0 0 0 16 0M15 22v4" {...s} /></>)}
      {kind === 'day' && (<><circle cx="15" cy="15" r="10" {...s} /><path d="m10.5 15.5 3 3 6-7" {...s} /></>)}
      {kind === 'tune' && (<>{[9, 14, 19].map((y) => <line key={y} x1="4" x2="26" y1={y} y2={y} {...s} strokeOpacity={0.35} />)}<circle cx="15" cy="14" r="3" fill={C.gold} /></>)}
      {kind === 'seq3' && <path d="M6 22 12 16l4 4 8-10" {...s} />}
      {kind === 'seq7' && (<><path d="M5 22 11 16l4 4 9-11" {...s} /><path d="M19 9h5v5" {...s} /></>)}
      {kind === 'seq30' && <path d="m15 4 3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L15 20.5l-6.5 3.4 1.3-7.2L4.5 11.6l7.3-1z" {...s} />}
    </svg>
  );
}

function NewUserStory({ profile }: { profile: VocalProfile | null }) {
  const steps = [
    { n: 1, title: 'Faça o Teste Vocal', text: 'Descubra sua extensão para treinar dentro da sua faixa.', done: !!profile, to: '/teste-vocal', cta: 'Fazer teste vocal' },
    { n: 2, title: 'Conclua seu primeiro treino', text: 'Sete exercícios, cerca de 15 minutos, começando pelo aquecimento.', done: false, to: '/diario', cta: 'Ir para o treino' },
    { n: 3, title: 'Volte para acompanhar', text: 'Aqui você vai ver precisão, tempo de treino e conquistas ao longo das semanas.', done: false, to: null, cta: null },
  ];
  const nextStep = steps.find((s) => !s.done && s.to);
  return (
    <Panel glow className="lg:col-span-8 2xl:row-span-2" bodyClassName="!p-0">
      <div className="flex h-full flex-col p-6 2xl:p-8">
        <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 2.6vw, 44px)', color: C.paper, lineHeight: 1.1 }}>Seu histórico começa aqui.</p>
        <p className="mt-2 max-w-2xl" style={{ fontFamily: SANS, fontSize: 16, color: C.paper2, lineHeight: 1.55 }}>
          Assim que você treinar, esta tela mostra como sua voz está mudando: dias seguidos, tempo de prática, precisão e extensão.
        </p>
        <ol className="mt-8 grid flex-1 grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col rounded-[8px] p-5" style={{ border: `1px solid ${s === nextStep ? 'rgba(184,149,90,0.45)' : C.rule}`, background: s === nextStep ? 'rgba(184,149,90,0.05)' : undefined }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ border: `1px solid ${C.gold}`, background: s.done ? C.gold : 'transparent', color: s.done ? C.ink : C.gold, fontFamily: SERIF, fontSize: 18 }}>
                {s.done ? '✓' : s.n}
              </span>
              <p className="mt-4" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 23, color: C.paper, lineHeight: 1.15 }}>{s.title}</p>
              <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2, lineHeight: 1.5 }}>{s.done ? 'Feito.' : s.text}</p>
              {s.to && !s.done && (
                <div className="mt-auto pt-5">
                  <Link to={s.to} className={buttonVariants({ variant: s === nextStep ? 'primary' : 'secondary' })}>{s.cta}</Link>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

function EvolucaoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Carregando evolução">
      <div className="h-24 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-8" />
      <div className="h-24 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-4" />
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-2" />)}
      <div className="h-80 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-8" />
    </div>
  );
}
