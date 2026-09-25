import { C, SERIF } from './primitives';

/*
 * O que sobrou da Home escura depois do redesenho de 25/09/2026 (a Home nova está em
 * `components/home/claro/`): dados e desenhos que a aba Voz e a Saúde vocal ainda usam.
 */

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
