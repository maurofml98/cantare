import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { store } from '../lib/store';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { AmbientBackground } from '../components/AmbientBackground';
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
      <AmbientBackground />
      <PortalProvider>
        {/* Desktop Sidebar */}
        <div className="hidden md:block relative z-10">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-y-auto custom-scrollbar">
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10 pb-[120px] md:pb-10">
            <Outlet />
          </main>

          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none">
            <div className="pointer-events-auto max-w-[420px] mx-auto">
              <BottomNav />
            </div>
          </div>
        </div>
      </PortalProvider>
    </div>
  );
}

