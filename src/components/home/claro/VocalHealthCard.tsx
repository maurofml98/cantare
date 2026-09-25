import { Link } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { LAURY_TIP } from '@/components/home/HomeSections';
import { Card, CardTitle, Muted } from './ui';

/**
 * Saúde vocal — atalho da Home para aquecer e desaquecer sem entrar na aba Voz, com a dica da
 * Laury. Sem foto: não há foto real dela aprovada (o retrato em public/outros é gerado).
 */
export function VocalHealthCard() {
  return (
    <Card tint="var(--c-cyan-bg)" labelledBy="saude-titulo" className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div>
          <CardTitle id="saude-titulo">Saúde vocal</CardTitle>
          <Muted className="mt-1">Cuide da sua voz para cantar sempre bem.</Muted>
        </div>

        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          <Shortcut to="geral" title="Aquecimento" text="Antes de cantar" icon={<Sun size={22} strokeWidth={2.2} style={{ color: 'var(--c-orange)' }} />} />
          <Shortcut to="desaquecimento" title="Desaquecimento" text="Depois do show" icon={<Moon size={22} strokeWidth={2.2} style={{ color: 'var(--c-primary)' }} />} />
        </div>

        {/* TODO(Laury): texto provisório — o texto final e a rotação de dicas vêm dela. */}
        <figure className="mt-auto rounded-[14px] bg-white px-4 py-3">
          <blockquote className="text-[15px] font-semibold" style={{ color: 'var(--c-text)', lineHeight: 1.4 }}>
            <span aria-hidden className="mr-1 text-[22px] font-extrabold leading-none" style={{ color: 'var(--c-cyan-ink)' }}>“</span>
            {LAURY_TIP}
          </blockquote>
          <figcaption className="mt-1 text-[13px]" style={{ color: 'var(--c-text-2)' }}>Laury, fonoaudióloga</figcaption>
        </figure>
        <p className="text-[12px]" style={{ color: 'var(--c-text-2)' }}>Sentiu dor ou rouquidão? Pare e procure um profissional.</p>
      </div>
    </Card>
  );
}

function Shortcut({ to, title, text, icon }: { to: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <Link
      to="/saude/$warmupId"
      params={{ warmupId: to }}
      className="c-lift c-focus flex min-h-[64px] items-center gap-3 rounded-[14px] bg-white px-3.5 py-3"
    >
      <span aria-hidden className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold" style={{ color: 'var(--c-text)' }}>{title}</span>
        <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>{text}</span>
      </span>
    </Link>
  );
}
