import { Moon, Sun } from 'lucide-react';
import { useTema } from '@/lib/tema';

/** Alterna claro/escuro do tema novo. O texto diz o estado — não depende só do ícone. */
export function ThemeToggle({ withLabel = false, className = '' }: { withLabel?: boolean; className?: string }) {
  const { tema, setTema } = useTema();
  const escuro = tema === 'escuro';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      aria-label="Modo escuro"
      onClick={() => setTema(escuro ? 'claro' : 'escuro')}
      className={`c-press c-focus inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[12px] border px-2.5 text-[14px] font-semibold ${className}`}
      style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)' }}
    >
      {escuro ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
      {withLabel && <span>{escuro ? 'Modo escuro' : 'Modo claro'}</span>}
    </button>
  );
}
