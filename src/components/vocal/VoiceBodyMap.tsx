import { C, SANS, SERIF } from '@/components/home/primitives';

/**
 * A voz como instrumento no corpo: silhueta em linha fina, regiões de ressonância em luz
 * dourada e o caminho do ar subindo do peito até a boca.
 * Orientação visual — não mede ressonância (ver CLAUDE.md, seção 4).
 *
 * `active` destaca regiões (o resto apaga em ~400ms). Sem `active`, todas acesas.
 * `breathing` faz o tórax expandir e recolher devagar (exercícios de respiração).
 *
 * TODO(Laury): validar os textos das regiões antes de qualquer usuário real.
 */

export type BodyRegion = 'cabeca' | 'rosto' | 'garganta' | 'peito' | 'cavidades' | 'laringe' | 'traqueia' | 'diafragma';

type RegionDef = { id: BodyRegion; label: string; note: string; cx: number; cy: number; r: number; side: 'left' | 'right'; ty: number };

/** Onde a voz ressoa (treino, teste vocal). */
const RESSONANCIA: RegionDef[] = [
  { id: 'cabeca', label: 'Cabeça', note: 'agudos leves', cx: 150, cy: 58, r: 34, side: 'right', ty: 48 },
  { id: 'rosto', label: 'Rosto', note: 'brilho e articulação', cx: 150, cy: 104, r: 26, side: 'left', ty: 104 },
  { id: 'garganta', label: 'Garganta', note: 'passagem da voz', cx: 150, cy: 168, r: 16, side: 'right', ty: 170 },
  { id: 'peito', label: 'Peito', note: 'graves e apoio do ar', cx: 150, cy: 262, r: 52, side: 'left', ty: 262 },
];

/** Como a voz é produzida (saúde vocal): ar sobe do diafragma, passa pela traqueia, vira som na laringe e ganha corpo nas cavidades. */
const PRODUCAO: RegionDef[] = [
  { id: 'cavidades', label: 'Cavidades', note: 'ressonância: cabeça e rosto', cx: 150, cy: 84, r: 40, side: 'right', ty: 70 },
  { id: 'laringe', label: 'Laringe', note: 'onde o som nasce', cx: 150, cy: 150, r: 15, side: 'left', ty: 150 },
  { id: 'traqueia', label: 'Traqueia', note: 'passagem do ar', cx: 150, cy: 204, r: 14, side: 'right', ty: 210 },
  { id: 'diafragma', label: 'Diafragma', note: 'sustenta o ar', cx: 150, cy: 318, r: 46, side: 'left', ty: 312 },
];

