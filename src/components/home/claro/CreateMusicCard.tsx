import { Link } from '@tanstack/react-router';
import { Card, CardTitle, Muted, SoonTag } from './ui';

/**
 * Criar música — primeira perna da tríade (CLAUDE.md, topo). A função não existe: o card
 * comunica o futuro sem fluxo falso. Sem "Quero ser avisado" até existir inscrição de verdade.
 */
export function CreateMusicCard() {
  return (
    <Card tint="var(--c-orange-bg)" labelledBy="criar-titulo" className="h-full">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle id="criar-titulo" size="lg">Criar sua música</CardTitle>
            <SoonTag />
          </div>
          <p className="text-[16px] font-bold sm:text-[17px]" style={{ color: 'var(--c-text)' }}>Guias e bases com IA.</p>
          <Muted>Da ideia à canção, junto do seu repertório.</Muted>
          <div className="mt-auto pt-2">
            <Link
              to="/criar"
              className="c-focus inline-flex min-h-[44px] items-center rounded-[10px] text-[15px] font-bold underline-offset-4 hover:underline"
              style={{ color: 'var(--c-orange-ink)' }}
            >
              Saiba mais
            </Link>
          </div>
        </div>
        <SongSketch />
      </div>
    </Card>
  );
}

/** Folhas de "letra, estilo, tom" e uma onda — desenho próprio, sem ícone de biblioteca. */
function SongSketch() {
  const bars = [14, 26, 40, 30, 52, 36, 22, 44, 28, 16];
  return (
    <svg viewBox="0 0 220 130" className="hidden h-full max-h-[150px] w-full lg:block" aria-hidden>
      {[
        { y: 18, label: 'Letra', r: -6 },
        { y: 52, label: 'Estilo', r: -3 },
        { y: 86, label: 'Tom', r: 0 },
      ].map((c, i) => (
        <g key={c.label} transform={`rotate(${c.r} 60 ${c.y + 12})`}>
          <rect x={8 + i * 4} y={c.y} width="104" height="26" rx="8" fill="var(--c-inner)" stroke="var(--c-orange-line)" />
          <path d={`M${20 + i * 4} ${c.y + 13} l4 4 l7 -8`} stroke="var(--c-orange)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={38 + i * 4} y={c.y + 17.5} fontSize="12" fontWeight="600" fill="var(--c-orange-ink)" fontFamily="DM Sans, sans-serif">{c.label}</text>
        </g>
      ))}
      {bars.map((h, i) => (
        <rect key={i} x={132 + i * 8.5} y={65 - h / 2} width="4.5" height={h} rx="2.25" fill={i % 3 === 1 ? 'var(--c-yellow)' : 'var(--c-orange)'} />
      ))}
    </svg>
  );
}
