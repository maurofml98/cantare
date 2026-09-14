import { Link } from '@tanstack/react-router';
import { NoteLadder } from '@/components/vocal/NoteLadder';
import type { VocalProfile } from '@/lib/vocal/profile';
import { formatDuration, profileRanges, totalMinutes, type DiaryExercise } from '@/lib/home/today';
import { C, SANS, SERIF, PrimaryButton, SectionHeading, TextLink } from './primitives';

interface TodayTrainingCardProps {
  exercises: DiaryExercise[];
  completedIds: string[];
  profile: VocalProfile | null;
}

export function TodayTrainingCard({ exercises, completedIds, profile }: TodayTrainingCardProps) {
  const total = exercises.length;
  const done = exercises.filter((e) => completedIds.includes(e.id)).length;
  const next = exercises.find((e) => !completedIds.includes(e.id)) ?? null;
  const minutes = totalMinutes(exercises);

  return (
    <section
      className="rounded-[6px] p-5 sm:p-7"
      style={{ background: C.surface, border: `1px solid ${C.rule}` }}
      aria-labelledby="treino-hoje"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 sm:gap-8">
        <div className="flex min-w-0 flex-col">
          <h2
            id="treino-hoje"
            style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 6vw, 40px)', color: C.paper, lineHeight: 1 }}
          >
            Treino de hoje
          </h2>
          <p className="mt-2" style={{ fontFamily: SANS, fontSize: 14, color: C.paper3 }}>
            {total} exercícios · cerca de {minutes} min
          </p>

          <div className="mt-6">
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>
              <span style={{ fontFamily: SERIF, fontSize: 34, color: C.paper, lineHeight: 1 }}>{done}</span>
              <span style={{ fontFamily: SERIF, fontSize: 22, color: C.paper3 }}> de {total}</span>
              <span className="ml-2">concluídos</span>
            </p>
            {/* um segmento por exercício: a sequência, não uma barra genérica */}
            <div className="mt-3 flex gap-1" aria-hidden>
              {exercises.map((e) => (
                <span
                  key={e.id}
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    background: completedIds.includes(e.id) ? C.gold : 'rgba(232,228,220,0.1)',
                    transition: 'background .4s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {next ? (
            <p className="mt-5" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3, lineHeight: 1.45 }}>
              {done === 0 ? 'Aquecer antes de treinar protege a voz.' : `Próximo: ${next.name}`}
            </p>
          ) : (
            <div className="mt-5">
              <p style={{ fontFamily: SERIF, fontSize: 24, color: C.paper, lineHeight: 1.15 }}>
                Treino de hoje concluído.
              </p>
              <div className="mt-2">
                <TextLink to="/diario/evolucao">Ver sua evolução</TextLink>
              </div>
            </div>
          )}
        </div>

        <VoiceRange profile={profile} />
      </div>

      {next && (
        <div className="mt-6">
          <PrimaryButton to="/diario">
            {done === 0 ? 'Começar pelo aquecimento' : 'Continuar treino'}
          </PrimaryButton>
        </div>
      )}
    </section>
  );
}

function VoiceRange({ profile }: { profile: VocalProfile | null }) {
  const ranges = profile ? profileRanges(profile) : null;
  const label = profile
    ? `Sua extensão estimada: ${profile.lowestNote} a ${profile.highestNote}`
    : 'Extensão vocal ainda não medida';

  return (
    <div className="flex w-[76px] flex-col items-end sm:w-[96px]">
      <div className="h-[210px] w-full sm:h-[250px] lg:h-[320px]">
        <NoteLadder
          range={ranges?.range}
          highlight={ranges?.comfortable}
          dimmed={!profile}
          ariaLabel={label}
        />
      </div>
      <div className="mt-3 text-right">
        {profile ? (
          <>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: C.paper, lineHeight: 1.1 }}>
              {profile.lowestNote}–{profile.highestNote}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 11, color: C.paper3, lineHeight: 1.35 }}>
              {profile.voiceType}, estimado
            </p>
            <Link
              to="/teste-vocal"
              className="mt-1 inline-block underline-offset-4 hover:underline"
              style={{ fontFamily: SANS, fontSize: 11, color: C.gold }}
            >
              Refazer
            </Link>
          </>
        ) : (
          <Link
            to="/teste-vocal"
            className="inline-block underline-offset-4 hover:underline"
            style={{ fontFamily: SANS, fontSize: 12, color: C.gold, lineHeight: 1.35 }}
          >
            Medir minha voz
          </Link>
        )}
      </div>
    </div>
  );
}

export function TrainingSequence({ exercises, completedIds }: { exercises: DiaryExercise[]; completedIds: string[] }) {
  const nextId = exercises.find((e) => !completedIds.includes(e.id))?.id;

  return (
    <section aria-labelledby="sequencia">
      <SectionHeading title="Sequência do treino" />
      <ol className="mt-4" id="sequencia">
        {exercises.map((ex, i) => {
          const isDone = completedIds.includes(ex.id);
          const isNext = ex.id === nextId;
          return (
            <li key={ex.id} style={{ borderTop: `1px solid ${C.rule}` }}>
              <Link
                to="/diario"
                className="flex items-center gap-4 py-3.5 pl-3 pr-1 transition-colors hover:bg-white/[0.02]"
                style={{ borderLeft: `2px solid ${isNext ? C.gold : 'transparent'}` }}
              >
                <span
                  className="w-5 text-right tabular-nums"
                  style={{ fontFamily: SANS, fontSize: 13, color: isDone || isNext ? C.gold : C.paper3 }}
                >
                  {i + 1}
                </span>
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ fontFamily: SANS, fontSize: 15, color: isDone ? C.paper3 : C.paper }}
                >
                  {ex.name}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: isDone ? C.gold : C.paper3 }}>
                  {isDone ? 'feito' : formatDuration(ex.durationSec)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
