import { Link } from '@tanstack/react-router';
import type { RepertoireProject } from '@/lib/types';
import { C, SANS, SERIF, SecondaryButton, SectionHeading } from './primitives';

/* ---------- Saúde Vocal ---------- */

// Mesmos ids e títulos de src/routes/_app.saude.index.tsx (lá não são exportados).
const HEALTH_SHORTCUTS = [
  { id: 'agudos', title: 'Agudos', desc: 'Leveza para notas altas' },
  { id: 'graves', title: 'Graves', desc: 'Relaxamento e ressonância' },
  { id: 'gravacao', title: 'Dia de gravação', desc: 'Clareza e precisão' },
  { id: 'desaquecimento', title: 'Pós-show', desc: 'Desaquecer e recuperar' },
];

export function HealthShortcuts() {
  return (
    <section aria-labelledby="saude-atalhos">
      <SectionHeading title="Sua voz precisa de quê?" link={{ to: '/saude', label: 'Ver todos' }} />
      <ul id="saude-atalhos" className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[6px]" style={{ background: C.rule }}>
        {HEALTH_SHORTCUTS.map((h) => (
          <li key={h.id} style={{ background: C.ink }}>
            <Link
              to="/saude/$warmupId"
              params={{ warmupId: h.id }}
              className="block h-full p-4 transition-colors hover:bg-white/[0.025]"
            >
              <span className="block" style={{ fontFamily: SERIF, fontSize: 20, color: C.paper, lineHeight: 1.15 }}>
                {h.title}
              </span>
              <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.4 }}>
                {h.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Repertório ---------- */

export function RecentProject({ project }: { project: RepertoireProject | null }) {
  if (!project) {
    return (
      <section aria-labelledby="repertorio-recente">
        <SectionHeading title="Repertório" />
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.rule}` }}>
          <p id="repertorio-recente" style={{ fontFamily: SERIF, fontSize: 22, color: C.paper, lineHeight: 1.2 }}>
            Crie seu primeiro repertório
          </p>
          <p className="mt-1 mb-4" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
            Um projeto por show: o bar de sexta, o casamento de sábado.
          </p>
          <SecondaryButton to="/repertorio">Criar projeto</SecondaryButton>
        </div>
      </section>
    );
  }

  const songs = project.songs.slice(0, 4);
  const extra = project.songs.length - songs.length;

  return (
    <section aria-labelledby="repertorio-recente">
      <SectionHeading title="Repertório" link={{ to: '/repertorio', label: 'Todos os projetos' }} />
      <Link
        to="/repertorio/$projectId"
        params={{ projectId: project.id }}
        className="mt-4 block pt-4 group"
        style={{ borderTop: `1px solid ${C.rule}` }}
      >
        <p
          id="repertorio-recente"
          className="truncate group-hover:underline underline-offset-4"
          style={{ fontFamily: SERIF, fontSize: 22, color: C.paper, lineHeight: 1.2 }}
        >
          {project.name}
        </p>
        <p className="mt-0.5" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
          {project.type} · {project.songs.length} {project.songs.length === 1 ? 'música' : 'músicas'}
        </p>
      </Link>

      {songs.length === 0 ? (
        <div className="mt-3">
          <Link
            to="/repertorio/$projectId"
            params={{ projectId: project.id }}
            className="underline-offset-4 hover:underline"
            style={{ fontFamily: SANS, fontSize: 13, color: C.gold }}
          >
            Adicionar as primeiras músicas
          </Link>
        </div>
      ) : (
        <ul className="mt-3">
          {songs.map((s) => (
            <li
              key={s.id}
              className="flex items-baseline gap-3 py-2"
              style={{ borderTop: `1px solid ${C.rule}` }}
            >
              <span className="min-w-0 flex-1 truncate" style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>
                {s.title}
                {s.artist && <span style={{ color: C.paper3 }}> · {s.artist}</span>}
              </span>
              <span
                className="w-8 text-right"
                style={{ fontFamily: SERIF, fontSize: 17, color: s.currentKey ? C.gold : C.paper3 }}
                title={s.currentKey ? `Tom: ${s.currentKey}` : 'Tom não definido'}
              >
                {s.currentKey || '—'}
              </span>
            </li>
          ))}
          {extra > 0 && (
            <li className="pt-2" style={{ borderTop: `1px solid ${C.rule}`, fontFamily: SANS, fontSize: 12, color: C.paper3 }}>
              e mais {extra}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/* ---------- Dica da Laury ---------- */

// TODO(Laury): texto provisório, reaproveitado da dica do aquecimento
// (src/components/diario/WarmupInstrumentHUD.tsx). O texto final e a rotação de
// dicas vêm dela — não inventar conteúdo clínico.
const TIP = 'Inspire pelo nariz, expire com controle. Sinta o ar sustentando o som.';

export function LauryTip() {
  return (
    <section aria-label="Dica da Laury" className="pl-5" style={{ borderLeft: `2px solid ${C.gold}` }}>
      <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 23, color: C.paper, lineHeight: 1.3 }}>
        “{TIP}”
      </blockquote>
      <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
        Laury <span style={{ color: C.paper3 }}>· fonoaudióloga</span>
      </p>
      <p className="mt-3" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.45 }}>
        Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.
      </p>
    </section>
  );
}

/* ---------- Evolução ---------- */

export function EvolutionSummary({ streak, accuracy }: { streak: number; accuracy: number | null }) {
  return (
    <section aria-labelledby="evolucao-resumo">
      <SectionHeading title="Evolução" link={{ to: '/diario/evolucao', label: 'Detalhes' }} />
      <dl id="evolucao-resumo" className="mt-4 grid grid-cols-2" style={{ borderTop: `1px solid ${C.rule}` }}>
        <div className="pt-4 pr-4">
          <dt className="sr-only">Dias seguidos</dt>
          <dd>
            {streak > 0 ? (
              <>
                <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 48, color: C.paper, lineHeight: 0.9 }}>
                  {streak}
                </span>
                <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
                  {streak === 1 ? 'dia seguido' : 'dias seguidos'}
                </span>
              </>
            ) : (
              <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.45 }}>
                Complete o treino de hoje para começar sua sequência.
              </span>
            )}
          </dd>
        </div>
        <div className="pt-4 pl-4" style={{ borderLeft: `1px solid ${C.rule}` }}>
          <dt className="sr-only">Precisão média</dt>
          <dd>
            {accuracy !== null ? (
              <>
                <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 48, color: C.paper, lineHeight: 0.9 }}>
                  {accuracy}
                  <span style={{ fontSize: 26, color: C.paper3 }}>%</span>
                </span>
                <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
                  precisão nos últimos 7 dias
                </span>
              </>
            ) : (
              <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.45 }}>
                Sua precisão aparece depois do primeiro exercício cantado.
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
