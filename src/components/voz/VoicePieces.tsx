import { Link } from '@tanstack/react-router';
import { Check, ChevronRight, Lock, Moon, Play } from 'lucide-react';
import type { ObjectiveId, TreinoExercise } from '@/lib/treinos/exercises';
import type { ExerciseState } from '@/lib/treinos/activity';
import type { VocalProfile } from '@/lib/vocal/profile';

/**
 * Peças da aba Voz (redesenho de 25/09/2026, referência `referencias/voz-ref.png`). Tema novo,
 * claro ou escuro, só por token. Regra: a próxima ação primeiro; o resto organizado.
 */

export const objColor = (id: ObjectiveId) => ({
  fill: `var(--c-obj-${id})`,
  bg: `var(--c-obj-${id}-bg)`,
  ink: `var(--c-obj-${id}-ink)`,
});

const card = 'rounded-[20px] border';
const cardStyle = { background: 'var(--c-surface)', borderColor: 'var(--c-border)', boxShadow: 'var(--c-shadow)' };

export function SectionTitle({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[19px] font-extrabold tracking-[-0.01em] sm:text-[21px]" style={{ color: 'var(--c-text)' }}>
      {n ? `${n}. ` : ''}
      {children}
    </h2>
  );
}

const BTN = 'c-press c-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-bold';

/* ============ Continue de onde parou (usuário ativo) ============ */

export function ResumeHero({ exercise, objectiveName, when, goal, warmedUp }: { exercise: TreinoExercise; objectiveName: string; when: string; goal: string; warmedUp: boolean }) {
  return (
    <section aria-labelledby="continuar" className="flex h-full flex-col justify-between gap-5 rounded-[24px] p-5 text-white sm:p-7" style={{ background: 'var(--c-resume)' }}>
      <div>
        <p id="continuar" className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-white">Continue de onde parou</p>
        <p className="mt-2 text-[15px] font-semibold text-white">{objectiveName}</p>
        <p className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[36px]" style={{ lineHeight: 1.1 }}>{exercise.name}</p>
        <p className="mt-2 text-[15px] text-white">Seu último treino foi {when}. {goal}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {warmedUp ? (
          <Link to="/treino/$exerciseId" params={{ exerciseId: exercise.id }} className={`${BTN} bg-white`} style={{ color: '#0B3F9E' }}>
            <Play size={18} className="fill-current" aria-hidden /> Continuar treino
          </Link>
        ) : (
          <>
            <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} search={{ next: 'treinos' }} className={`${BTN} bg-white`} style={{ color: '#0B3F9E' }}>
              Aquecer e continuar
            </Link>
            <span className="text-[14px] font-semibold text-white">O treino abre depois do aquecimento de hoje.</span>
          </>
        )}
      </div>
    </section>
  );
}

/* ============ Aquecimento ============ */

// Mesmos ids de src/data/vocal-exercises.ts. Aquecimento não tem nível, tem estilo (CLAUDE.md, seção 3).
const STYLES = [
  { id: 'geral', title: 'Geral' },
  { id: 'agudos', title: 'Agudos' },
  { id: 'graves', title: 'Graves' },
  { id: 'gravacao', title: 'Gravação' },
  { id: 'diccao', title: 'Dicção' },
];

