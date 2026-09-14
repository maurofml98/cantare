import { Link } from '@tanstack/react-router';
import type { RepertoireProject } from '@/lib/types';
import type { WeekSummary } from '@/lib/home/today';
import { C, Panel, SANS, SecondaryButton, SERIF, TextLink, focusRing } from './primitives';

/* ============ Repertório ============ */

export function WeekRepertoire({ project }: { project: RepertoireProject | null }) {
  if (!project) {
    return (
      <Panel title="Repertório" subtitle="Seus shows organizados por projeto." labelledBy="repertorio" className="h-full">
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
    <Panel title="Repertório" subtitle="O projeto em que você mexeu por último." labelledBy="repertorio" className="h-full">
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

/* ============ Dica da Laury ============ */

// TODO(Laury): texto provisório, reaproveitado da dica do aquecimento
// (src/components/diario/WarmupInstrumentHUD.tsx). O texto final e a rotação de
// dicas vêm dela — não inventar conteúdo clínico.
export const LAURY_TIP = 'Inspire pelo nariz, expire com controle. Sinta o ar sustentando o som.';
const TIP = LAURY_TIP;

// TODO(asset): foto da Laury em src/assets/laury.jpg (retrato, fundo escuro, mín. 320×320).
// Enquanto não existir, o retrato mostra a inicial.
const LAURY_PHOTO: string | null = null;

export function LauryTip() {
  return (
    <Panel title="Dica da Laury" subtitle="Cuidado real para a sua voz." labelledBy="dica-laury" className="h-full">
      <div className="flex flex-1 gap-5">
        <div className="min-w-0 flex-1">
          <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: C.paper, lineHeight: 1.35 }}>
            “{TIP}”
          </blockquote>
          <p className="mt-3" style={{ fontFamily: SERIF, fontSize: 17, color: C.paper }}>Laury</p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Fonoaudióloga · voz artística</p>
        </div>
        <Portrait />
      </div>
      <p
        className="mt-3 rounded-[6px] px-4 py-2.5"
        style={{ background: 'rgba(184,149,90,0.06)', border: `1px solid rgba(184,149,90,0.16)`, fontFamily: SANS, fontSize: 12, color: C.paper2, lineHeight: 1.45 }}
      >
        Sentiu dor, rouquidão ou desconforto? Pare e procure um profissional.
      </p>
    </Panel>
  );
}

function Portrait() {
  return (
    <div
      className="hidden h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-full sm:flex"
      style={{
        border: `1px solid ${C.gold}`,
        boxShadow: '0 0 0 5px rgba(184,149,90,0.08)',
        background: 'radial-gradient(circle at 40% 30%, #1B1C20 0%, #0B0C0F 100%)',
      }}
    >
      {LAURY_PHOTO ? (
        <img src={LAURY_PHOTO} alt="Laury, fonoaudióloga" className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 42, color: C.gold }}>L</span>
      )}
    </div>
  );
}

/* ============ Evolução ============ */

export function EvolutionPanel({ streak, week }: { streak: number; week: WeekSummary }) {
  return (
    <Panel
      title="Evolução"
      subtitle="Sua constância gera resultado."
      action={{ to: '/diario/evolucao', label: 'Ver evolução' }}
      labelledBy="evolucao"
      className="h-full"
    >
      <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <WeekChart week={week} />
        <Stat
          value={streak > 0 ? String(streak) : '0'}
          unit={streak === 1 ? 'dia seguido' : 'dias seguidos'}
          note={streak > 0 ? 'Não quebre a sequência hoje.' : 'Complete o treino de hoje para começar.'}
        />
        <Stat
          value={week.accuracy !== null ? `${week.accuracy}` : '—'}
          suffix={week.accuracy !== null ? '%' : undefined}
          unit="precisão média"
          note={
            week.exercises > 0
              ? `${week.exercises} ${week.exercises === 1 ? 'exercício' : 'exercícios'} nesta semana`
              : 'Aparece após o primeiro exercício cantado.'
          }
          divider
        />
      </div>
    </Panel>
  );
}

function WeekChart({ week }: { week: WeekSummary }) {
  const W = 300;
  const H = 90;
  const x = (i: number) => 10 + (i * (W - 20)) / 6;
  const y = (acc: number) => H - 8 - (acc / 100) * (H - 20);
  const pts = week.days.map((d, i) => (d.accuracy !== null ? `${x(i)},${y(d.accuracy)}` : null)).filter(Boolean);
  const hasData = pts.length > 0;

  return (
    <div className="flex min-w-0 flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[80px] w-full 2xl:h-full 2xl:max-h-[110px]" preserveAspectRatio="none" aria-hidden>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(232,228,220,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {pts.length > 1 && (
          <polyline points={pts.join(' ')} fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        )}
        {week.days.map((d, i) =>
          d.accuracy !== null ? (
            <circle key={i} cx={x(i)} cy={y(d.accuracy)} r="3.2" fill={C.gold} vectorEffect="non-scaling-stroke" />
          ) : (
            <line key={i} x1={x(i) - 4} x2={x(i) + 4} y1={H - 8} y2={H - 8} stroke={d.isFuture ? 'rgba(232,228,220,0.08)' : 'rgba(232,228,220,0.22)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ),
        )}
      </svg>
      <div className="mt-1 flex justify-between px-[2px]">
        {week.days.map((d) => (
          <span key={d.label} style={{ fontFamily: SANS, fontSize: 11, color: d.isToday ? C.gold : C.paper3 }}>{d.label}</span>
        ))}
      </div>
      {!hasData && (
        <p className="mt-1" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Sua semana começa no primeiro exercício.</p>
      )}
    </div>
  );
}

function Stat({ value, suffix, unit, note, divider = false }: { value: string; suffix?: string; unit: string; note: string; divider?: boolean }) {
  return (
    <div className={`flex flex-col justify-center sm:pl-5 ${divider ? '' : ''}`} style={{ borderLeft: `1px solid ${C.rule}` }}>
      <p className="flex items-baseline gap-2">
        <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 52, color: C.paper, lineHeight: 0.95 }}>
          {value}
          {suffix && <span style={{ fontSize: 30, color: C.paper2 }}>{suffix}</span>}
        </span>
      </p>
      <p className="mt-1" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>{unit}</p>
      <p className="mt-1" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.4 }}>{note}</p>
    </div>
  );
}

/* ============ Saúde vocal ============ */

// Mesmos ids de src/routes/_app.saude.index.tsx (lá não são exportados).
const HEALTH = [
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
      <ul className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-5">
        {HEALTH.map((h) => (
          <li key={h.id} className="min-h-0">
            <Link
              to="/saude/$warmupId"
              params={{ warmupId: h.id }}
              className={`group flex h-full flex-col justify-start gap-3 rounded-[6px] p-3.5 2xl:justify-center transition-colors hover:border-[rgba(184,149,90,0.4)] hover:bg-[rgba(184,149,90,0.05)] ${focusRing}`}
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
    </Panel>
  );
}

/** Marcas desenhadas à mão, do universo musical — não ícones de biblioteca. */
function Glyph({ kind }: { kind: (typeof HEALTH)[number]['glyph'] }) {
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
