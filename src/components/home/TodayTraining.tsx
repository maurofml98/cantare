import { Link } from '@tanstack/react-router';
import { NoteLadder } from '@/components/vocal/NoteLadder';
import { CinematicImage, useSpotlight } from '@/components/media/CinematicImage';
import type { VocalProfile } from '@/lib/vocal/profile';
import { formatDuration, profileRanges, totalMinutes, type DiaryExercise } from '@/lib/home/today';
import { C, Panel, PrimaryButton, SANS, SecondaryButton, SERIF, TextLink, focusRing } from './primitives';

/* ============ Treino de hoje ============ */

interface TodayTrainingCardProps {
  exercises: DiaryExercise[];
  completedIds: string[];
  day: number;
}

export function TodayTrainingCard({ exercises, completedIds, day }: TodayTrainingCardProps) {
  const total = exercises.length;
  const done = exercises.filter((e) => completedIds.includes(e.id)).length;
  const next = exercises.find((e) => !completedIds.includes(e.id)) ?? null;
  const minutes = totalMinutes(exercises);
  const remaining = Math.round(
    exercises.filter((e) => !completedIds.includes(e.id)).reduce((s, e) => s + e.durationSec, 0) / 60,
  );

  const lede = !next
    ? 'Treino completo. Agora é hidratar e deixar a voz descansar.'
    : done === 0
      ? 'Aqueça, ative sua voz e chegue mais longe no que importa: a sua música.'
      : 'Você já começou. Termine a sequência enquanto a voz está aquecida.';

  const spot = useSpotlight<HTMLDivElement>();

  return (
    <Panel glow className="flex-1" bodyClassName="!p-0">
      {/* Estúdio pronto: microfone à direita, texto protegido pela zona escura da esquerda. */}
      <CinematicImage
        name="cantare-home-treino-hoje"
        priority
        kenBurns
        overlay="left"
        intensity={1}
        position="78% 40%"
        positionMd="72% 42%"
        sizes="(max-width: 768px) 100vw, 60vw"
      />

      <div ref={spot} className="cine-spotlight relative grid h-full grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:pr-[26%] 2xl:p-8 2xl:pr-[30%]">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3">
            <TuningFork />
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 3vw, 42px)', color: C.paper, lineHeight: 1 }}>
              Treino de hoje
            </h2>
          </div>
          <p className="mt-2" style={{ fontFamily: SANS, fontSize: 15, color: C.paper2 }}>
            {total} exercícios <span style={{ color: C.gold }}>·</span> {minutes} min
            {next && done > 0 && <span style={{ color: C.paper3 }}> · faltam {remaining} min</span>}
          </p>
          <p className="mt-4 max-w-md" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: C.paper2, lineHeight: 1.55 }}>
            {lede}
          </p>

          <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
            {next ? (
              <>
                <PrimaryButton to="/treinos">{done === 0 ? 'Começar aquecimento' : 'Continuar treino'}</PrimaryButton>
                <div className="whitespace-nowrap" style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.35 }}>
                  <span className="block" style={{ color: C.paper3 }}>{done === 0 ? 'Primeiro passo' : 'Próximo'}</span>
                  <span style={{ color: C.paper }}>{next.name}</span>
                  <span style={{ color: C.paper3 }}> · {formatDuration(next.durationSec)}</span>
                </div>
              </>
            ) : (
              <TextLink to="/diario/evolucao">Ver como foi sua semana</TextLink>
            )}
          </div>
        </div>

        <DayRing day={day} done={done} total={total} completed={exercises.map((e) => completedIds.includes(e.id))} />
      </div>
    </Panel>
  );
}

