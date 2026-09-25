import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { ChartNoAxesColumn, House, ListMusic, LogOut, Mic, Music } from 'lucide-react';
import { store } from '../lib/store';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar({ claro = false }: { claro?: boolean }) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();
  const user = store.getUser();

  const isActive = (path: string) => {
    if (path === '/diario/evolucao') return pathname === '/diario/evolucao';
    if (path === '/home') return pathname === '/home';
    if (path === '/criar') return pathname.startsWith('/criar');
    if (path === '/treinos') return pathname.startsWith('/treinos') || pathname.startsWith('/teste-vocal') || pathname.startsWith('/saude');
    if (path === '/repertorio') return pathname.startsWith('/repertorio');
    return false;
  };

  // Ícones só na navegação (ação), nunca em cards de conteúdo — ver docs/DESIGN.md.
  // Ordem da Laury (CLAUDE.md, seção 14). Teste vocal vive dentro de Treino; Saúde vocal e Play, na Home.
  const items = [
    { label: 'Home', path: '/home', Icon: House },
    { label: 'Criar música', path: '/criar', Icon: Music },
    { label: 'Repertório', path: '/repertorio', Icon: ListMusic },
    // TODO(Laury): confirmar o nome "Voz" (era "Treino"; cobre treino e saúde vocal). Rota segue /treinos.
    { label: 'Voz', path: '/treinos', Icon: Mic },
    { label: 'Evolução', path: '/diario/evolucao', Icon: ChartNoAxesColumn },
  ];

  const handleLogout = () => {
    store.clearUser();
    navigate({ to: '/auth' });
  };

  const initial = (user?.name?.[0] || 'C').toUpperCase();

  // Tema claro (redesenho de 25/09/2026): por enquanto só com a Home aberta — ver `index.css`.
  if (claro) return <SidebarClaro items={items} isActive={isActive} name={user?.name} initial={initial} onLogout={handleLogout} />;

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col"
      style={{
        width: 240,
        background: 'linear-gradient(180deg, #0A0B0E 0%, #07080A 100%)',
        borderRight: '1px solid rgba(232,228,220,0.06)',
      }}
    >
      {/* Marca */}
      <div className="flex items-center gap-3 px-7 pb-8 pt-8">
        <svg width="20" height="26" viewBox="0 0 20 26" fill="none" aria-hidden>
          <ellipse cx="6.5" cy="20" rx="4.5" ry="3.4" transform="rotate(-18 6.5 20)" fill="#B8955A" />
          <path d="M10.6 19V2.5c2.8 1.4 6 3.2 6 7.2" stroke="#B8955A" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <div>
          <span className="block" style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 26, color: '#E8E4DC', lineHeight: 1 }}>
            Cantare
          </span>
          <span className="mt-1 block" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(184,149,90,0.85)' }}>
            sua voz em evolução
          </span>
        </div>
      </div>

      {/* Usuário */}
      <div className="mx-4 mb-8 flex items-center gap-3 rounded-[8px] px-3 py-3" style={{ background: 'rgba(232,228,220,0.025)', border: '1px solid rgba(232,228,220,0.05)' }}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ border: '1px solid rgba(184,149,90,0.55)', background: 'radial-gradient(circle at 35% 30%, #1A1B1F, #0B0C0F)' }}
        >
          <span style={{ fontFamily: 'Newsreader, serif', fontSize: 18, color: '#B8955A' }}>{initial}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 14, color: '#E8E4DC' }}>
            {user?.name || 'Cantor(a)'}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(232,228,220,0.5)' }}>Bem-vindo(a)</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-4" aria-label="Principal">
        {items.map(({ label, path, Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? 'page' : undefined}
              className="group relative flex items-center gap-3.5 rounded-[6px] px-4 py-3 outline-none transition-[background-color,transform] duration-[var(--dur-hover)] ease-[var(--ease-out)] hover:bg-[rgba(232,228,220,0.045)] active:scale-[0.98] active:duration-[var(--dur-press)] focus-visible:ring-2 focus-visible:ring-[#B8955A]/60"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                background: active ? 'linear-gradient(90deg, rgba(184,149,90,0.12) 0%, rgba(184,149,90,0.02) 100%)' : undefined,
              }}
            >
              {active && (
                <span
                  key={pathname}
                  aria-hidden
                  className="nav-indicator absolute bottom-2 left-0 top-2 w-[2px] rounded-full"
                  style={{ background: '#B8955A' }}
                />
              )}
              <Icon
                size={19}
                strokeWidth={1.4}
                style={{ color: active ? '#B8955A' : undefined }}
                className={`transition-colors duration-[var(--dur-hover)] ${active ? '' : 'text-[rgba(232,228,220,0.5)] group-hover:text-[rgba(212,178,120,0.9)]'}`}
              />
              <span
                className="transition-colors group-hover:text-[#E8E4DC]"
                style={{ color: active ? '#E8E4DC' : 'rgba(232,228,220,0.62)', fontWeight: active ? 500 : 400 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-7 pb-7">
        <div className="mb-5 h-px w-10" style={{ background: 'rgba(184,149,90,0.5)' }} />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-sm outline-none transition-colors hover:text-[rgba(232,228,220,0.85)] focus-visible:ring-2 focus-visible:ring-[#B8955A]/60"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(232,228,220,0.45)' }}
        >
          <LogOut size={15} strokeWidth={1.4} />
          Sair
        </button>
      </div>
    </aside>
  );
}

type NavItem = { label: string; path: string; Icon: typeof House };

/** Marca: barras de onda sonora nas cores das funções + nome. Desenho próprio. */
function LogoClaro() {
  const bars = [
    { h: 10, c: 'var(--c-primary)' },
    { h: 20, c: 'var(--c-purple)' },
    { h: 28, c: 'var(--c-coral)' },
    { h: 18, c: 'var(--c-orange)' },
    { h: 12, c: 'var(--c-yellow)' },
  ];
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        {bars.map((b, i) => (
          <rect key={i} x={2 + i * 5.5} y={15 - b.h / 2} width="3.5" height={b.h} rx="1.75" fill={b.c} />
        ))}
      </svg>
      <span className="text-[26px] font-extrabold tracking-[-0.03em]" style={{ color: 'var(--c-text)' }}>Cantare</span>
    </span>
  );
}

function SidebarClaro({
  items,
  isActive,
  name,
  initial,
  onLogout,
}: {
  items: NavItem[];
  isActive: (p: string) => boolean;
  name?: string;
  initial: string;
  onLogout: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-col border-r px-4 py-7" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
      <div className="px-3 pb-8">
        <LogoClaro />
      </div>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
        {items.map(({ label, path, Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? 'page' : undefined}
              className="c-focus relative flex min-h-[48px] items-center gap-3.5 rounded-[12px] px-3.5 text-[16px] transition-colors duration-150"
              style={{
                background: active ? 'var(--c-surface-blue)' : undefined,
                color: active ? 'var(--c-primary-ink)' : 'var(--c-text)',
                fontWeight: active ? 700 : 500,
              }}
            >
              {active && <span aria-hidden className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full" style={{ background: 'var(--c-primary-ink)' }} />}
              <Icon size={22} strokeWidth={active ? 2.3 : 1.9} style={{ color: active ? 'var(--c-primary-ink)' : 'var(--c-text-2)' }} />
              {label}
            </Link>
          );
        })}
      </nav>
      <ThemeToggle withLabel className="mx-2 mb-3 justify-start" />
      <div className="flex items-center gap-3 border-t px-2 pt-4" style={{ borderColor: 'var(--c-border)' }}>
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold" style={{ background: 'var(--c-surface-blue)', color: 'var(--c-primary-ink)' }}>
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold" style={{ color: 'var(--c-text)' }}>{name || 'Cantor(a)'}</span>
        <button
          type="button"
          onClick={onLogout}
          className="c-focus inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-medium"
          style={{ color: 'var(--c-text-2)' }}
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  );
}
