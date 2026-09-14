import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { store } from '../lib/store';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = store.getUser();
    if (user) {
      navigate({ to: '/home' });
    } else {
      navigate({ to: '/auth' });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}