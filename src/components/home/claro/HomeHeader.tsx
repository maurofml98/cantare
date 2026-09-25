import { greetingFor } from '@/lib/home/today';
import { ThemeToggle } from '@/components/ThemeToggle';

/** Saudação curta. Sem busca, sino ou perfil falsos — nada disso existe ainda. */
export function HomeHeader({ name }: { name?: string }) {
  return (
    <header className="flex items-start justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[32px]" style={{ color: 'var(--c-text)', lineHeight: 1.1 }}>
          {greetingFor()}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="mt-1 text-[15px] sm:text-[16px]" style={{ color: 'var(--c-text-2)' }}>O que vamos preparar hoje?</p>
      </div>
      {/* no desktop o botão fica na sidebar */}
      <ThemeToggle className="shrink-0 lg:hidden" />
    </header>
  );
}
