import type { Usage } from '@/lib/home/usage';
import { Card, CardTitle, Muted, Skeleton } from './ui';

export type UsageState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; usage: Usage };

/**
 * Evolução na Home = uso do app nos últimos 30 dias (CLAUDE.md, seção 14). Três números reais,
 * sem gráfico. "Músicas criadas" é 0 de verdade enquanto a função não existir.
 */
export function UsageSummary({ state, days }: { state: UsageState; days: number }) {
  return (
    <Card labelledBy="evolucao-titulo" className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div>
          <CardTitle id="evolucao-titulo">Evolução</CardTitle>
          <Muted className="mt-1">Seu uso nos últimos {days} dias.</Muted>
        </div>
        {state.status === 'loading' && <Skeleton className="h-[92px] w-full" />}
        {state.status === 'error' && <Muted>Não conseguimos ler seus dados neste aparelho.</Muted>}
        {state.status === 'loaded' && (
          <dl className="mt-auto grid grid-cols-3 gap-2">
            <Stat value={state.usage.repertoires} one="repertório" many="repertórios" color="var(--c-primary)" />
            <Stat value={state.usage.trainings} one="treino" many="treinos" color="var(--c-green)" />
            <Stat value={state.usage.songsCreated ?? 0} one="música criada" many="músicas criadas" color="var(--c-orange)" />
          </dl>
        )}
      </div>
    </Card>
  );
}

function Stat({ value, one, many, color }: { value: number; one: string; many: string; color: string }) {
  return (
    <div className="flex min-h-[112px] flex-col items-center justify-start rounded-[14px] px-1 pb-3 pt-4 text-center" style={{ background: 'var(--c-bg)' }}>
      <dt className="order-2 mt-1.5 min-h-[2.5em] text-[13px] font-medium leading-tight" style={{ color: 'var(--c-text-2)' }}>{value === 1 ? one : many}</dt>
      <dd className="order-1 text-[30px] font-extrabold leading-none sm:text-[34px]" style={{ color: 'var(--c-text)' }}>{value}</dd>
      <span aria-hidden className="order-3 mt-2 h-1 w-6 rounded-full" style={{ background: color }} />
    </div>
  );
}
