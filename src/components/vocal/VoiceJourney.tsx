import { NoteLadder, type MidiRange } from '@/components/vocal/NoteLadder';
import { C, SANS, SERIF } from '@/components/home/primitives';

/**
 * As três etapas do teste desenhadas sobre a escada de notas:
 * 1 no meio (confortável), 2 embaixo (grave), 3 em cima (aguda).
 * Uma linha fina desce do 1 ao 2 e sobe até o 3 — o caminho que a voz faz.
 */

export interface JourneyNotes {
  comfort: number;
  low: number;
  high: number;
}

interface Props {
  /** Posições reais do perfil (MIDI). Sem perfil, usa posições ilustrativas. */
  notes?: JourneyNotes | null;
  range?: MidiRange | null;
  highlight?: MidiRange | null;
  /** Nota medida em cada etapa, quando houver perfil. */
  labels?: { comfort?: string; low?: string; high?: string };
  height?: number;
}

const MIN = 36; // C2
const MAX = 84; // C6
const EXAMPLE: JourneyNotes = { comfort: 57, low: 43, high: 76 };

const LADDER_W = 72;
const LINE_X = LADDER_W + 14;
const TEXT_X = LADDER_W + 44;
const STEP_H = 92;

const STEPS = [
  { key: 'comfort', n: 1, title: 'Nota confortável', text: 'Um “aaah” sustentado, sem esforço.' },
  { key: 'low', n: 2, title: 'A mais grave', text: 'Desça devagar até onde a nota ainda se sustenta.' },
  { key: 'high', n: 3, title: 'A mais aguda', text: 'Suba até onde a voz ainda soa firme.' },
] as const;

export function VoiceJourney({ notes, range, highlight, labels, height = 400 }: Props) {
  const n = notes ?? EXAMPLE;
  const y = (m: number) => (1 - (m - MIN) / (MAX - MIN)) * height;

  const yHigh = y(n.high);
  const yComfort = y(n.comfort);
  const yLow = y(n.low);

  // Título de cada etapa na altura da nota; empurra só quando sobreporia ou sairia da área.
  const TITLE_Y = 14;
  const top = Math.max(0, yHigh - TITLE_Y);
  const mid = Math.min(Math.max(yComfort - TITLE_Y, top + STEP_H), height - STEP_H * 2);
  const bottom = Math.min(Math.max(yLow - TITLE_Y, mid + STEP_H), height - STEP_H);
  const textTop = { high: top, comfort: mid, low: bottom };
  const markerY = { high: yHigh, comfort: yComfort, low: yLow };

  const hasProfile = !!notes;

  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute left-0 top-0" style={{ width: LADDER_W, height }}>
        <NoteLadder min={MIN} max={MAX} range={range} highlight={highlight} ariaLabel="Escada de notas, do grave ao agudo" />
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {/* caminho: desce do 1 ao 2, sobe até o 3 */}
        <polyline
          points={`${LINE_X},${yComfort} ${LINE_X},${yLow} ${LINE_X + 8},${yLow} ${LINE_X + 8},${yHigh + 6}`}
          fill="none"
          stroke={C.gold}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <polyline
          points={`${LINE_X + 4},${yHigh + 10} ${LINE_X + 8},${yHigh + 4} ${LINE_X + 12},${yHigh + 10}`}
          fill="none"
          stroke={C.gold}
          strokeOpacity={0.8}
          strokeWidth={1}
        />
        {STEPS.map((s) => {
          const my = markerY[s.key];
          const ty = textTop[s.key] + TITLE_Y;
          return (
            <g key={s.key}>
              <line x1={LADDER_W - 34} x2={LADDER_W + 2} y1={my} y2={my} stroke={C.paper} strokeWidth={1.5} />
              <path
                d={`M ${LINE_X + 16} ${my} L ${TEXT_X - 14} ${my} L ${TEXT_X - 6} ${ty}`}
                fill="none"
                stroke={C.paper}
                strokeOpacity={0.18}
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>

      <ol className="absolute top-0 bottom-0 right-0" style={{ left: TEXT_X }}>
        {STEPS.map((s) => (
          <li key={s.key} className="absolute left-0 right-0" style={{ top: textTop[s.key], minHeight: STEP_H }}>
            <p className="flex items-baseline gap-2">
              <span style={{ fontFamily: SANS, fontSize: 13, color: C.gold }}>{s.n}</span>
              <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 22, color: C.paper, lineHeight: 1.15 }}>
                {s.title}
              </span>
              {hasProfile && labels?.[s.key] && (
                <span className="ml-auto" style={{ fontFamily: SERIF, fontSize: 18, color: C.gold }}>
                  {labels[s.key]}
                </span>
              )}
            </p>
            <p className="mt-1 pl-5" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3, lineHeight: 1.45 }}>
              {s.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
