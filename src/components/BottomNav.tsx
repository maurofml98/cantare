import { Link, useRouterState } from '@tanstack/react-router';
import { Dumbbell, ChartNoAxesColumn, House, Music2, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ordem da Laury (CLAUDE.md, seção 14). Teste vocal vive dentro de Treino; Saúde vocal e Play, na Home.
const ITEMS = [
  { to: '/home', label: 'Home', Icon: House, match: (p: string) => p === '/home' },
  { to: '/criar', label: 'Criar música', Icon: PenLine, match: (p: string) => p.startsWith('/criar') },
  { to: '/repertorio', label: 'Repertório', Icon: Music2, match: (p: string) => p.startsWith('/repertorio') },
  { to: '/treinos', label: 'Treino', Icon: Dumbbell, match: (p: string) => p.startsWith('/treinos') || p.startsWith('/teste-vocal') },
  { to: '/diario/evolucao', label: 'Evolução', Icon: ChartNoAxesColumn, match: (p: string) => p === '/diario/evolucao' },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