/** Usuário novo (ou sem aquecimento hoje sem treino para retomar): a ação principal da tela. */
export function WarmupFirst({ n }: { n?: number }) {
  return (
    <section aria-labelledby="aquecer" className={`${card} flex flex-col gap-4 p-5 sm:p-6`} style={{ ...cardStyle, background: 'var(--c-surface-blue)', borderColor: 'transparent' }}>
      <div>
        <h2 id="aquecer" className="text-[22px] font-extrabold tracking-[-0.01em] sm:text-[26px]" style={{ color: 'var(--c-text)' }}>
          {n ? `${n}. ` : ''}Comece pelo aquecimento
        </h2>
        <p className="mt-1 text-[15px]" style={{ color: 'var(--c-text-2)' }}>Prepare a voz antes de qualquer treino ou show.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link to="/saude/$warmupId" params={{ warmupId: 'geral' }} className={`${BTN} text-white sm:min-w-[220px]`} style={{ background: 'var(--c-primary)' }}>
          Fazer aquecimento
        </Link>
        <span className="text-[14px]" style={{ color: 'var(--c-text-2)' }}>Geral é o recomendado para começar.</span>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-bold" style={{ color: 'var(--c-text-2)' }}>Ou escolha um estilo</p>
        <ul className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <li key={s.id}>
              <Link
                to="/saude/$warmupId"
                params={{ warmupId: s.id }}
                className="c-press c-focus inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border px-4 text-[15px] font-semibold"
                style={{ background: 'var(--c-inner)', borderColor: s.id === 'geral' ? 'var(--c-primary)' : 'var(--c-border)', color: 'var(--c-text)' }}
              >
                {s.title}
                {s.id === 'geral' && <span className="text-[12px] font-bold" style={{ color: 'var(--c-primary-ink)' }}>· recomendado</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <CooldownRow />
    </section>
  );
}

/** Aquecimento de hoje, compacto: feito (verde) ou pendente (ação). */
export function WarmupToday({ warmedUp }: { warmedUp: boolean }) {
  return (
    <section aria-labelledby="aquecimento-hoje" className={`${card} flex h-full flex-col gap-3 p-5`} style={cardStyle}>
      <h2 id="aquecimento-hoje" className="text-[17px] font-extrabold" style={{ color: 'var(--c-text)' }}>Aquecimento de hoje</h2>
      {warmedUp ? (
        <p className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-bold" style={{ background: 'var(--c-green-bg)', color: 'var(--c-green-ink)' }}>
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--c-green)' }}><Check size={13} strokeWidth={3} color="#fff" /></span>
          Já realizado
        </p>
      ) : (
        <p className="text-[15px] font-semibold" style={{ color: 'var(--c-pending-ink)' }}>Aqueça antes de treinar.</p>
      )}
      <div className="mt-auto flex flex-col gap-2">
        <Link
          to="/saude/$warmupId"
          params={{ warmupId: 'geral' }}
          className={`${BTN} ${warmedUp ? 'border' : 'text-white'}`}
          style={warmedUp ? { borderColor: 'var(--c-line-strong)', color: 'var(--c-text)', background: 'var(--c-inner)' } : { background: 'var(--c-primary)' }}
        >
          {warmedUp ? 'Fazer novamente' : 'Fazer aquecimento'}
        </Link>
        <CooldownRow compact />
      </div>
    </section>
  );
}

function CooldownRow({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/saude/$warmupId"
      params={{ warmupId: 'desaquecimento' }}
      className="c-focus flex min-h-[48px] items-center gap-3 rounded-[12px] px-1 text-left"
      style={{ color: 'var(--c-text)' }}
    >
      <Moon size={20} aria-hidden style={{ color: 'var(--c-primary-ink)' }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">Desaquecimento</span>
        {!compact && <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>Para depois do treino ou do show.</span>}
      </span>
      <ChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-2)' }} />
    </Link>
  );
}

/* ============ Objetivos ============ */

export interface ObjectiveItem {
  id: ObjectiveId;
  name: string;
  desc: string;
  /** "Último treino: ontem" | "Ainda não iniciado" | "Em preparação" */
  line: string;
  ready: boolean;
}