/** Anel segmentado: um arco por exercício, preenchido em dourado quando feito. */
export function DayRing({ day, done, total, completed, size = 172, caption = 'exercícios concluídos' }: { day: number; done: number; total: number; completed: boolean[]; size?: number; caption?: string }) {
  const r = size / 2 - 10;
  const cx = size / 2;
  const gap = 6; // graus entre segmentos
  const seg = 360 / total;

  const arc = (i: number) => {
    const a0 = ((i * seg + gap / 2 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - gap / 2 - 90) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(a0)} ${cx + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cx + r * Math.sin(a1)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden>
          {completed.map((isDone, i) => (
            <path
              key={i}
              d={arc(i)}
              fill="none"
              stroke={isDone ? C.gold : 'rgba(232,228,220,0.12)'}
              strokeWidth={isDone ? 3 : 2}
              strokeLinecap="round"
              style={{ transition: 'stroke var(--dur-progress) var(--ease-out), stroke-width var(--dur-progress)' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>Dia {day}</span>
          <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: Math.round(size * 0.3), color: C.paper, lineHeight: 1 }}>
            {done}<span style={{ color: C.paper3, fontSize: Math.round(size * 0.2) }}>/{total}</span>
          </span>
        </div>
      </div>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>{caption}</p>
    </div>
  );
}

function TuningFork() {
  return (
    <svg width="22" height="30" viewBox="0 0 22 30" fill="none" aria-hidden className="shrink-0">
      <path d="M6 2v11a5 5 0 0 0 10 0V2" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 18v10" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/* ============ Sua voz (escada) ============ */

export function VoicePanel({ profile }: { profile: VocalProfile | null }) {
  const ranges = profile ? profileRanges(profile) : null;
  const tested = profile
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
    : null;

  return (
    <Panel
      title="Sua voz"
      subtitle={profile ? 'Extensão estimada no último teste' : 'Ainda não medimos sua extensão'}
      labelledBy="sua-voz"
      className="h-full"
    >
      {/* A voz no corpo: presença humana ao lado dos dados reais (os dados ficam em HTML). */}
      <CinematicImage
        name="cantare-corpo-voz"
        overlay="none"
        vignette={false}
        fade="left"
        position="50% 18%"
        className="!left-auto hidden w-[44%] sm:block"
        sizes="(max-width: 1536px) 30vw, 20vw"
      />
      <div className="relative grid min-h-[260px] flex-1 grid-cols-[88px_minmax(0,1fr)] gap-5 sm:grid-cols-[88px_minmax(0,1fr)_32%]">
        <div className="min-h-0 py-1">
          <NoteLadder
            range={ranges?.range}
            highlight={ranges?.comfortable}
            dimmed={!profile}
            min={40}
            max={84}
            ariaLabel={profile ? `Extensão estimada: ${profile.lowestNote} a ${profile.highestNote}` : 'Extensão ainda não medida'}
          />
        </div>

        {profile ? (
          <dl className="flex min-w-0 flex-col justify-center gap-3" style={{ fontFamily: SANS }}>
            <div>
              <dt style={{ fontSize: 12, color: C.paper3 }}>Tipo de voz</dt>
              <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.05 }}>
                {profile.voiceType}
                <span className="block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>estimativa, pode variar</span>
              </dd>
            </div>
            <Fact label="Extensão" value={`${profile.lowestNote} – ${profile.highestNote}`} />
            <Fact label="Região confortável" value={`${profile.comfortableLow} – ${profile.comfortableHigh}`} gold />
            <Fact label="Testado em" value={tested ?? ''} />
            {profile.confidence && profile.confidence !== 'high' && (
              <p style={{ fontSize: 12, color: C.warn, lineHeight: 1.4 }}>Leitura com ruído. Vale refazer.</p>
            )}
            <div className="pt-1">
              <TextLink to="/teste-vocal">Refazer teste</TextLink>
            </div>
          </dl>
        ) : (
          <div className="flex min-w-0 flex-col justify-center gap-4">
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.2 }}>
              Descubra até onde sua voz vai.
            </p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.5 }}>
              Três notas, cerca de 3 minutos. Com isso, o treino fica dentro da sua faixa.
            </p>
            <div>
              <SecondaryButton to="/teste-vocal">Fazer teste vocal</SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Fact({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
      <dt style={{ fontSize: 13, color: C.paper3 }}>{label}</dt>
      <dd style={{ fontFamily: SERIF, fontSize: 19, color: gold ? C.gold : C.paper }}>{value}</dd>
    </div>
  );
}

/* ============ Sequência ============ */

export function TrainingSequence({ exercises, completedIds }: { exercises: DiaryExercise[]; completedIds: string[] }) {
  const nextId = exercises.find((e) => !completedIds.includes(e.id))?.id;

  return (
    <Panel title="Sequência de treino" subtitle="Seu treino de hoje, passo a passo." labelledBy="sequencia" className="h-full">
      <ol className="relative flex flex-1 flex-col justify-between">
        {/* fio que liga os passos */}
        <span aria-hidden className="absolute bottom-3 left-[11px] top-3 w-px" style={{ background: C.rule }} />
        {exercises.map((ex, i) => {
          const isDone = completedIds.includes(ex.id);
          const isNext = ex.id === nextId;
          return (
            <li key={ex.id}>
              <Link
                to="/treinos"
                className={`group relative flex items-center gap-3 rounded-[4px] py-[5px] pr-1 transition-colors hover:bg-white/[0.03] ${focusRing}`}
              >
                <span
                  className="relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: isDone ? C.gold : C.surface,
                    border: `1px solid ${isDone || isNext ? C.gold : 'rgba(232,228,220,0.22)'}`,
                    color: isDone ? C.ink : isNext ? C.gold : C.paper3,
                    fontFamily: SANS,
                    fontSize: 11,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="min-w-0 truncate"
                  style={{ fontFamily: SANS, fontSize: 14, color: isDone ? C.paper3 : C.paper, fontWeight: isNext ? 500 : 400 }}
                >
                  {ex.name}
                </span>
                <span aria-hidden className="mx-1 h-px min-w-4 flex-1" style={{ borderBottom: `1px dotted ${C.rule}` }} />
                <span style={{ fontFamily: SANS, fontSize: 12, color: isDone ? C.gold : C.paper3 }}>
                  {isDone ? 'feito' : formatDuration(ex.durationSec)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
