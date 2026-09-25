import { C, SANS, SERIF } from './primitives';

/** Anel segmentado: um arco por exercício, preenchido em dourado quando feito. */
export function DayRing({ day, done, total, completed, size = 172, caption = 'exercícios concluídos' }: { day: number; done: number; total: number; completed: boolean[]; size?: number; caption?: string }) {
  const r = size / 2 - 10;
  const cx = size / 2;
  const gap = 6; // graus entre segmentos
  const seg = 360 / total;

  const arc = (i: number) => {
    const a0 = ((i * seg + gap / 2 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - gap / 2 - 90) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(a0)} ${cx + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cx + r * Math.sin(a1)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden>
          {completed.map((isDone, i) => (
            <path
              key={i}
              d={arc(i)}
              fill="none"
              stroke={isDone ? C.gold : 'rgba(232,228,220,0.12)'}
              strokeWidth={isDone ? 3 : 2}
              strokeLinecap="round"
              style={{ transition: 'stroke var(--dur-progress) var(--ease-out), stroke-width var(--dur-progress)' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>Dia {day}</span>
          <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: Math.round(size * 0.3), color: C.paper, lineHeight: 1 }}>
            {done}<span style={{ color: C.paper3, fontSize: Math.round(size * 0.2) }}>/{total}</span>
          </span>
        </div>
      </div>
      <p className="mt-2" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>{caption}</p>
    </div>
  );
}
