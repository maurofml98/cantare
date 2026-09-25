import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { normalizeKey } from '@/lib/music/keys';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Grade de 24 tons (maior em cima, menor embaixo). Um toque escolhe o tom.
 * Não abre teclado. Setas navegam entre as teclas. Cores por token (claro e escuro).
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

  const keyButton = (n: string, suffix: string) => {
    const key = `${n}${suffix}`;
    const selected = current === key;
    return (
      <button
        key={key}
        data-key
        type="button"
        aria-pressed={selected}
        aria-label={`Tom ${n}${suffix ? ' menor' : ' maior'}`}
        onClick={() => onChange(key)}
        className={`rounded-[8px] border text-[15px] font-semibold outline-none transition-[background-color,border-color,color,transform] duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'h-10 sm:h-9' : 'h-11 sm:h-10'} ${
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-foreground/[0.03] text-foreground/85 hover:border-primary/60'
        }`}
      >
        {key}
      </button>
    );
  };

  return (
    <>
    {/* celular: 6 colunas, sem rolar para o lado */}
    <div role="group" aria-label="Escolher tom" onKeyDown={onKeyDown} className="flex w-full flex-col gap-3 sm:hidden">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="mb-1 text-[12px] font-semibold text-muted-foreground">{r.label}</p>
          <div className="grid grid-cols-6 gap-1">{NOTES.map((n) => keyButton(n, r.suffix))}</div>
        </div>
      ))}
    </div>
    <div role="group" aria-label="Escolher tom" onKeyDown={onKeyDown} className="hidden w-full overflow-x-auto sm:block">
      <div className="grid min-w-[520px] items-center gap-1" style={{ gridTemplateColumns: `52px repeat(12, minmax(0, 1fr))` }}>
        <span />
        {NOTES.map((n) => (
          <span key={n} className="text-center text-[11px] text-muted-foreground">{n}</span>
        ))}
        {rows.map((r) => (
          <FragmentRow key={r.label}>
            <span className="text-[12px] text-muted-foreground">{r.label}</span>
            {NOTES.map((n) => keyButton(n, r.suffix))}
          </FragmentRow>
        ))}
      </div>
    </div>
    </>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Tom na linha da música — sempre visível, nunca escondido em menu. Definido = uma cor só
 * (azul-claro, sem arco-íris). Sem tom = pendência âmbar "Definir tom", não "-" ou "?".
 * Usa os tokens `--c-*` do tema novo (Repertório).
 */
export function KeyChip({ value, onChange, songTitle, size = 'md' }: { value: string; onChange: (key: string) => void; songTitle: string; size?: 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  const has = !!value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={has ? `Tom de ${songTitle}: ${value}. Alterar` : `Definir tom de ${songTitle}`}
          className={`c-press c-focus inline-flex shrink-0 items-center justify-center rounded-[8px] font-extrabold transition-[filter] duration-150 hover:brightness-95 ${
            has ? (size === 'lg' ? 'h-11 min-w-[56px] px-2 text-[20px]' : 'h-8 min-w-[44px] px-2 text-[15px]') : 'h-8 whitespace-nowrap px-2.5 text-[13px]'
          }`}
          style={
            has
              ? { background: 'var(--c-key-bg)', color: 'var(--c-key-ink)' }
              : { background: 'var(--c-pending-bg)', color: 'var(--c-pending-ink)', boxShadow: 'inset 0 0 0 1px var(--c-pending-line)' }
          }
        >
          {has ? value : 'Definir tom'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[600px] max-w-[92vw] border-border bg-popover p-4">
        <p className="mb-3 text-[14px] text-muted-foreground">
          Tom em que você canta <span className="font-bold text-foreground">{songTitle}</span>
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
