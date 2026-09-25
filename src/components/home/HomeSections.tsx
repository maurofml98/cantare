import { Link } from '@tanstack/react-router';
import type { RepertoireProject } from '@/lib/types';
import type { Usage } from '@/lib/home/usage';
import { C, Panel, PrimaryButton, SANS, SecondaryButton, SERIF, TextLink, focusRing } from './primitives';
import { CinematicImage } from '@/components/media/CinematicImage';

/* ============ Repertório ============ */

export function WeekRepertoire({ project }: { project: RepertoireProject | null }) {
  if (!project) {
    return (
      <Panel title="Repertório" subtitle="Seus shows organizados por projeto." labelledBy="repertorio" className="h-full" media={<CinematicImage name="cantare-home-repertorio" overlay="left" intensity={0.7} vignette={false} fade="bottom" position="72% 55%" className="bottom-auto h-[62%]" sizes="(max-width: 1536px) 50vw, 30vw" />}>
        <div className="flex flex-1 flex-col justify-center">
          <StaffLines />
          <p className="mt-5" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.2 }}>
            Crie seu primeiro repertório
          </p>
          <p className="mb-5 mt-1" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.5 }}>
            Um projeto por show: o bar de sexta, o casamento de sábado.
          </p>
          <div>
            <SecondaryButton to="/repertorio">Criar projeto</SecondaryButton>
          </div>
        </div>
      </Panel>
    );
  }

  const songs = project.songs.slice(0, 4);
  const count = project.songs.length;

  return (
    <Panel title="Repertório" subtitle="O projeto em que você mexeu por último." labelledBy="repertorio" className="h-full" media={<CinematicImage name="cantare-home-repertorio" overlay="left" intensity={0.7} vignette={false} fade="bottom" position="72% 55%" className="bottom-auto h-[62%]" sizes="(max-width: 1536px) 50vw, 30vw" />}>
      <Link
        to="/repertorio/$projectId"
        params={{ projectId: project.id }}
        className={`-mx-2 flex items-baseline justify-between gap-3 rounded-[4px] px-2 py-1 transition-colors hover:bg-white/[0.03] ${focusRing}`}
      >
        <span className="min-w-0 truncate" style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: C.paper }}>
          {project.name} <span style={{ fontWeight: 400, color: C.paper3 }}>· {project.type}</span>
        </span>
        <span className="shrink-0" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>
          {count} {count === 1 ? 'música' : 'músicas'}
        </span>
      </Link>

      {songs.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center">
          <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>Projeto criado. Falta montar a lista.</p>
          <div className="mt-3">
            <TextLink to="/repertorio">Adicionar músicas</TextLink>
          </div>
        </div>
      ) : (
        <>
          <ol className="mt-1 min-h-0 flex-1 overflow-hidden">
            {songs.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 py-[7px]" style={{ borderTop: `1px solid ${C.rule}` }}>
                <span className="w-4 text-right" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate" style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>
                  {s.title}
                  {s.artist && <span style={{ color: C.paper3 }}> · {s.artist}</span>}
                </span>
                <span
                  className="w-9 text-right"
                  title={s.currentKey ? `Tom: ${s.currentKey}` : 'Tom ainda não definido'}
                  style={{ fontFamily: SERIF, fontSize: 18, color: s.currentKey ? C.gold : C.paper3 }}
                >
                  {s.currentKey || '—'}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.rule}` }}>
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>
              {count > songs.length ? `e mais ${count - songs.length}` : 'Lista completa'}
            </span>
            <TextLink to="/repertorio">Ver repertório completo</TextLink>
          </div>
        </>
      )}
    </Panel>
  );
}

function StaffLines() {
  return (
    <svg width="120" height="34" viewBox="0 0 120 34" fill="none" aria-hidden>
      {[3, 10, 17, 24, 31].map((y) => (
        <line key={y} x1="0" x2="120" y1={y} y2={y} stroke="rgba(184,149,90,0.35)" strokeWidth="1" />
      ))}
      <ellipse cx="40" cy="20.5" rx="5" ry="3.6" fill={C.gold} transform="rotate(-18 40 20.5)" />
      <line x1="44.6" y1="19.5" x2="44.6" y2="2" stroke={C.gold} strokeWidth="1.2" />
    </svg>
  );
}

/* ============ Em breve ============ */

function SoonTag() {
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5" style={{ fontFamily: SANS, fontSize: 11, color: C.gold, border: '1px solid rgba(184,149,90,0.4)' }}>
      Em breve
    </span>
  );
}

/** Primeira perna da tríade (CLAUDE.md, topo). A função não existe: o card mostra o plano, sem prometer data. */
export function CreateMusicCard() {
  return (
    <Panel title="Criar sua música" subtitle="Da ideia à canção, junto do seu repertório." labelledBy="criar" className="h-full">
      <div className="flex flex-1 flex-col justify-between gap-4">
        <StaffLines />
        <div className="flex items-center justify-between gap-3">
          <SoonTag />
          <TextLink to="/criar">Conhecer</TextLink>
        </div>
      </div>
    </Panel>
  );
}

/** Jogos de ritmo e de ouvido (ROADMAP, Fase 7). Fora da barra inferior por decisão de 25/09/2026. */
export function PlayCard() {
  return (
    <Panel title="Play" subtitle="Jogos de ritmo e de ouvido." labelledBy="play" className="h-full">
      <div className="flex flex-1 items-end">
        <SoonTag />
      </div>
    </Panel>
  );
}

/* ============ Desafio de afinação ============ */

/** A isca do funil (CLAUDE.md, seção 14): brincar primeiro, treinar depois. */
export function TuningChallengeCard() {
  return (
    <Panel title="Descubra se você é afinado" subtitle="Ouça uma nota e cante de volta. Menos de um minuto." labelledBy="desafio" glow className="h-full">
      <div className="flex flex-1 flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <TuningMark />
        <PrimaryButton to="/desafio">Jogar agora</PrimaryButton>
      </div>
    </Panel>
  );
}

/** Nota-alvo e a voz chegando nela — a mesma linguagem da tela do desafio. */
function TuningMark() {
  return (
    <svg width="220" height="56" viewBox="0 0 220 56" fill="none" aria-hidden>
      <line x1="0" x2="220" y1="28" y2="28" stroke="rgba(184,149,90,0.35)" strokeWidth="1" />
      <path d="M4 48C40 46 60 20 96 34s50-6 76-6h44" stroke={C.gold} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.8" />
      <circle cx="210" cy="28" r="5" fill={C.gold} />
    </svg>
  );
}

/* ============ Evolução — uso do app ============ */

export function UsagePanel({ usage, days }: { usage: Usage; days: number }) {
  return (
    <Panel title="Sua evolução" subtitle={`Últimos ${days} dias no app.`} labelledBy="evolucao" className="h-full">
      <div className="grid flex-1 grid-cols-3 gap-3">
        <Stat value={usage.songsCreated} unit="músicas criadas" />
        <Stat value={usage.repertoires} unit={usage.repertoires === 1 ? 'repertório montado' : 'repertórios montados'} />
        <Stat value={usage.trainings} unit={usage.trainings === 1 ? 'treino feito' : 'treinos feitos'} />
      </div>
    </Panel>
  );
}

function Stat({ value, unit }: { value: number | null; unit: string }) {
  return (
    <div className="flex flex-col justify-center pl-3" style={{ borderLeft: `1px solid ${C.rule}` }}>
      <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 44, color: value === null ? C.paper3 : C.paper, lineHeight: 0.95 }}>
        {value ?? '—'}
      </span>
      <span className="mt-1" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.3 }}>{unit}</span>
      {value === null && <span className="mt-0.5" style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>em breve</span>}
    </div>
  );
}

/* ============ Saúde vocal + dica da Laury ============ */

// TODO(Laury): texto provisório, reaproveitado da dica do aquecimento
// (hoje em src/lib/diario/sessions.ts). O texto final e a rotação de
// dicas vêm dela — não inventar conteúdo clínico.
export const LAURY_TIP = 'Inspire pelo nariz, expire com controle. Sinta o ar sustentando o som.';

// Mesmos ids de src/routes/_app.saude.index.tsx (lá não são exportados).
export const HEALTH = [
  { id: 'agudos', title: 'Agudos', desc: 'Leveza no alto', glyph: 'up' },
  { id: 'graves', title: 'Graves', desc: 'Corpo e apoio', glyph: 'down' },
  { id: 'desaquecimento', title: 'Pós-show', desc: 'Desaquecer', glyph: 'rest' },
  { id: 'gravacao', title: 'Gravação', desc: 'Clareza total', glyph: 'mic' },
  { id: 'diccao', title: 'Dicção', desc: 'Articulação', glyph: 'text' },
] as const;

export function HealthShortcuts() {
  return (
    <Panel
      title="Saúde vocal"
      subtitle="Aquecimentos para o que sua voz pede hoje."
      action={{ to: '/saude', label: 'Ver todos' }}
      labelledBy="saude"
      className="h-full"
    >
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {HEALTH.map((h) => (
          <li key={h.id} className="min-h-0">
            <Link
              to="/saude/$warmupId"
              params={{ warmupId: h.id }}
              className={`group flex h-full flex-col justify-start gap-3 rounded-[6px] p-3.5 transition-colors hover:border-[rgba(184,149,90,0.4)] hover:bg-[rgba(184,149,90,0.05)] ${focusRing}`}
              style={{ border: `1px solid ${C.rule}`, background: 'rgba(255,255,255,0.015)' }}
            >
              <Glyph kind={h.glyph} />
              <span>
                <span className="block" style={{ fontFamily: SERIF, fontSize: 19, color: C.paper, lineHeight: 1.1 }}>{h.title}</span>
                <span className="mt-0.5 block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.35 }}>{h.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Dica da Laury dentro do card (reunião de 25/09/2026). Sem foto: não há foto real dela. */}
      <figure className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.rule}` }}>
        <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 19, color: C.paper, lineHeight: 1.35 }}>
          “{LAURY_TIP}”
        </blockquote>
        <figcaption className="mt-1.5" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>
          Laury · fonoaudióloga, voz artística
        </figcaption>
      </figure>
      <p className="mt-3" style={{ fontFamily: SANS, fontSize: 12, color: C.paper2, lineHeight: 1.45 }}>
        Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.
      </p>
    </Panel>
  );
}

