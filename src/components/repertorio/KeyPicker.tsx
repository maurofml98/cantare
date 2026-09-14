import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { normalizeKey } from '@/lib/music/keys';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Grade de 24 tons (maior em cima, menor embaixo). Um toque escolhe o tom.
 * Não abre teclado. Setas navegam entre as teclas.
 */
export function KeyGrid({ value, onChange, compact = false }: { value: string; onChange: (key: string) => void; compact?: boolean }) {
  const current = value ? normalizeKey(value) : '';
  const rows = [
    { label: 'Maior', suffix: '' },
    { label: 'Menor', suffix: 'm' },
  ];

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-key]'));
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 12, ArrowUp: -12 };
    if (map[e.key] !== undefined) {
      e.preventDefault();
      btns[(i + map[e.key] + btns.length) % btns.length]?.focus();
    }
  };

  return (
    <div role="group" aria-label="Escolher tom" onKeyDown={onKeyDown} className="w-full overflow-x-auto">
      <div className="grid min-w-[520px] items-center gap-1" style={{ gridTemplateColumns: `52px repeat(12, minmax(0, 1fr))` }}>
        <span />
        {NOTES.map((n) => (
          <span key={n} className="text-center" style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>{n}</span>
        ))}
        {rows.map((r) => (
          <FragmentRow key={r.label}>
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{r.label}</span>
            {NOTES.map((n) => {
              const key = `${n}${r.suffix}`;
              const selected = current === key;
              return (
                <button
                  key={key}
                  data-key
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Tom ${n}${r.suffix ? ' menor' : ' maior'}`}
                  onClick={() => onChange(key)}
                  className={`rounded-[6px] transition-[background-color,border-color,color,transform] duration-[var(--dur-hover)] hover:border-[rgba(184,149,90,0.55)] hover:text-[#E8E4DC] active:scale-95 ${compact ? 'h-9' : 'h-10'} ${focusRing}`}
                  style={{
                    fontFamily: SERIF,
                    fontSize: compact ? 15 : 16,
                    border: `1px solid ${selected ? C.gold : 'rgba(232,228,220,0.1)'}`,
                    background: selected ? C.gold : 'rgba(232,228,220,0.025)',
                    color: selected ? C.ink : 'rgba(232,228,220,0.8)',
                  }}
                >
                  {key}
                </button>
              );
            })}
          </FragmentRow>
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Chip de tom na linha da música. Sem tom = pendência visível ("Definir tom"). */
export function KeyChip({ value, onChange, songTitle, size = 'md' }: { value: string; onChange: (key: string) => void; songTitle: string; size?: 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  const has = !!value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={has ? `Tom de ${songTitle}: ${value}. Alterar` : `Definir tom de ${songTitle}`}
          className={`inline-flex shrink-0 items-center justify-center rounded-[6px] transition-[background-color,border-color,transform] duration-[var(--dur-hover)] active:scale-95 ${focusRing} ${
            has
              ? `${size === 'lg' ? 'h-11 min-w-[56px] text-[22px]' : 'h-8 min-w-[44px] text-[18px]'} px-2 hover:border-[rgba(184,149,90,0.8)]`
              : 'h-8 px-2.5 text-[12px] hover:bg-[rgba(210,164,94,0.14)]'
          }`}
          style={
            has
              ? { fontFamily: SERIF, color: C.gold, border: '1px solid rgba(184,149,90,0.35)', background: 'rgba(184,149,90,0.07)' }
              : { fontFamily: SANS, color: '#D2A45E', border: '1px dashed rgba(210,164,94,0.6)' }
          }
        >
          {has ? value : 'Definir tom'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[600px] max-w-[92vw] border-white/10 bg-[#111318] p-4">
        <p className="mb-3" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
          Tom em que você canta <span style={{ color: C.paper }}>{songTitle}</span>
        </p>
        <KeyGrid
          compact
          value={value}
          onChange={(k) => {
            onChange(k);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
