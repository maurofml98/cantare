import { createFileRoute, Link } from '@tanstack/react-router';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';
import { PageTitle, WarmupNotice, useClientValue } from '@/components/treinos/TabParts';
import { exercisesOf, isRunnable, OBJECTIVES } from '@/lib/treinos/exercises';
import { loadAttempts } from '@/lib/treinos/progress';
import { loadVocalProfile } from '@/lib/vocal/profile';
import { VoicePanel } from '@/components/treinos/VoicePanel';

export const Route = createFileRoute('/_app/treinos/')({
  head: () => ({ meta: [{ title: 'Treinos — Cantare' }] }),
  component: TreinosPage,
});

/**
 * Aba Treinos (PDF da Laury, seção 01): o cantor escolhe o objetivo, como numa academia.
 * Sem ícones nem emoji nos cards (CLAUDE.md, seção 9 — contradição 3 da seção 13 em aberto).
 */
function TreinosPage() {
  // tentativas por objetivo: o card mostra se a pessoa já treinou ali
  const attempts = useClientValue(
    () => Object.fromEntries(OBJECTIVES.map((o) => [o.id, exercisesOf(o.id).reduce((s, e) => s + loadAttempts(e.id).length, 0)])),
    {} as Record<string, number>,
  );
  // O teste vocal vive aqui desde 25/09/2026 (CLAUDE.md, seção 14): feito uma vez, antes do primeiro treino.
  const profile = useClientValue(() => loadVocalProfile(), null);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={<>Treine sua <em style={{ color: C.gold }}>voz</em></>} text="Escolha o que você quer desenvolver hoje." />
      <WarmupNotice />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {OBJECTIVES.map((o) => {
          const list = exercisesOf(o.id);
          const ready = list.filter(isRunnable).length;
          const n = attempts[o.id] ?? 0;
          return (
            <li key={o.id}>
              <Link
                to="/treinos/$objectiveId"
                params={{ objectiveId: o.id }}
                className={`group flex h-full flex-col gap-3 rounded-[8px] px-5 py-5 transition-[border-color,background-color] duration-[var(--dur-hover)] hover:border-[rgba(184,149,90,0.45)] ${focusRing}`}
                style={{ border: `1px solid ${C.rule}`, background: 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)', opacity: ready ? 1 : 0.62 }}
              >
                <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 28, color: C.paper, lineHeight: 1.1 }}>{o.name}</h2>
                <p className="flex-1" style={{ fontFamily: SANS, fontSize: 15, color: C.paper2 }}>{o.desc}</p>
                <p style={{ fontFamily: SANS, fontSize: 13, color: ready ? C.gold : C.paper3 }}>
                  {!ready
                    ? 'Em preparação'
                    : `${list.length} ${list.length === 1 ? 'exercício' : 'exercícios'}${n ? ` · ${n} ${n === 1 ? 'tentativa' : 'tentativas'}` : ''}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <VoicePanel profile={profile} />
    </div>
  );
}
