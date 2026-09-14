import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_app/diario/evolucao')({
  component: EvolucaoPage,
});

type Progress = {
  date: string;
  completed: string[];
  streak: number;
  lastCompletedDate: string | null;
};

const STORAGE_KEY = 'cantare:diario';
const STATS_KEY = 'cantare:diario:stats';
const XP_PER_EXERCISE = 15;

type StatEntry = { accuracy: number | null; duration: number };
type DailyStats = Record<string, { entries: Record<string, StatEntry> }>;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {}
  return {
    date: new Date().toISOString().slice(0, 10),
    completed: [],
    streak: 0,
    lastCompletedDate: null,
  };
}

function loadStats(): DailyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as DailyStats;
  } catch {}
  return {};
}

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function dateNDaysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function EvolucaoPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress>(() => {
    if (typeof window === 'undefined') {
      return { date: '', completed: [], streak: 0, lastCompletedDate: null };
    }
    return loadProgress();
  });
  const [stats, setStats] = useState<DailyStats>(() => {
    if (typeof window === 'undefined') return {};
    return loadStats();
  });

  useEffect(() => {
    setProgress(loadProgress());
    setStats(loadStats());
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = Object.values(stats[today]?.entries ?? {});

  const doneCount = progress.completed.length;
  const totalXP = doneCount * XP_PER_EXERCISE;
  const level = Math.max(1, Math.floor(totalXP / 100) + 1);
  const xpInLevel = totalXP % 100;
  const levelPercent = xpInLevel;
  const streak = progress.streak || (doneCount > 0 ? 1 : 0);

  const accEntries = todayEntries.filter((e) => e.accuracy !== null);
  const avgAccuracy = accEntries.length
    ? Math.round(
        accEntries.reduce((s, e) => s + (e.accuracy ?? 0), 0) / accEntries.length,
      )
    : 0;
  const totalSeconds = todayEntries.reduce((s, e) => s + (e.duration || 0), 0);
  const minutes = Math.max(0, Math.round(totalSeconds / 60));

  // Weekly accuracy (Mon..Sun)
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Seg
  const weekAccuracy: (number | null)[] = Array.from({ length: 7 }, (_, i) => {
    const iso = dateNDaysAgoISO(todayIdx - i);
    const entries = Object.values(stats[iso]?.entries ?? {}).filter(
      (e) => e.accuracy !== null,
    );
    if (!entries.length) return null;
    return Math.round(
      entries.reduce((s, e) => s + (e.accuracy ?? 0), 0) / entries.length,
    );
  });


  const achievements = [
    { id: 'first', label: 'Primeira Voz', desc: '1º exercício', unlocked: doneCount >= 1, icon: '♪' },
    { id: 'day1', label: 'Dia 1', desc: 'Primeiro dia', unlocked: doneCount >= 7, icon: '✓' },
    { id: 'tuned', label: 'Afinado', desc: 'Precisão > 80%', unlocked: avgAccuracy > 80, icon: '◆' },
    { id: 'seq3', label: 'Sequência', desc: '3 dias seguidos', unlocked: streak >= 3, icon: '❯' },
    { id: 'seq7', label: 'Resistente', desc: '7 dias seguidos', unlocked: streak >= 7, icon: '❯❯' },
    { id: 'seq30', label: 'Vocalista', desc: '30 dias', unlocked: streak >= 30, icon: '★' },
  ];

  const nextGoal = !achievements[0].unlocked
    ? 'Complete seu primeiro exercício para desbloquear Primeira Voz'
    : !achievements[1].unlocked
      ? 'Complete os 7 exercícios de hoje para desbloquear Dia 1'
      : !achievements[3].unlocked
        ? 'Faça 3 dias seguidos para desbloquear Sequência'
        : !achievements[4].unlocked
          ? 'Faça 7 dias seguidos para desbloquear Resistente'
          : 'Faça 30 dias de treino para desbloquear Vocalista';

  // Chart geometry
  const W = 320;
  const H = 120;
  const padX = 20;
  const padY = 16;
  const stepX = (W - padX * 2) / 6;
  const yFor = (v: number) => H - padY - (v / 100) * (H - padY * 2);
  const points = weekAccuracy.map((v, i) => ({
    x: padX + stepX * i,
    y: v === null ? null : yFor(v),
    v,
  }));
  const linePath = points
    .filter((p) => p.y !== null)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="relative pb-16">
      <div className="mx-auto w-full max-w-md lg:max-w-6xl space-y-6">
        {/* Header */}
        <header className="pt-2 flex items-start justify-between">
          <div>
            <p
              className="text-[10px] text-[#B8955A] uppercase mb-2"
              style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.12em' }}
            >
              EVOLUÇÃO
            </p>
            <h1
              className="text-white leading-none"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(38px, 5vw, 64px)' }}
            >
              Minha Evolução
            </h1>
            <p
              className="mt-2 text-[13px] lg:text-[15px] text-[#888899]"
              style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
            >
              Dia {Math.max(1, streak)} de jornada
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/diario' })}
            className="text-[12px] text-[#888899] hover:text-[#B8955A] transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            ← Voltar
          </button>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* LEFT column */}
          <div className="space-y-6">
            {/* Level card */}
            <div
              className="relative rounded-2xl p-5 lg:p-8 overflow-hidden"
              style={{ backgroundColor: '#0D0F12' }}
            >
              <div
                className="absolute top-0 left-5 h-[2px] w-10"
                style={{ backgroundColor: '#B8955A' }}
              />
              <p
                className="text-[10px] uppercase text-[#B8955A]"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, letterSpacing: '0.15em' }}
              >
                NÍVEL
              </p>
              <p
                className="mt-2 text-white"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 'clamp(24px, 2.4vw, 34px)' }}
              >
                {level} — {level === 1 ? 'Iniciante' : level === 2 ? 'Aprendiz' : 'Cantor'}
              </p>
              <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{ backgroundColor: '#B8955A', width: `${levelPercent}%` }}
                />
              </div>
              <p
                className="mt-2 text-[12px] text-[#888899]"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
              >
                {xpInLevel} / 100 XP para o próximo nível
              </p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '♦', label: 'Dias de streak', value: `${streak} ${streak === 1 ? 'dia' : 'dias'}` },
                { icon: '♩', label: 'Exercícios', value: `${doneCount}` },
                { icon: '◇', label: 'Precisão média', value: doneCount > 0 ? `${avgAccuracy}%` : '—' },
                { icon: '○', label: 'Tempo de treino', value: `${minutes} min` },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl p-4 lg:p-6"
                  style={{ backgroundColor: '#0D0F12' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#B8955A] text-sm">{m.icon}</span>
                    <p
                      className="text-[10px] uppercase text-[#666677]"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, letterSpacing: '0.12em' }}
                    >
                      {m.label}
                    </p>
                  </div>
                  <p
                    className="mt-2 text-white"
                    style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 'clamp(22px, 2vw, 30px)' }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Next goal */}
            <div
              className="rounded-2xl p-5 lg:p-8"
              style={{ backgroundColor: '#0D0F12', borderLeft: '2px solid #B8955A' }}
            >
              <p
                className="text-[10px] uppercase text-[#B8955A]"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, letterSpacing: '0.15em' }}
              >
                Próximo objetivo
              </p>
              <p
                className="mt-2 text-[14px] lg:text-[16px] text-white"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, lineHeight: 1.5 }}
              >
                {nextGoal}
              </p>
              <button
                onClick={() => navigate({ to: '/diario' })}
                className="mt-4 w-full h-12 rounded-xl text-[#07080A] transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: '#B8955A',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                }}
              >
                CONTINUAR TREINANDO →
              </button>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="space-y-6">
            {/* Chart */}
            <div
              className="rounded-2xl p-5 lg:p-8"
              style={{ backgroundColor: '#0D0F12' }}
            >
              <p
                className="text-[11px] uppercase text-[#888899]"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, letterSpacing: '0.14em' }}
              >
                Precisão esta semana
              </p>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-3 w-full h-auto lg:h-56"
                preserveAspectRatio="none"
              >
                {[25, 50, 75].map((v) => (
                  <line
                    key={v}
                    x1={padX}
                    x2={W - padX}
                    y1={yFor(v)}
                    y2={yFor(v)}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                  />
                ))}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#B8955A"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                )}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y ?? H - padY}
                    r={p.v === null ? 3 : 4}
                    fill={p.v === null ? 'transparent' : '#B8955A'}
                    stroke={p.v === null ? 'rgba(255,255,255,0.2)' : '#B8955A'}
                    strokeWidth={1}
                  />
                ))}
              </svg>
              <div className="mt-2 flex justify-between px-1">
                {DAY_LABELS.map((d, i) => (
                  <span
                    key={d}
                    className="text-[10px] lg:text-[12px]"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 300,
                      color: i === todayIdx ? '#B8955A' : '#666677',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2
                className="text-white mb-4"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(22px, 2vw, 30px)' }}
              >
                Conquistas
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl p-3 lg:p-5 flex flex-col items-center text-center"
                    style={{
                      backgroundColor: a.unlocked ? '#0D0F12' : '#111118',
                      border: a.unlocked ? '1px solid rgba(201,168,76,0.5)' : '1px solid transparent',
                    }}
                  >
                    <span
                      className="text-lg lg:text-2xl mb-1"
                      style={{ color: a.unlocked ? '#B8955A' : '#3a3a44' }}
                    >
                      {a.unlocked ? a.icon : '○'}
                    </span>
                    <p
                      className="text-[11px] lg:text-[13px]"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 500,
                        color: a.unlocked ? '#fff' : '#666677',
                      }}
                    >
                      {a.label}
                    </p>
                    <p
                      className="text-[9px] lg:text-[11px] mt-0.5"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 300,
                        color: a.unlocked ? '#888899' : '#4a4a55',
                      }}
                    >
                      {a.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
