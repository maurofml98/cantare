import { ArrowRight } from 'lucide-react';
import type { LastChallenge } from '@/lib/desafio/afinacao';
import { Card, CardTitle, LinkButton, Muted, Skeleton } from './ui';

export type ChallengeState = { status: 'loading' } | { status: 'loaded'; last: LastChallenge | null };

/**
 * Desafio de afinação — a porta de entrada para a área de Voz (funil da Laury, CLAUDE.md
 * seção 14). Só o último resultado, nada de relatório.
 */
export function PitchChallengeCard({ state }: { state: ChallengeState }) {
  const last = state.status === 'loaded' ? state.last : null;
  return (
    <Card tint="var(--c-green-bg)" labelledBy="desafio-titulo" className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle id="desafio-titulo" size="lg">Desafio de afinação</CardTitle>
            <Muted className="mt-1">Cante 3 notas e descubra como está sua afinação.</Muted>
          </div>
          <WaveMark />
        </div>

        {state.status === 'loading' ? (
          <Skeleton className="h-[72px] w-full" />
        ) : last ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[var(--c-inner)] px-4 py-3">
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--c-text-2)' }}>Último resultado</p>
              <p className="text-[20px] font-extrabold" style={{ color: 'var(--c-text)' }}>
                {last.hits} de {last.total} {last.total === 1 ? 'nota' : 'notas'}
              </p>
              <Dots hits={last.hits} total={last.total} />
            </div>
            <LinkButton to="/desafio" color="var(--c-green-fill)">Jogar de novo</LinkButton>
          </div>
        ) : (
          <div className="mt-auto">
            <LinkButton to="/desafio" color="var(--c-green-fill)" className="w-full sm:w-auto">
              Começar desafio <ArrowRight size={18} strokeWidth={2.5} />
            </LinkButton>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Uma barra por nota; acerto preenchido. O número acima já diz o resultado — a cor só reforça. */
function Dots({ hits, total }: { hits: number; total: number }) {
  return (
    <span className="mt-1.5 flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="h-2 w-10 rounded-full" style={{ background: i < hits ? 'var(--c-green)' : 'var(--c-off)' }} />
      ))}
    </span>
  );
}

function WaveMark() {
  const bars = [10, 22, 34, 22, 12];
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16 shrink-0" aria-hidden>
      {bars.map((h, i) => (
        <rect key={i} x={6 + i * 11} y={22 - h / 2} width="5" height={h} rx="2.5" fill="var(--c-green)" />
      ))}
    </svg>
  );
}