/** Marcas desenhadas à mão, do universo musical — não ícones de biblioteca. */
export function Glyph({ kind }: { kind: (typeof HEALTH)[number]['glyph'] }) {
  const s = { stroke: C.gold, strokeWidth: 1.3, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden>
      {kind === 'up' && (
        <>
          {[20, 15, 10, 5].map((y, i) => <line key={y} x1={4 + i * 3} x2={12 + i * 3} y1={y} y2={y} {...s} strokeOpacity={0.35 + i * 0.2} />)}
          <path d="M24 20V4m-3.5 3.5L24 4l3.5 3.5" {...s} />
        </>
      )}
      {kind === 'down' && (
        <>
          {[4, 9, 14, 19].map((y, i) => <line key={y} x1={4 + i * 3} x2={12 + i * 3} y1={y} y2={y} {...s} strokeOpacity={0.35 + i * 0.2} />)}
          <path d="M24 4v16m-3.5-3.5L24 20l3.5-3.5" {...s} />
        </>
      )}
      {kind === 'rest' && <path d="M2 8c4 0 4 8 8 8s4-6 8-6 4 4 8 4" {...s} />}
      {kind === 'mic' && (
        <>
          <rect x="11" y="2" width="8" height="13" rx="4" {...s} />
          <path d="M8 11a7 7 0 0 0 14 0M15 18v4" {...s} />
        </>
      )}
      {kind === 'text' && (
        <text x="3" y="19" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, fill: C.gold }}>Aa</text>
      )}
    </svg>
  );
}
