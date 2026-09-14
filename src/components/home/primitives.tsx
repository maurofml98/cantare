import { Link } from '@tanstack/react-router';

/** Valores locais da Home, espelhando a paleta de docs/DESIGN.md (não são tokens globais). */
export const C = {
  gold: '#B8955A',
  paper: '#E8E4DC',
  paper2: 'rgba(232,228,220,0.62)',
  paper3: 'rgba(232,228,220,0.4)',
  rule: 'rgba(232,228,220,0.07)',
  surface: '#0D0F12',
  ink: '#07080A',
} as const;

export const SERIF = "'Newsreader', serif";

/** Contagem e placar sempre com algarismos alinhados, qualquer que seja a serifada. */
export const LINING: React.CSSProperties = { fontVariantNumeric: 'lining-nums' };
export const SANS = "'DM Sans', sans-serif";

export function SectionHeading({
  title,
  link,
}: {
  title: string;
  link?: { to: string; label: string };
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.1 }}>
        {title}
      </h2>
      {link && <TextLink to={link.to}>{link.label}</TextLink>}
    </div>
  );
}

export function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="shrink-0 underline-offset-4 hover:underline"
      style={{ fontFamily: SANS, fontSize: 13, color: C.gold }}
    >
      {children}
    </Link>
  );
}

/** Botão principal: dourado sólido, um por tela. */
export function PrimaryButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-12 w-full items-center justify-center rounded-[6px] px-6 transition-[filter,transform] hover:brightness-110 active:scale-[0.99] sm:w-auto"
      style={{ background: C.gold, color: C.ink, fontFamily: SANS, fontWeight: 500, fontSize: 15 }}
    >
      {children}
    </Link>
  );
}

/** Ação secundária de estado vazio: contorno fino, sem preenchimento. */
export function SecondaryButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-11 items-center justify-center rounded-[6px] px-5 transition-colors hover:bg-[rgba(184,149,90,0.08)]"
      style={{ border: '1px solid rgba(184,149,90,0.45)', color: C.gold, fontFamily: SANS, fontSize: 14 }}
    >
      {children}
    </Link>
  );
}
