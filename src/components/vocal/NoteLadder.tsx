import { midiToNote } from '@/lib/audio/pitch';

/**
 * Escada vertical de notas — um traço por semitom, grave embaixo, agudo em cima.
 * Único elemento que atravessou todas as rodadas de design sem rejeição
 * (docs/DESIGN.md). Usado no teste de extensão e na Home.
 */

export interface MidiRange {
  low: number;
  high: number;
}

interface NoteLadderProps {
  /** Extensão do usuário, em MIDI. Pinta os traços dentro da faixa. */
  range?: MidiRange | null;
  /** Faixa em destaque dentro da extensão (ex.: região confortável). */
  highlight?: MidiRange | null;
  /** Nota cantada ao vivo, em MIDI. */
  live?: number | null;
  /** Dica de direção durante o teste. */
  targetHint?: 'low' | 'high' | null;
  /** Sem perfil: escada inteira apagada. */
  dimmed?: boolean;
  /** Limites da escada, em MIDI. Padrão C2–C6. */
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const GOLD = '#B8955A';
const PAPER = '#E8E4DC';
const BLACK_KEYS = [1, 3, 6, 8, 10];

const noteLabel = (m: number) => {
  const n = midiToNote(m);
  return `${n.name}${n.octave}`;
};

export function NoteLadder({
  range,
  highlight,
  live,
  targetHint,
  dimmed = false,
  min = 36,
  max = 84,
  className,
  style,
  ariaLabel,
}: NoteLadderProps) {
  const span = max - min;
  const pos = (m: number) => `${(1 - (m - min) / span) * 100}%`;
  const within = (r: MidiRange | null | undefined, m: number) =>
    !!r && m >= Math.round(r.low) && m <= Math.round(r.high);

  const band = highlight ?? range;

  const ticks = [];
  for (let m = min; m <= max; m++) {
    const pc = ((m % 12) + 12) % 12;
    const isC = pc === 0;
    const isNatural = !BLACK_KEYS.includes(pc);
    const inHighlight = !dimmed && within(highlight, m);
    const inRange = !dimmed && within(range, m);

    const tickColor = inHighlight
      ? GOLD
      : inRange
        ? highlight ? 'rgba(184,149,90,0.6)' : GOLD
        : dimmed ? 'rgba(232,228,220,0.07)' : 'rgba(232,228,220,0.14)';
    const labelColor = inHighlight || (inRange && !highlight)
      ? GOLD
      : inRange
        ? 'rgba(184,149,90,0.6)'
        : dimmed ? 'rgba(232,228,220,0.12)' : 'rgba(232,228,220,0.22)';

    ticks.push(
      <div
        key={m}
        className="absolute right-0 flex w-full items-center justify-end gap-2 pointer-events-none"
        style={{ top: pos(m), transform: 'translateY(-50%)' }}
      >
        {isC && (
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              letterSpacing: '0.08em',
              color: labelColor,
              transition: 'color .3s',
            }}
          >
            {noteLabel(m)}
          </span>
        )}
        <div
          style={{
            width: isC ? 34 : isNatural ? 20 : 11,
            height: 1,
            background: tickColor,
            transition: 'background .3s',
          }}
        />
      </div>,
    );
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ position: 'relative', height: '100%', width: '100%', ...style }}
    >
      {band && !dimmed && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            width: 34,
            top: pos(band.high),
            height: `${((band.high - band.low) / span) * 100}%`,
            background: 'rgba(184,149,90,0.16)',
            borderRight: `2px solid ${GOLD}`,
            transition: 'top .3s ease, height .3s ease',
          }}
        />
      )}

      {ticks}

      {live != null && (
        <div
          style={{
            position: 'absolute',
            right: -4,
            top: pos(live),
            transform: 'translateY(-50%)',
            width: 42,
            height: 2,
            background: PAPER,
            boxShadow: '0 0 14px 3px rgba(232,228,220,0.45)',
            transition: 'top .06s linear',
          }}
        />
      )}

      {targetHint && (
        <div
          style={{
            position: 'absolute',
            right: 46,
            top: targetHint === 'low' ? '86%' : '10%',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: 'rgba(232,228,220,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {targetHint === 'low' ? 'desça até aqui' : 'suba até aqui'}
        </div>
      )}
    </div>
  );
}
