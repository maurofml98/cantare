import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Botões padrão do sistema de exercícios Cantare.
 * Estados uniformes (hover / active / focus / disabled) e tamanhos consistentes.
 * Usados em todas as cenas — idêntico ao Aquecimento Geral.
 */

type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, { h: number; px: number; fs: number; tracking: string }> = {
  sm: { h: 40, px: 16, fs: 11, tracking: '0.24em' },
  md: { h: 52, px: 22, fs: 12, tracking: '0.28em' },
  lg: { h: 60, px: 28, fs: 13, tracking: '0.32em' },
};

type GoldProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: Size;
  children: ReactNode;
};

/** Botão principal em ouro — CTA primário (Iniciar, Próximo, Finalizar). */
export function GoldButton({ size = 'lg', className = '', children, disabled, style, ...rest }: GoldProps) {
  const s = sizeMap[size];
  return (
    <button
      {...rest}
      disabled={disabled}
      className={
        'group relative overflow-hidden rounded-2xl text-[#07080A] ' +
        'transition-[transform,filter,box-shadow] duration-200 ease-out ' +
        'hover:brightness-110 hover:-translate-y-[1px] ' +
        'active:scale-[0.985] active:brightness-95 ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C97E]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080A] ' +
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 ' +
        className
      }
      style={{
        height: s.h,
        paddingInline: s.px,
        background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
        boxShadow:
          '0 1px 0 rgba(255,240,200,0.55) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 12px 40px -12px rgba(184,149,90,0.6)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: s.fs,
        fontWeight: 500,
        letterSpacing: s.tracking,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
        }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}

/** Botão fantasma — ação secundária (Repetir, Reiniciar, Finalizar cedo, Sair). */
export function GhostButton({ size = 'sm', className = '', children, disabled, style, ...rest }: GoldProps) {
  const s = sizeMap[size];
  return (
    <button
      {...rest}
      disabled={disabled}
      className={
        'inline-flex items-center justify-center gap-2 rounded-full ' +
        'text-[#8A8A95] hover:text-white ' +
        'border border-transparent hover:border-[rgba(184,149,90,0.35)] ' +
        'transition-[color,border-color,background-color,transform] duration-200 ' +
        'hover:bg-[rgba(184,149,90,0.06)] active:scale-[0.98] ' +
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8955A]/50 ' +
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[#8A8A95] disabled:hover:border-transparent disabled:hover:bg-transparent ' +
        className
      }
      style={{
        height: s.h,
        paddingInline: s.px,
        fontFamily: 'DM Sans, sans-serif',
        fontSize: s.fs,
        fontWeight: 400,
        letterSpacing: s.tracking,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
