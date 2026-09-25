import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * Peças da nova linguagem visual (tema claro, redesenho de 25/09/2026). Usam os tokens
 * `--c-*` de `.tema-claro` em `index.css`. Base para as próximas telas.
 */

/** Cartão base: branco, borda fina, sombra curta. `tint` = fundo claro da cor da função. */
export function Card({
  children,
  className = '',
  tint,
  as: Tag = 'section',
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  tint?: string;
  as?: 'section' | 'div';
  labelledBy?: string;
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`relative flex flex-col overflow-hidden rounded-[20px] border p-5 sm:p-6 ${className}`}
      style={{ background: tint ?? 'var(--c-surface)', borderColor: 'var(--c-border)', boxShadow: 'var(--c-shadow)' }}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ id, children, size = 'md' }: { id?: string; children: ReactNode; size?: 'md' | 'lg' }) {
  return (
    <h2 id={id} className={`font-extrabold tracking-[-0.01em] ${size === 'lg' ? 'text-[24px] sm:text-[28px]' : 'text-[20px] sm:text-[22px]'}`} style={{ color: 'var(--c-text)', lineHeight: 1.15 }}>
      {children}
    </h2>
  );
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[14px] sm:text-[15px] ${className}`} style={{ color: 'var(--c-text-2)', lineHeight: 1.45 }}>
      {children}
    </p>
  );
}

/** Rótulo curto em caixa alta (ex.: PRÓXIMO SHOW). */
export function Eyebrow({ children, color = 'var(--c-primary)', bg = 'var(--c-surface-blue)' }: { children: ReactNode; color?: string; bg?: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

/** "Em breve" — o texto diz o estado; a cor só reforça. */
export function SoonTag() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: '#FFE7A8', color: '#6B4A00' }}>
      Em breve
    </span>
  );
}

const BTN = 'c-press c-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-bold';

/** Botão-link. `solid` = fundo da cor; `outline` = contorno. */
export function LinkButton({
  to,
  params,
  search,
  children,
  color = 'var(--c-primary)',
  variant = 'solid',
  className = '',
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  children: ReactNode;
  color?: string;
  variant?: 'solid' | 'outline' | 'white';
  className?: string;
}) {
  const style =
    variant === 'solid'
      ? { background: color, color: '#FFFFFF' }
      : variant === 'white'
        ? { background: '#FFFFFF', color }
        : { background: 'transparent', color, boxShadow: `inset 0 0 0 1.5px ${color}` };
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} params={params as any} search={search as any} className={`${BTN} ${className}`} style={style}>
      {children}
    </Link>
  );
}

/** Esqueleto de carregamento — só cor, sem animação contínua (Android simples). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`rounded-[12px] ${className}`} style={{ background: 'var(--c-surface-blue)' }} />;
}
