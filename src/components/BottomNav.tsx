import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Music, Heart, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === '/home' && pathname === '/home') return true;
    if (path === '/teste-vocal' && pathname.startsWith('/teste-vocal')) return true;
    if (path === '/diario' && pathname.startsWith('/diario')) return true;
    if (path === '/repertorio' && pathname.startsWith('/repertorio')) return true;
    if (path === '/saude' && pathname.startsWith('/saude')) return true;
    return false;
  };

  const itemCls = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 rounded-2xl',
      active ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5'
    );

  return (
    <nav className="flex h-16 w-full items-center justify-around border border-white/5 bg-[#111118]/80 backdrop-blur-xl px-4 rounded-3xl shadow-2xl">
      <Link to="/home" className={itemCls(isActive('/home'))}>
        <Home size={22} />
      </Link>

      <Link to="/teste-vocal" className={itemCls(isActive('/teste-vocal'))} aria-label="Teste Vocal">
        <Mic size={22} />
      </Link>

      <Link to="/diario" className={itemCls(isActive('/diario'))} aria-label="Diário">
        <span className="text-[22px] leading-none" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          ♩
        </span>
      </Link>

      <Link to="/repertorio" className={itemCls(isActive('/repertorio'))}>
        <Music size={22} />
      </Link>

      <Link to="/saude" className={itemCls(isActive('/saude'))}>
        <Heart size={22} />
      </Link>
    </nav>
  );
}

