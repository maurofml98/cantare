import { C } from '@/components/home/primitives';

/** Marca desenhada à mão para cada exercício — não é ícone de biblioteca. */
export function ExerciseGlyph({ id, color = C.gold, className = '' }: { id: string; color?: string; className?: string }) {
  const s = { stroke: color, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden className={className}>
      {id === '1' && (<><path d="M4 18h20" {...s} strokeOpacity={0.4} /><path d="M8 18c0-5 3-9 6-9s6 4 6 9" {...s} /><path d="M14 4v2M6.5 7.5l1.4 1.4M21.5 7.5l-1.4 1.4" {...s} /></>)}
      {id === '2' && (<><path d="M14 4v6" {...s} /><path d="M14 10c-2 0-7 1-8 8 0 2 2 2 4 1l4-3" {...s} /><path d="M14 10c2 0 7 1 8 8 0 2-2 2-4 1l-4-3" {...s} /></>)}
      {id === '3' && (<><path d="M3 16c4 0 5-8 11-8s7 8 11 8" {...s} /><path d="M3 12h4M21 12h4" {...s} strokeOpacity={0.45} /></>)}
      {id === '4' && <path d="M3 19c3 0 4-14 8-14s4 14 7 14 4-9 7-9" {...s} />}
      {id === '5' && (<>{[6, 10, 14, 18].map((y) => <line key={y} x1="3" x2="25" y1={y} y2={y} {...s} strokeOpacity={0.3} />)}<circle cx="9" cy="14" r="2" fill={color} /><circle cx="15" cy="10" r="2" fill={color} /><circle cx="21" cy="6" r="2" fill={color} /></>)}
      {id === '6' && (<><path d="M5 18a9 9 0 0 1 18 0" {...s} strokeOpacity={0.5} /><path d="M9 18a5 5 0 0 1 10 0" {...s} /><circle cx="14" cy="18" r="1.4" fill={color} /></>)}
      {id === '7' && <path d="M3 7c4 0 5 5 9 5s5 4 9 4 3 2 4 2" {...s} />}
    </svg>
  );
}
