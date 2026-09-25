import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { VOCAL_DATA } from '../data/vocal-exercises';
import { Button, buttonVariants } from '@/components/ui/button';
import { VoiceBodyMap, regionsFor } from '@/components/vocal/VoiceBodyMap';
import { C, LINING, Panel, SANS, SERIF, focusRing } from '@/components/home/primitives';
import { markWarmupDone } from '@/lib/treinos/warmup';

export const Route = createFileRoute('/_app/saude/$warmupId')({
  // `next`: ao terminar, segue para o treino (funil do desafio) ou para o teste vocal (trava do teste).
  validateSearch: (s: Record<string, unknown>): { next?: 'treinos' | 'teste-vocal' } =>
    s.next === 'treinos' || s.next === 'teste-vocal' ? { next: s.next } : {},
  component: WarmupPage,
});

// TODO(Laury): os exercícios de src/data/vocal-exercises.ts vieram do protótipo e ainda não foram
// validados por ela (instruções, séries e repetições). Não usar com usuário real antes disso.

function WarmupPage() {
  const { warmupId } = Route.useParams();
  const { next: after } = Route.useSearch();
  const navigate = useNavigate();
  const warmup = VOCAL_DATA[warmupId];
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const regions = useMemo(
    () => (warmup ? regionsFor(`${warmup.exercises[step].name} ${warmup.exercises[step].instruction}`) : []),
    [warmup, step],
  );

  if (!warmup) {
    return (
      <Panel title="Aquecimento não encontrado" subtitle="O link pode estar desatualizado." className="max-w-2xl">
        <p style={{ fontFamily: SANS, fontSize: 15, color: C.paper2 }}>Escolha um dos aquecimentos disponíveis na Saúde Vocal.</p>
        <div className="mt-5">
          <Link to="/saude" className={buttonVariants({ variant: 'primary' })}>Ver aquecimentos</Link>
        </div>
      </Panel>
    );
  }

  const total = warmup.exercises.length;
  const ex = warmup.exercises[step];
  const isLast = step === total - 1;

  const next = () => {
    if (!isLast) return setStep((s) => s + 1);
    setFinishing(true);
    // Libera a aba Treinos no dia. Desaquecimento não conta como aquecimento.
    if (warmupId !== 'desaquecimento') markWarmupDone();
    toast.success('Aquecimento concluído', { description: 'Sua voz está pronta. Bom ensaio!' });
    const to = warmupId === 'desaquecimento' || !after ? '/saude' : after === 'treinos' ? '/treinos' : '/teste-vocal/executar';
    setTimeout(() => navigate({ to }), 450);
  };

  return (
    <div style={LINING} className="grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:h-[calc(100dvh-3rem)] 2xl:grid-rows-[auto_minmax(0,1fr)]">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-end justify-between gap-4 px-1 lg:col-span-12">
        <div>
          <Link to="/saude" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} -ml-3 mb-2`}>
            <ArrowLeft /> Saúde vocal
          </Link>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(38px, 3.6vw, 60px)', color: C.paper, lineHeight: 1 }}>
            {warmup.name}
          </h1>
          <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: C.paper2 }}>{warmup.description}</p>
        </div>
        <div className="w-full max-w-sm">
          <div className="flex justify-between" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
            <span>Exercício {step + 1} de {total}</span>
            <span style={{ color: C.gold }}>{Math.round(((step + 1) / total) * 100)}%</span>
          </div>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {warmup.exercises.map((e, i) => (
              <span key={e.id} className="h-[3px] flex-1 rounded-full" style={{ background: i <= step ? C.gold : 'rgba(232,228,220,0.12)', transition: 'background var(--dur-progress) var(--ease-out)' }} />
            ))}
          </div>
        </div>
      </header>

      {/* Sequência */}
      <Panel title="Sequência" subtitle="Toque para ir direto a um passo." labelledBy="seq" className="lg:col-span-3">
        <ol className="flex flex-col gap-2">
          {warmup.exercises.map((e, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'next';
            return (
              <li key={e.id}>
                <button
                  onClick={() => setStep(i)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-[6px] px-3 py-3 text-left transition-[background-color,border-color,transform] duration-[var(--dur-hover)] hover:bg-white/[0.03] active:scale-[0.99] ${focusRing}`}
                  style={{ border: `1px solid ${state === 'current' ? 'rgba(184,149,90,0.5)' : 'transparent'}`, background: state === 'current' ? 'rgba(184,149,90,0.06)' : undefined }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${state === 'next' ? 'rgba(232,228,220,0.2)' : C.gold}`, background: state === 'done' ? C.gold : 'transparent', color: state === 'done' ? C.ink : state === 'current' ? C.gold : C.paper3, fontFamily: SANS, fontSize: 12 }}
                  >
                    {state === 'done' ? <Check size={14} strokeWidth={2} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate" style={{ fontFamily: SANS, fontSize: 14, color: state === 'next' ? C.paper2 : C.paper, fontWeight: state === 'current' ? 500 : 400 }}>{e.name}</span>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{e.sets} × {e.reps}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* Exercício atual */}
      <Panel glow className="lg:col-span-5" bodyClassName="!p-0">
        <div key={ex.id} className="flex h-full flex-col p-6 animate-in fade-in slide-in-from-bottom-1 duration-300 2xl:p-8">
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.gold }}>Agora</span>
          <h2 className="mt-1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(32px, 2.6vw, 46px)', color: C.paper, lineHeight: 1.05 }}>{ex.name}</h2>
          <p className="mt-4 max-w-xl" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 18, color: C.paper2, lineHeight: 1.55 }}>{ex.instruction}</p>

          <dl className="mt-6 grid max-w-sm grid-cols-2" style={{ borderTop: `1px solid ${C.rule}` }}>
            <div className="pt-4">
              <dt style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Séries</dt>
              <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, color: C.paper, lineHeight: 1 }}>{ex.sets}</dd>
            </div>
            <div className="pl-5 pt-4" style={{ borderLeft: `1px solid ${C.rule}` }}>
              <dt style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Repetições</dt>
              <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, color: C.gold, lineHeight: 1 }}>{ex.reps}</dd>
            </div>
          </dl>

          <p className="mt-6 pl-3" style={{ borderLeft: `2px solid ${C.warn}`, fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.45 }}>
            Sem dor e sem forçar. Sentiu desconforto ou rouquidão? Pare e procure um profissional.
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0} title={step === 0 ? 'Este é o primeiro exercício' : undefined}>
              <ChevronLeft /> Anterior
            </Button>
            <Button size="lg" onClick={next} loading={finishing} loadingLabel="Concluindo aquecimento" className="min-w-[180px]">
              {isLast ? <><Check /> Concluir</> : <>Próximo <ChevronRight /></>}
            </Button>
          </div>
        </div>
      </Panel>

      {/* Corpo */}
      <Panel title="Onde você sente" subtitle="Região que este exercício mais envolve." labelledBy="corpo" className="lg:col-span-4" bodyClassName="items-center justify-center">
        <VoiceBodyMap active={regions} breathing={regions.includes('peito')} className="h-[320px] w-full sm:h-[380px] 2xl:h-full 2xl:max-h-[620px]" />
      </Panel>
    </div>
  );
}
