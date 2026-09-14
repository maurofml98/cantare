import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { BookOpen, ChartNoAxesColumn, Heart, House, LogOut, Music2, AudioLines } from 'lucide-react';
import { store } from '../lib/store';

export function Sidebar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();
  const user = store.getUser();

  const isActive = (path: string) => {
    if (path === '/diario/evolucao') return pathname === '/diario/evolucao';
    if (path === '/home') return pathname === '/home';
    if (path === '/teste-vocal') return pathname.startsWith('/teste-vocal');
    if (path === '/diario') return pathname.startsWith('/diario') && pathname !== '/diario/evolucao';
    if (path === '/repertorio') return pathname.startsWith('/repertorio');
    if (path === '/saude') return pathname.startsWith('/saude');
    return false;
  };

  // Ícones só na navegação (ação), nunca em cards de conteúdo — ver docs/DESIGN.md.
  const items = [
    { label: 'Home', path: '/home', Icon: House },
    { label: 'Teste Vocal', path: '/teste-vocal', Icon: AudioLines },
    { label: 'Diário de Treino', path: '/diario', Icon: BookOpen },
    { label: 'Evolução', path: '/diario/evolucao', Icon: ChartNoAxesColumn },
    { label: 'Repertório', path: '/repertorio', Icon: Music2 },
    { label: 'Saúde Vocal', path: '/saude', Icon: Heart },
  ];

  const handleLogout = () => {
    store.clearUser();
    navigate({ to: '/auth' });
  };

  const initial = (user?.name?.[0] || 'C').toUpperCase();

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
              <span
                aria-hidden
                className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-opacity"
                style={{ background: '#B8955A', opacity: active ? 1 : 0 }}
              />
              <Icon
                size={19}
                strokeWidth={1.4}
                style={{ color: active ? '#B8955A' : 'rgba(232,228,220,0.5)' }}
                className="transition-colors group-hover:!text-[rgba(232,228,220,0.85)]"
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
