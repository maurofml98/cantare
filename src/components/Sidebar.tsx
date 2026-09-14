import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { store } from '../lib/store';
import { SoundWaveBars } from './AmbientBackground';

export function Sidebar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();
  const user = store.getUser();

  const isActive = (path: string) => {
    if (path === '/diario/evolucao') return pathname === '/diario/evolucao';
    if (path === '/home') return pathname === '/home';
    if (path === '/diario') return pathname.startsWith('/diario') && pathname !== '/diario/evolucao';
    if (path === '/repertorio') return pathname.startsWith('/repertorio');
    if (path === '/saude') return pathname.startsWith('/saude');
    return false;
  };

  const items = [
    { label: 'Home', path: '/home', roman: 'I' },
    { label: 'Teste Vocal', path: '/teste-vocal', roman: 'II' },
    { label: 'Diário de Treino', path: '/diario', roman: 'III' },
    { label: 'Evolução', path: '/diario/evolucao', roman: 'IV' },
    { label: 'Repertório', path: '/repertorio', roman: 'V' },
    { label: 'Saúde Vocal', path: '/saude', roman: 'VI' },
  ];

  const handleLogout = () => {
    store.clearUser();
    navigate({ to: '/auth' });
  };

  const initial = (user?.name?.[0] || 'C').toUpperCase();

  return (
    <aside
      className="h-screen flex flex-col sticky top-0"
      style={{
        width: 220,
        background: 'rgba(7,8,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <circle cx="6" cy="13" r="3" stroke="#B8955A" strokeWidth="1" fill="none" />
          <path d="M9 13 L9 2 L15 3" stroke="#B8955A" strokeWidth="1" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#B8955A' }}>
          Cantare
        </span>
      </div>

      {/* User with animated ring */}
      <div className="px-6 pb-10 flex items-center gap-3">
        <div className="relative" style={{ width: 36, height: 36 }}>
          <svg
            className="absolute inset-0 animate-spin-slow"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            aria-hidden
          >
            <circle
              cx="18" cy="18" r="17"
              fill="none"
              stroke="#B8955A"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.6"
            />
          </svg>
          <div
            className="absolute inset-1 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(184,149,90,0.08)' }}
          >
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 16, color: '#B8955A' }}>
              {initial}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p
            className="truncate"
            style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: 12, color: 'rgba(232,228,220,0.7)' }}
          >
            {user?.name || 'Cantor(a)'}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: 10, color: 'rgba(232,228,220,0.35)' }}>
            Bem-vindo(a)
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 pl-4 pr-4 py-2.5 relative rounded-md group"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 400,
                fontSize: 13,
                background: active ? 'rgba(184,149,90,0.05)' : 'transparent',
                transition: 'background 0.25s ease, transform 0.25s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ width: 2, height: 20, backgroundColor: '#B8955A' }}
                />
              )}
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontWeight: 300,
                  fontSize: 11,
                  width: 20,
                  color: active ? '#B8955A' : 'rgba(232,228,220,0.3)',
                }}
              >
                {item.roman}
              </span>
              <span
                className="transition-colors group-hover:text-[rgba(232,228,220,0.7)]"
                style={{ color: active ? '#B8955A' : 'rgba(232,228,220,0.3)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sound wave decoration */}
      <div className="px-6 pb-2 flex justify-center opacity-70">
        <SoundWaveBars bars={20} width={100} height={22} />
      </div>

      {/* Footer */}
      <div className="p-6 pt-2">
        <button
          onClick={handleLogout}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 300,
            fontSize: 11,
            color: 'rgba(232,228,220,0.25)',
          }}
          className="hover:text-[rgba(232,228,220,0.6)] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
