import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { EnvironmentCheckSheet } from '@/components/diario/EnvironmentCheckSheet';
import { VocalBody } from '@/components/illustrations';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { loadProjects as loadRepertoireProjects } from '@/lib/repertoire/store';
import type { RepertoireProject } from '@/lib/types';
import { getSuggestedTrainingFocus, getRepertoireSummary } from '@/lib/home/summary';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const Route = createFileRoute('/_app/diario/')({
  component: DiarioPage,
});

type Exercise = { id: string; name: string; duration: string };

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Aquecimento Geral', duration: '3 min' },
  { id: '2', name: 'Respiração Profunda', duration: '30 seg' },
  { id: '3', name: 'Coordenação Vocal', duration: '2 min' },
  { id: '4', name: 'Flexibilidade Vocal', duration: '2 min' },
  { id: '5', name: 'Afinação Básica', duration: '3 min' },
  { id: '6', name: 'Voz Mista', duration: '2 min' },
  { id: '7', name: 'Desaquecimento', duration: '2 min' },
];

const STORAGE_KEY = 'cantare:diario';

type Progress = {
  date: string;
  completed: string[];
  streak: number;
  lastCompletedDate: string | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      if (p.date !== todayISO()) {
        const keepStreak = p.lastCompletedDate === yesterdayISO();
        return {
          date: todayISO(),
          completed: [],
          streak: keepStreak ? p.streak : 0,
          lastCompletedDate: p.lastCompletedDate,
        };
      }
      return p;
    }
  } catch {}
  return { date: todayISO(), completed: [], streak: 0, lastCompletedDate: null };
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

function DiarioPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress>(() => {
    if (typeof window === 'undefined') {
      return { date: todayISO(), completed: [], streak: 0, lastCompletedDate: null };
    }
    return loadProgress();
  });

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const [vocalProfile, setVocalProfile] = useState<VocalProfile | null>(null);
  const [repertoire, setRepertoire] = useState<RepertoireProject[]>([]);
  useEffect(() => {
    setVocalProfile(loadVocalProfile());
    setRepertoire(loadRepertoireProjects());
  }, []);
  const focus = useMemo(
    () => getSuggestedTrainingFocus(vocalProfile, repertoire),
    [vocalProfile, repertoire],
  );
  const repSummary = useMemo(() => getRepertoireSummary(repertoire), [repertoire]);

  const total = EXERCISES.length;
  const doneCount = progress.completed.length;
  const allDone = doneCount === total;
  const percent = (doneCount / total) * 100;
  const day = Math.max(1, progress.streak || 1);

  const toggle = (id: string) => {
    setProgress((prev) => {
      const isDone = prev.completed.includes(id);
      const completed = isDone
        ? prev.completed.filter((x) => x !== id)
        : [...prev.completed, id];
      let streak = prev.streak;
      let lastCompletedDate = prev.lastCompletedDate;
      if (completed.length === total && !isDone) {
        if (prev.lastCompletedDate !== todayISO()) {
          streak = prev.lastCompletedDate === yesterdayISO() ? prev.streak + 1 : 1;
          lastCompletedDate = todayISO();
        }
      }
      return { ...prev, completed, streak, lastCompletedDate };
    });
  };

  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null);

  const VALIDATION_KEY = `cantare:diario:validated:${todayISO()}`;

  const openExercise = (id: string) => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(VALIDATION_KEY)) {
      navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: id } });
    } else {
      setPendingExerciseId(id);
    }
  };

  const startNext = () => {
    const next = EXERCISES.find((e) => !progress.completed.includes(e.id));
    if (next) openExercise(next.id);
  };

  const onValidationComplete = () => {
    try {
      sessionStorage.setItem(VALIDATION_KEY, '1');
    } catch {}
    const id = pendingExerciseId;
    setPendingExerciseId(null);
    if (id) navigate({ to: '/diario/exercicio/$exerciseId', params: { exerciseId: id } });
  };

  const buttonText = allDone
    ? 'Treino Concluído ✓'
    : doneCount === 0
      ? 'Começar Treino'
      : 'Continuar Treino';

  const size = 200;
  const stroke = 2;
  const radius = (size - stroke * 2) / 2 - 4;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;

  const streakLabel = progress.streak || 1;

  return (
    <div className="relative pb-40 lg:pb-12">
      <div className="mx-auto w-full max-w-md lg:max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_1.2fr] lg:gap-16 space-y-6 lg:space-y-0">
        {/* LEFT column (sticky on desktop) */}
        <div className="space-y-8 lg:sticky lg:top-4 lg:self-start lg:py-4 animate-card-in">
          <header className="flex items-start justify-between pt-2">
            <div className="space-y-2">
              <p
                className="text-[10px] text-[#B8955A] uppercase"
                style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.18em' }}
              >
                III · SALA DE ENSAIO
              </p>
              <h1
                className="text-[38px] lg:text-[64px] leading-none text-white flex items-baseline gap-3"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontStyle: 'italic' }}
              >
                Dia <span className="text-[#B8955A]">{ROMAN[day - 1] || day}</span>
                <span className="text-[18px] lg:text-[22px] text-[#666677]" style={{ fontStyle: 'normal', fontWeight: 300 }}>
                  / VII
                </span>
              </h1>
              <p
                className="text-[13px] lg:text-[15px] text-[#888899]"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
              >
                {doneCount} de {total} concluídos hoje
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#B8955A]/30 bg-[#B8955A]/5"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <span className="text-[#B8955A]">♦</span>
                <span className="text-[11px] text-[#B8955A]">
                  {streakLabel} dia{streakLabel > 1 ? 's' : ''} seguido{streakLabel > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => navigate({ to: '/diario/evolucao' })}
                className="text-[11px] text-[#B8955A] hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}
              >
                Ver evolução →
              </button>
            </div>
          </header>

          <div className="relative flex flex-col items-center gap-6 py-6 lg:py-10 lg:px-8">
            <VocalBody
              size={280}
              className="hidden lg:block absolute inset-0 mx-auto pointer-events-none"
              style={{ opacity: 0.06, top: '10%' }}
            />
            <div className="relative animate-breathe" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#B8955A"
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)' }}
                />
                {Array.from({ length: total }).map((_, i) => {
                  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                  const inner = radius - 8;
                  const outer = radius + 4;
                  const cx = size / 2;
                  const cy = size / 2;
                  const isDone = i < doneCount;
                  return (
                    <line
                      key={i}
                      x1={cx + Math.cos(angle) * inner}
                      y1={cy + Math.sin(angle) * inner}
                      x2={cx + Math.cos(angle) * outer}
                      y2={cy + Math.sin(angle) * outer}
                      stroke={isDone ? '#B8955A' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={1}
                      style={{ transition: 'stroke 400ms ease' }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-white leading-none flex items-baseline"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 64, fontStyle: 'italic' }}
                >
                  {doneCount}
                  <span className="text-[#666677] text-[32px]" style={{ fontStyle: 'normal' }}>/{total}</span>
                </span>
                <span
                  className="text-[10px] text-[#888899] mt-2 uppercase"
                  style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, letterSpacing: '0.22em' }}
                >
                  Exercícios
                </span>
              </div>
            </div>

            {/* sound wave hairline */}
            <svg width="220" height="28" viewBox="0 0 220 28" className="opacity-70">
              {Array.from({ length: 34 }).map((_, i) => {
                const active = i / 34 < percent / 100;
                const h = 4 + Math.abs(Math.sin(i * 0.9)) * 18;
                return (
                  <rect
                    key={i}
                    x={i * 6.4}
                    y={14 - h / 2}
                    width={2}
                    height={h}
                    rx={1}
                    fill={active ? '#B8955A' : 'rgba(255,255,255,0.08)'}
                    style={{ transition: 'fill 500ms ease' }}
                  />
                );
              })}
            </svg>

            {/* Desktop inline CTA */}
            <button
              onClick={startNext}
              disabled={allDone}
              className="hidden lg:block w-full h-14 text-[#07080A] font-medium transition-all active:scale-[0.988] hover:brightness-110 disabled:opacity-90 rounded-2xl mt-2"
              style={{
                backgroundColor: '#B8955A',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {buttonText}
            </button>
          </div>
        </div>


        {/* RIGHT column: exercises */}
        <div className="space-y-3 lg:space-y-4 lg:py-4">
          {/* Contexto — Perfil Vocal + Repertório */}
          {vocalProfile ? (
            <div
              className="rounded-2xl p-4 border border-white/[0.04] bg-[#0D0F12]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <p className="text-[10px] uppercase text-[#B8955A]" style={{ letterSpacing: '0.28em' }}>
                Treino baseado no seu perfil vocal
              </p>
              <p className="mt-2 text-[13px] text-white">
                {vocalProfile.voiceType} · <b>{vocalProfile.lowestNote} → {vocalProfile.highestNote}</b>
              </p>
              <p className="text-[12px] text-[#888899]">
                Zona confortável: {vocalProfile.comfortableLow} → {vocalProfile.comfortableHigh}
              </p>
              <p className="mt-2 text-[12px] text-[#B8955A]">
                Foco sugerido: <span className="text-white">{focus.label}</span>
              </p>
              <p className="text-[11px] text-[#888899]">{focus.reason}</p>
            </div>
          ) : (
            <button
              onClick={() => navigate({ to: '/teste-vocal' })}
              className="w-full text-left rounded-2xl p-4 border border-[#B8955A]/25 bg-[#B8955A]/[0.04] hover:bg-[#B8955A]/[0.08] transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <p className="text-[10px] uppercase text-[#B8955A]" style={{ letterSpacing: '0.28em' }}>
                Faça o Teste Vocal
              </p>
              <p className="mt-1 text-[13px] text-white">
                Com seu perfil vocal, o Cantare adapta treino e repertório à sua voz.
              </p>
              <p className="mt-2 text-[11px] text-[#B8955A]" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Iniciar Teste Vocal →
              </p>
            </button>
          )}

          {repSummary.difficultCount > 0 && (
            <div
              className="rounded-2xl p-4 border border-[#D4A574]/25 bg-[#D4A574]/[0.04]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <p className="text-[12px] text-white">
                Seu repertório tem <b>{repSummary.difficultCount}</b>{' '}
                {repSummary.difficultCount === 1 ? 'música difícil' : 'músicas difíceis'}.
              </p>
              <p className="mt-1 text-[11px] text-[#888899]">
                Sugestão de treino: Afinação · Flexibilidade · Voz Mista.
              </p>
            </div>
          )}

          <p
            className="hidden lg:block text-[11px] uppercase text-[#888899] mb-2 pt-2"
            style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.22em' }}
          >
            Exercícios de hoje
          </p>
          {EXERCISES.map((ex, i) => {
            const done = progress.completed.includes(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => openExercise(ex.id)}
                className="group w-full flex items-center gap-4 bg-[#0D0F12] hover:bg-[#131519] transition-all p-[14px] lg:p-6 text-left rounded-xl lg:rounded-2xl border border-white/[0.03] hover:border-[#B8955A]/25 animate-card-in"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <span
                  className="w-8 transition-colors"
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 18,
                    color: done ? '#B8955A' : 'rgba(184,149,90,0.45)',
                  }}
                >
                  {ROMAN[i] || String(i + 1)}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] lg:text-[17px] text-white truncate"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
                  >
                    {ex.name}
                  </p>
                  <p
                    className="text-[12px] lg:text-[13px] text-[#888899]"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
                  >
                    {ex.duration}
                  </p>
                </div>
                {/* mini equalizer / check */}
                {done ? (
                  <span className="text-[#B8955A] text-lg lg:text-xl">✓</span>
                ) : (
                  <span className="flex items-end gap-[3px] h-4 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="w-[2px] h-[6px] bg-[#B8955A]/60" />
                    <span className="w-[2px] h-[12px] bg-[#B8955A]/60" />
                    <span className="w-[2px] h-[8px] bg-[#B8955A]/60" />
                    <span className="w-[2px] h-[14px] bg-[#B8955A]/60" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Mobile fixed CTA */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40 px-4 pointer-events-none lg:hidden"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            onClick={startNext}
            disabled={allDone}
            className="w-full h-14 text-[#07080A] font-medium transition-all active:scale-[0.98] disabled:opacity-90 rounded-2xl"
            style={{
              backgroundColor: '#B8955A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              letterSpacing: '0.02em',
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
      <EnvironmentCheckSheet
        open={pendingExerciseId !== null}
        onDismiss={() => setPendingExerciseId(null)}
        onComplete={onValidationComplete}
      />
    </div>
  );
}
