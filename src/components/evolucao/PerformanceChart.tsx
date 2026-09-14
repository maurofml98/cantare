import { useMemo, useRef, useState } from 'react';
import type { DayPoint } from '@/lib/diario/history';
import { C, SANS } from '@/components/home/primitives';

export type ChartMetric = 'accuracy' | 'minutes' | 'exercises';

const METRIC = {
  accuracy: { max: 100, unit: '%', label: 'precisão', ticks: [0, 25, 50, 75, 100] },
  minutes: { max: 0, unit: ' min', label: 'de treino', ticks: [] as number[] },
  exercises: { max: 7, unit: '', label: 'exercícios', ticks: [0, 2, 4, 6] },
} as const;

/**
 * Linha do desempenho no período. Dias sem registro não viram zero — a linha só liga dias com dado.
 * Tooltip segue o ponteiro (mouse ou toque). A linha desenha ao trocar período/métrica.
 */
export function PerformanceChart({ days, metric }: { days: DayPoint[]; metric: ChartMetric }) {
  const W = 1000;
  const H = 260;
  const PAD = { l: 44, r: 16, t: 16, b: 30 };
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const values = days.map((d) => (metric === 'accuracy' ? d.accuracy : metric === 'minutes' ? (d.exercises ? d.minutes : null) : d.exercises || null));
  const max = metric === 'minutes' ? Math.max(15, ...values.filter((v): v is number => v !== null)) : METRIC[metric].max;
  const ticks = metric === 'minutes' ? [0, Math.round(max / 3), Math.round((2 * max) / 3), max] : METRIC[metric].ticks;

  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, days.length - 1);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);

  const pts = values.map((v, i) => (v === null ? null : { x: x(i), y: y(v), v, i })).filter(Boolean) as { x: number; y: number; v: number; i: number }[];
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].x} ${H - PAD.b} L${pts[0].x} ${H - PAD.b} Z` : '';
  const labelEvery = days.length <= 7 ? 1 : days.length <= 30 ? 5 : 15;
  const drawKey = useMemo(() => `${metric}-${days.length}-${pts.length}`, [metric, days.length, pts.length]);

  const onPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (days.length - 1));
    setHover(Math.min(days.length - 1, Math.max(0, i)));
  };

  const h = hover !== null ? days[hover] : null;
  const hv = hover !== null ? values[hover] : null;
  const fmtDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

  return (
    <div className="relative h-full w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full touch-none"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Gráfico de ${METRIC[metric].label} por dia, ${pts.length} dias com registro`}
      >
        <defs>
          <linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(232,228,220,0.06)" vectorEffect="non-scaling-stroke" />
            <text x={PAD.l - 10} y={y(t) + 4} textAnchor="end" style={{ fontFamily: SANS, fontSize: 12, fill: 'rgba(232,228,220,0.4)' }}>
              {t}{metric === 'accuracy' ? '%' : ''}
            </text>
          </g>
        ))}
        {days.map((d, i) =>
          i % labelEvery === 0 || i === days.length - 1 ? (
            <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} style={{ fontFamily: SANS, fontSize: 12, fill: 'rgba(232,228,220,0.4)' }}>
              {days.length <= 7 ? new Date(`${d.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') : fmtDate(d.date)}
            </text>
          ) : null,
        )}
        {area && <path d={area} fill="url(#pc-area)" key={`a-${drawKey}`} className="pc-fade" />}
        {pts.length > 1 && (
          <path key={`l-${drawKey}`} d={line} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} className="pc-draw" />
        )}
        {pts.map((p) => (
          <circle key={`${drawKey}-${p.i}`} cx={p.x} cy={p.y} r={hover === p.i ? 6 : 4} fill={hover === p.i ? C.paper : C.gold} stroke="#0B0C0F" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ transition: 'r 150ms' }} />
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(232,228,220,0.18)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
      </svg>

      {h && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-[6px] px-3 py-2"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover!) / W) * 100))}%`,
            background: '#15171C',
            border: '1px solid rgba(184,149,90,0.35)',
            fontFamily: SANS,
            boxShadow: '0 12px 30px -12px rgba(0,0,0,0.8)',
            minWidth: 120,
          }}
        >
          <p style={{ fontSize: 12, color: C.paper3 }}>{fmtDate(h.date)}</p>
          {h.exercises ? (
            <>
              <p style={{ fontSize: 15, color: C.paper }}>
                {hv !== null ? `${hv}${METRIC[metric].unit}` : 'sem medição'} <span style={{ color: C.paper3, fontSize: 12 }}>{METRIC[metric].label}</span>
              </p>
              <p style={{ fontSize: 12, color: C.paper3 }}>{h.minutes} min · {h.exercises} {h.exercises === 1 ? 'exercício' : 'exercícios'}</p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: C.paper2 }}>Sem treino neste dia</p>
          )}
        </div>
      )}

      <style>{`
        .pc-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: pc-draw 650ms var(--ease-out) forwards; }
        .pc-fade { opacity: 0; animation: pc-fade 500ms 250ms var(--ease-out) forwards; }
        @keyframes pc-draw { to { stroke-dashoffset: 0 } }
        @keyframes pc-fade { to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .pc-draw { stroke-dashoffset: 0; animation: none } .pc-fade { opacity: 1; animation: none } }
      `}</style>
    </div>
  );
}
