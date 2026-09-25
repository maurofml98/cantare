import { Card, CardTitle, Muted, SoonTag } from './ui';

/** Play — jogos musicais (ROADMAP, Fase 7). Não existe ainda; card discreto, sem botão. */
export function PlayComingSoon() {
  return (
    <Card tint="var(--c-purple-bg)" labelledBy="play-titulo" className="h-full">
      <div className="flex h-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle id="play-titulo">Play</CardTitle>
          <SoonTag />
        </div>
        <Muted>Jogos musicais de ritmo e de ouvido.</Muted>
        <RhythmMark />
      </div>
    </Card>
  );
}

/** Blocos de ritmo — desenho próprio. */
function RhythmMark() {
  const cells = [1, 0, 1, 1, 0, 1, 0, 1];
  return (
    <svg viewBox="0 0 176 40" className="mt-auto h-10 w-full max-w-[200px]" aria-hidden>
      {cells.map((on, i) => (
        <rect key={i} x={i * 22} y={on ? 6 : 16} width="16" height={on ? 28 : 18} rx="5" fill={on ? 'var(--c-purple)' : 'var(--c-purple-off)'} />
      ))}
    </svg>
  );
}
