import { Link, useRouterState } from '@tanstack/react-router';
import { ChartNoAxesColumn, House, ListMusic, Mic, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ordem da Laury (CLAUDE.md, seção 14). Teste vocal vive dentro de Treino; Saúde vocal e Play, na Home.
const ITEMS = [
  { to: '/home', label: 'Home', Icon: House, match: (p: string) => p === '/home' },
  { to: '/criar', label: 'Criar música', Icon: Music, match: (p: string) => p.startsWith('/criar') },
  { to: '/repertorio', label: 'Repertório', Icon: ListMusic, match: (p: string) => p.startsWith('/repertorio') },
  // TODO(Laury): confirmar o nome "Voz" (era "Treino"; cobre treino e saúde vocal). Rota segue /treinos.
  { to: '/treinos', label: 'Voz', Icon: Mic, match: (p: string) => p.startsWith('/treinos') || p.startsWith('/teste-vocal') || p.startsWith('/saude') },
  { to: '/diario/evolucao', label: 'Evolução', Icon: ChartNoAxesColumn, match: (p: string) => p === '/diario/evolucao' },
];

export function BottomNav({ claro = false }: { claro?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (claro) return <BottomNavClaro pathname={pathname} />;

  return (
    <nav
      aria-label="Principal"
      className="flex h-16 w-full items-center justify-around rounded-3xl border border-white/5 bg-[#0E1013]/90 px-2 shadow-2xl backdrop-blur-md"
    >
      {ITEMS.map(({ to, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              // Ativo = ícone dourado + traço fino acima, como a linha lateral da sidebar. Sem fundo.
              'relative flex h-12 w-12 items-center justify-center rounded-[10px] outline-none',
              'transition-[color,transform,background-color] duration-[var(--dur-hover)] active:scale-[0.94] active:duration-[var(--dur-press)]',
              'focus-visible:ring-2 focus-visible:ring-[#B8955A]/60',
              "before:absolute before:left-1/2 before:top-0 before:h-[2px] before:w-5 before:-translate-x-1/2 before:bg-[#B8955A] before:transition-opacity before:content-['']",
              active ? 'text-[#B8955A] before:opacity-100' : 'text-[rgba(232,228,220,0.45)] before:opacity-0 hover:text-[rgba(232,228,220,0.8)]',
            )}
          >
            <Icon size={21} strokeWidth={1.5} />
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Barra inferior do tema claro (redesenho de 25/09/2026): fixa no fundo, largura toda, rótulo
 * embaixo do ícone (o público usa Android simples — ícone sozinho não basta). Área de toque de
 * 56 px de altura.
 */
function BottomNavClaro({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Principal"
      className="grid grid-cols-5 border-t px-1 pt-1"
      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', paddingBottom: 'max(6px, env(safe-area-inset-bottom))', boxShadow: '0 -4px 16px rgba(20, 60, 110, 0.06)' }}
    >
      {ITEMS.map(({ to, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className="c-focus c-press flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[12px] px-0.5"
            style={{ color: active ? 'var(--c-primary-ink)' : 'var(--c-text-2)' }}
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full" style={{ background: active ? 'var(--c-surface-blue)' : undefined }}>
              <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
            </span>
            <span className="max-w-full truncate text-[11px] leading-none" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
