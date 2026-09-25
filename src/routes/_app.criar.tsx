import { createFileRoute } from '@tanstack/react-router';
import { C, SANS, SecondaryButton } from '@/components/home/primitives';
import { PageTitle } from '@/components/treinos/TabParts';

export const Route = createFileRoute('/_app/criar')({
  head: () => ({ meta: [{ title: 'Criar música — Cantare' }] }),
  component: CriarPage,
});

/**
 * Criar música — primeira perna da tríade (CLAUDE.md, topo e seção 14). A função ainda
 * não existe: a aba está na navegação para mostrar o produto planejado. Nada aqui promete
 * recurso pronto.
 */
function CriarPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={<>Criar sua <em style={{ color: C.gold }}>música</em></>} text="Da ideia à canção, no mesmo lugar do seu repertório." />
      <section
        className="flex flex-col items-start gap-4 rounded-[8px] px-5 py-6"
        style={{ border: `1px solid ${C.rule}`, background: 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)' }}
      >
        <span className="rounded-full px-3 py-1" style={{ fontFamily: SANS, fontSize: 12, color: C.gold, border: '1px solid rgba(184,149,90,0.4)' }}>
          Em breve
        </span>
        <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: C.paper2, maxWidth: 520 }}>
          Enquanto isso, monte o repertório do seu próximo show.
        </p>
        <SecondaryButton to="/repertorio">Ir para o repertório</SecondaryButton>
      </section>
    </div>
  );
}
