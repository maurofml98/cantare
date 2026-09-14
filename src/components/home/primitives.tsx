import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Valores locais do sistema visual, espelhando a paleta de docs/DESIGN.md (não são tokens globais). */
export const C = {
  gold: '#B8955A',
  goldSoft: 'rgba(184,149,90,0.14)',
  paper: '#E8E4DC',
  paper2: 'rgba(232,228,220,0.72)',
  paper3: 'rgba(232,228,220,0.5)',
  rule: 'rgba(232,228,220,0.08)',
  surface: '#0D0F12',
  ink: '#07080A',
  warn: '#C87F6A',
} as const;

export const SERIF = "'Newsreader', serif";
export const SANS = "'DM Sans', sans-serif";

/** Contagem e placar sempre com algarismos alinhados, qualquer que seja a serifada. */
export const LINING: React.CSSProperties = { fontVariantNumeric: 'lining-nums' };

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B8955A]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080A]';

/**
 * Painel base do sistema: superfície escura, borda fina, cabeçalho editorial.
 * `glow` acende uma luz quente de estúdio no canto — usar só no painel principal da tela.
 */
export function Panel({
  title,
  subtitle,
  action,
  glow = false,
  className = '',
  bodyClassName = '',
  children,
  labelledBy,
}: {
  title?: string;
  subtitle?: string;
  action?: { to: string; label: string };
  glow?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={title ? labelledBy : undefined}
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-[8px] ${className}`}
      style={{
        background: glow
          ? 'radial-gradient(120% 90% at 0% 0%, rgba(184,149,90,0.10) 0%, rgba(184,149,90,0) 55%), linear-gradient(180deg, #101216 0%, #0B0C0F 100%)'
          : 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)',
        border: `1px solid ${glow ? 'rgba(184,149,90,0.22)' : C.rule}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {title && (
        <header className="flex items-start justify-between gap-4 px-5 pt-4 2xl:px-6 2xl:pt-5">
          <div className="min-w-0">
            <h2 id={labelledBy} style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.1 }}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 truncate" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <TextLink to={action.to}>{action.label}</TextLink>}
        </header>
      )}
      <div className={`relative flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3 2xl:px-6 2xl:pb-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.1 }}>{title}</h2>
      {link && <TextLink to={link.to}>{link.label}</TextLink>}
    </div>
  );
}

export function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`mt-1 shrink-0 rounded-sm underline-offset-4 hover:underline ${FOCUS}`}
      style={{ fontFamily: SANS, fontSize: 13, color: C.gold }}
    >
      {children}
    </Link>
  );
}

/** Botão principal (navegação): mesmo componente visual de <Button variant="primary">. Um por tela. */
export function PrimaryButton({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full shrink-0 sm:w-auto', className)}>
      {children}
    </Link>
  );
}

/** Ação secundária (navegação): contorno dourado. */
export function SecondaryButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className={buttonVariants({ variant: 'secondary', size: 'md' })}>
      {children}
    </Link>
  );
}

export const focusRing = FOCUS;

/**
 * Controle segmentado (radiogroup): escolha única entre poucas opções, como período ou métrica.
 * Setas do teclado mudam a opção; o indicador desliza.
 */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  size = 'md',
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const move = (dir: 1 | -1) => onChange(options[(idx + dir + options.length) % options.length].value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative inline-grid rounded-[8px] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, background: 'rgba(232,228,220,0.04)', border: `1px solid ${C.rule}` }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      }}
    >
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-[6px] transition-transform duration-[var(--dur-state)] ease-[var(--ease-out)]"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: 4,
          transform: `translateX(${idx * 100}%)`,
          background: 'rgba(184,149,90,0.16)',
          border: '1px solid rgba(184,149,90,0.45)',
        }}
      />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`relative z-10 whitespace-nowrap rounded-[6px] outline-none transition-colors duration-[var(--dur-hover)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B8955A]/70 ${size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-[14px]'} ${selected ? 'text-[#E8E4DC]' : 'text-[rgba(232,228,220,0.55)] hover:text-[rgba(232,228,220,0.85)]'}`}
            style={{ fontFamily: SANS }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

