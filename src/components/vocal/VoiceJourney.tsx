import { NoteLadder, type MidiRange } from '@/components/vocal/NoteLadder';
import { C, SANS } from '@/components/home/primitives';

/**
 * Escada de notas com as três etapas do teste marcadas nela:
 * 1 no meio (confortável), 2 embaixo (grave), 3 em cima (aguda).
 * Com perfil, as marcas ficam nas notas medidas; sem perfil, em posições ilustrativas.
 */

export interface JourneyNotes {
  comfort: number;
  low: number;
  high: number;
}

const MIN = 36; // C2
const MAX = 84; // C6
const EXAMPLE: JourneyNotes = { comfort: 57, low: 45, high: 74 };

export function LadderSteps({
  notes,
  range,
  highlight,
  labels,
}: {
  notes?: JourneyNotes | null;
  range?: MidiRange | null;
  highlight?: MidiRange | null;
  labels?: { comfort?: string; low?: string; high?: string };
}) {
  const n = notes ?? EXAMPLE;
  const pct = (m: number) => `${(1 - (m - MIN) / (MAX - MIN)) * 100}%`;
  const marks = [
    { key: 'high' as const, step: 3, midi: n.high, text: 'aguda' },
    { key: 'comfort' as const, step: 1, midi: n.comfort, text: 'confortável' },
    { key: 'low' as const, step: 2, midi: n.low, text: 'grave' },
  ];

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-y-0 left-0 w-[92px]">
        <NoteLadder min={MIN} max={MAX} range={range} highlight={highlight} ariaLabel="Escada de notas, de C2 a C6" />
      </div>

      {marks.map((m) => (
        <div
          key={m.key}
          className="absolute left-[64px] right-0 flex -translate-y-1/2 items-center gap-2"
          style={{ top: pct(m.midi) }}
        >
          <span className="h-[2px] w-[34px] shrink-0" style={{ background: C.paper, boxShadow: '0 0 10px 2px rgba(232,228,220,0.35)' }} />
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.gold}`, background: C.ink, color: C.gold, fontFamily: SANS, fontSize: 11 }}
          >
            {m.step}
          </span>
          <span className="truncate" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
            {m.text}
            {labels?.[m.key] && <span style={{ color: C.gold }}> · {labels[m.key]}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
