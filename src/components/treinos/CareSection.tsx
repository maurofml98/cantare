import { Link } from '@tanstack/react-router';
import { C, SANS, SERIF, TextLink, focusRing } from '@/components/home/primitives';
import { Glyph, HEALTH } from '@/components/home/HomeSections';

/**
 * Topo da aba Treino (25/09/2026): aquecimento e desaquecimento em destaque — o que a pessoa
 * mais acessa, inclusive quem só quer aquecer antes do show sem treinar. A Saúde Vocal completa
 * (`/saude`: checklist, água, registro) vive dentro de Treino, pelo link abaixo.
 *
 * TODO(Laury): os aquecimentos de `src/data/vocal-exercises.ts` vieram do protótipo e ainda não
 * foram validados por ela.
 */
export function CareSection({ warmedUp }: { warmedUp: boolean }) {
  const styles = HEALTH.filter((h) => h.id !== 'desaquecimento');
  return (
    <section aria-labelledby="cuidar" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4 px-1">
        <h2 id="cuidar" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 28, color: C.paper, lineHeight: 1.1 }}>
          Aquecer e desaquecer
        </h2>
        <TextLink to="/saude">Saúde vocal completa</TextLink>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MainCard
          to="geral"
          title="Aquecimento"
          text={warmedUp ? 'Feito hoje. Sua voz está pronta.' : 'Antes de cantar ou treinar.'}
          done={warmedUp}
          glow
        />
        <MainCard to="desaquecimento" title="Desaquecimento" text="Depois do show ou do treino." />
      </div>

      {/* estilos de aquecimento — "não tem níveis, tem estilos" (CLAUDE.md, seção 3) */}
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {styles.map((h) => (
          <li key={h.id}>
            <Link
              to="/saude/$warmupId"
              params={{ warmupId: h.id }}
              className={`flex h-full items-center gap-3 rounded-[6px] p-3 transition-colors hover:border-[rgba(184,149,90,0.4)] hover:bg-[rgba(184,149,90,0.05)] ${focusRing}`}
              style={{ border: `1px solid ${C.rule}`, background: 'rgba(255,255,255,0.015)' }}
            >
              <Glyph kind={h.glyph} />
              <span className="min-w-0">
                <span className="block truncate" style={{ fontFamily: SERIF, fontSize: 18, color: C.paper, lineHeight: 1.1 }}>{h.title}</span>
                <span className="block truncate" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{h.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MainCard({ to, title, text, done = false, glow = false }: { to: string; title: string; text: string; done?: boolean; glow?: boolean }) {
  return (
    <Link
      to="/saude/$warmupId"
      params={{ warmupId: to }}
      className={`group flex min-h-[112px] flex-col justify-between gap-3 rounded-[8px] px-5 py-4 transition-[border-color,background-color] duration-[var(--dur-hover)] hover:border-[rgba(184,149,90,0.6)] ${focusRing}`}
      style={{
        border: `1px solid ${glow && !done ? 'rgba(184,149,90,0.35)' : C.rule}`,
        background: glow
          ? 'radial-gradient(120% 90% at 0% 0%, rgba(184,149,90,0.10) 0%, rgba(184,149,90,0) 55%), linear-gradient(180deg, #101216 0%, #0B0C0F 100%)'
          : 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)',
      }}
    >
      <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.05 }}>{title}</span>
      <span className="flex items-center justify-between gap-3">
        <span style={{ fontFamily: SANS, fontSize: 14, color: done ? C.gold : C.paper2 }}>{text}</span>
        <span style={{ fontFamily: SANS, fontSize: 14, color: C.gold }}>{done ? 'Refazer' : 'Começar'}</span>
      </span>
    </Link>
  );
}