/** Cartões no desktop/tablet; linhas compactas no celular. Sem porcentagem. */
export function ObjectivesGrid({ items }: { items: ObjectiveItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
      {items.map((o) => {
        const c = objColor(o.id);
        return (
          <li key={o.id}>
            <Link
              to="/treinos/$objectiveId"
              params={{ objectiveId: o.id }}
              className="c-lift c-focus flex h-full min-h-[64px] items-center gap-3 rounded-[16px] border px-4 py-3 lg:min-h-[104px] lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:py-4"
              style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            >
              <span aria-hidden className="h-9 w-1.5 shrink-0 rounded-full lg:h-1.5 lg:w-9" style={{ background: c.fill }} />
              <span className="min-w-0 flex-1 lg:flex-none">
                <span className="block text-[16px] font-extrabold" style={{ color: 'var(--c-text)' }}>{o.name}</span>
                <span className="block text-[13px]" style={{ color: o.ready ? 'var(--c-text-2)' : 'var(--c-text-2)' }}>{o.line}</span>
              </span>
              <ChevronRight size={18} aria-hidden className="shrink-0 lg:hidden" style={{ color: 'var(--c-text-2)' }} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ============ Sua voz ============ */

/** Usuário sem teste vocal: convite, no fim da tela. */
export function VocalTestEntry({ n }: { n?: number }) {
  return (
    <section aria-labelledby="sua-voz" className={`${card} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`} style={cardStyle}>
      <div>
        <h2 id="sua-voz" className="text-[19px] font-extrabold sm:text-[21px]" style={{ color: 'var(--c-text)' }}>{n ? `${n}. ` : ''}Descubra até onde sua voz vai</h2>
        <p className="mt-1 text-[15px]" style={{ color: 'var(--c-text-2)' }}>Um teste rápido da sua extensão. Leva cerca de 3 minutos.</p>
      </div>
      <Link to="/teste-vocal" className={`${BTN} shrink-0 border`} style={{ borderColor: 'var(--c-line-strong)', background: 'var(--c-inner)', color: 'var(--c-text)' }}>
        Fazer teste vocal
      </Link>
    </section>
  );
}

/** Usuário com teste: só um atalho discreto — o perfil é pontual, não domina. */
export function VocalProfileShortcut({ profile }: { profile: VocalProfile | null }) {
  return (
    <Link
      to="/teste-vocal"
      className="c-focus flex min-h-[56px] items-center gap-3 rounded-[16px] border px-4"
      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold" style={{ color: 'var(--c-text)' }}>{profile ? 'Perfil vocal' : 'Conheça seu perfil vocal'}</span>
        <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>
          {profile ? `Extensão ${profile.lowestNote} – ${profile.highestNote} · ver resultado` : 'Um teste rápido da sua extensão'}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-2)' }} />
    </Link>
  );
}

/* ============ Linha de exercício (dentro do objetivo) ============ */

const STATE_LABEL: Record<ExerciseState, string> = { preparacao: 'Em breve', comecar: 'Começar', continuar: 'Continuar', concluido: 'Concluído' };

/** Compacta: nome + uma linha (meta ou recorde) + estado. Meta/recorde completos ficam no exercício. */
export function ExerciseRow({ exercise, line, state, objective }: { exercise: TreinoExercise; line: string; state: ExerciseState; objective: ObjectiveId }) {
  const c = objColor(objective);
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-bold" style={{ color: state === 'preparacao' ? 'var(--c-text-2)' : 'var(--c-text)' }}>{exercise.name}</span>
        <span className="block truncate text-[13px]" style={{ color: 'var(--c-text-2)' }}>{line}</span>
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
        style={
          state === 'concluido'
            ? { background: 'var(--c-green-bg)', color: 'var(--c-green-ink)' }
            : state === 'preparacao'
              ? { background: 'var(--c-muted-bg)', color: 'var(--c-text-2)' }
              : { background: c.bg, color: c.ink }
        }
      >
        {state === 'concluido' && <Check size={13} strokeWidth={3} aria-hidden />}
        {state === 'preparacao' && <Lock size={12} aria-hidden />}
        {STATE_LABEL[state]}
      </span>
      {state !== 'preparacao' && <ChevronRight size={18} aria-hidden className="shrink-0" style={{ color: 'var(--c-text-2)' }} />}
    </>
  );
  const cls = 'flex min-h-[60px] items-center gap-3 px-4 py-2';
  return (
    <li className="border-b last:border-b-0" style={{ borderColor: 'var(--c-border)' }}>
      {state === 'preparacao' ? (
        <div className={cls} aria-disabled>{body}</div>
      ) : (
        <Link to="/treino/$exerciseId" params={{ exerciseId: exercise.id }} className={`${cls} c-focus transition-colors duration-150 hover:bg-[var(--c-surface-blue)]`}>
          {body}
        </Link>
      )}
    </li>
  );
}
