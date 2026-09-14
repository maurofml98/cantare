import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { store } from '../lib/store';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { PortalProvider } from '../components/PortalTransition';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const user = store.getUser();
    if (!user) {
      navigate({ to: '/auth' });
    } else {
      setHasUser(true);
    }
    setReady(true);
  }, [navigate]);

  if (!ready || !hasUser) return null;

  return (
    <div className="relative flex min-h-screen overflow-hidden" style={{ backgroundColor: '#07080A', color: '#E8E4DC' }}>
      <PortalProvider>
        {/* Desktop Sidebar */}
        <div className="relative z-10 hidden md:block">
          <Sidebar />
        </div>

        <div className="custom-scrollbar relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
          {/*
           * Padrão do Cantare: área de conteúdo larga (até 1760px), nunca coluna estreita.
           * Cada tela organiza o próprio grid dentro dela.
           */}
          <main className="mx-auto w-full max-w-[1760px] flex-1 px-4 py-6 pb-[120px] md:px-8 md:pb-6">
            <Outlet />
          </main>

          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:hidden">
            <div className="pointer-events-auto mx-auto max-w-[420px]">
              <BottomNav />
            </div>
          </div>
        </div>
      </PortalProvider>
    </div>
  );
}