export function VoiceBodyMap({
  className = '',
  active,
  breathing = false,
  showLabels = true,
  set = 'ressonancia',
}: {
  className?: string;
  active?: BodyRegion[];
  breathing?: boolean;
  showLabels?: boolean;
  set?: 'ressonancia' | 'producao';
}) {
  const REGIONS = set === 'producao' ? PRODUCAO : RESSONANCIA;
  const isOn = (id: BodyRegion) => !active || active.length === 0 || active.includes(id);
  const label = active && active.length
    ? `Silhueta de um cantor com destaque em: ${REGIONS.filter((r) => active.includes(r.id)).map((r) => r.label.toLowerCase()).join(', ')}`
    : `Silhueta de um cantor com as regiões: ${REGIONS.map((r) => r.label.toLowerCase()).join(', ')}`;

  return (
    <svg viewBox="-40 0 380 380" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="vbm-glow">
          <stop offset="0%" stopColor="#D9B77A" stopOpacity="0.6" />
          <stop offset="45%" stopColor="#B8955A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#B8955A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vbm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.paper} stopOpacity="0.5" />
          <stop offset="78%" stopColor={C.paper} stopOpacity="0.32" />
          <stop offset="100%" stopColor={C.paper} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vbm-breath" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0" />
          <stop offset="40%" stopColor={C.gold} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E3C48B" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* luz das regiões */}
      {REGIONS.map((r) => (
        <circle
          key={r.id}
          cx={r.cx}
          cy={r.cy}
          r={r.r * 1.6}
          fill="url(#vbm-glow)"
          className={isOn(r.id) ? 'vbm-breathe' : undefined}
          style={{ opacity: isOn(r.id) ? 1 : 0.08, transition: 'opacity var(--dur-context, 420ms) ease' }}
        />
      ))}

      {/* silhueta */}
      <g fill="none" stroke="url(#vbm-fade)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 20c-24 0-40 19-40 44 0 17 6 31 14 41 6 8 11 15 13 23h26c2-8 7-15 13-23 8-10 14-24 14-41 0-25-16-44-40-44z" />
        <path d="M137 128c0 14-2 26-6 34M163 128c0 14 2 26 6 34" />
        <g className={breathing ? 'vbm-chest' : undefined}>
          <path d="M131 162c-22 8-52 12-72 26-14 10-20 30-22 58-2 34-2 76 0 130" />
          <path d="M169 162c22 8 52 12 72 26 14 10 20 30 22 58 2 34 2 76 0 130" />
          <path d="M150 180c-16 4-34 4-52 0M150 180c16 4 34 4 52 0" strokeOpacity="0.5" />
          <path d="M112 236c24 14 52 14 76 0M106 268c28 16 60 16 88 0M104 300c30 16 62 16 92 0" strokeOpacity="0.35" />
        </g>
      </g>

      {/* caminho do ar: do peito até a boca */}
      <path
        d="M150 330C146 300 154 270 150 240S146 190 150 168 152 132 150 116"
        fill="none"
        stroke="url(#vbm-breath)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="3 7"
        className="vbm-flow"
      />
      <circle cx="150" cy="116" r="2.6" fill="#E3C48B" />

      {showLabels &&
        REGIONS.map((r) => {
          const x2 = r.side === 'right' ? 238 : 62;
          const tx = r.side === 'right' ? 244 : 56;
          const anchor = r.side === 'right' ? 'start' : 'end';
          const on = isOn(r.id);
          return (
            <g key={`l-${r.id}`} style={{ opacity: on ? 1 : 0.3, transition: 'opacity var(--dur-context, 420ms) ease' }}>
              <circle cx={r.cx} cy={r.cy} r="2.4" fill={C.gold} />
              <path d={`M${r.cx} ${r.cy} L${(r.cx + x2) / 2} ${r.ty} L${x2} ${r.ty}`} fill="none" stroke={C.gold} strokeOpacity="0.45" strokeWidth="0.8" />
              <text x={tx} y={r.ty - 2} textAnchor={anchor} style={{ fontFamily: SERIF, fontSize: 15, fill: C.paper }}>{r.label}</text>
              <text x={tx} y={r.ty + 12} textAnchor={anchor} style={{ fontFamily: SANS, fontSize: 9.5, fill: 'rgba(232,228,220,0.55)' }}>{r.note}</text>
            </g>
          );
        })}

      <style>{`
        .vbm-breathe { animation: vbm-breathe 5s ease-in-out infinite; }
        .vbm-flow { animation: vbm-flow 3.2s linear infinite; }
        .vbm-chest { animation: vbm-chest 8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0%; }
        @keyframes vbm-breathe { 0%,100% { filter: brightness(.85) } 50% { filter: brightness(1.1) } }
        @keyframes vbm-flow { to { stroke-dashoffset: -40 } }
        @keyframes vbm-chest { 0%,100% { transform: scale(1, 1) } 45% { transform: scale(1.035, 1.02) } }
        @media (prefers-reduced-motion: reduce) { .vbm-breathe, .vbm-flow, .vbm-chest { animation: none } }
      `}</style>
    </svg>
  );
}

/** Região provável a partir do texto de um exercício — só para orientar o desenho. */
export function regionsFor(text: string): BodyRegion[] {
  const t = text.toLowerCase();
  const out = new Set<BodyRegion>();
  if (/lábio|labio|língua|lingua|boca|palato|vogais|consoante|trava|pá|tá|dicção|diccao|articula|nasal|ng\b|humming|mmm/.test(t)) out.add('rosto');
  if (/agud|sirene|glissando|cabeça|cabeca/.test(t)) out.add('cabeca');
  if (/grave|peito|fry|\bb\b|b-b|diafragma|respira|inspire|expire|suspiro|sss|zzz|ar\b/.test(t)) out.add('peito');
  if (/pescoço|pescoco|laring|garganta|bocejo/.test(t)) out.add('garganta');
  return [...out];
}
