import { useRef } from 'react';
import { GOLD_HI, INK, StageCue, StageImage, StageSvg, clamp, levelOf, useVisualLoop, type VisualProps } from './shared';

const CX = 835;
const CY = 428;
const AIR = [
  'M0 230 C 260 230, 520 360, 835 428',
  'M0 330 C 300 320, 560 420, 835 428',
  'M0 470 C 300 490, 560 440, 835 428',
  'M0 590 C 260 600, 540 470, 835 428',
];
const BARS = Array.from({ length: 34 }, (_, i) => 885 + i * 22);

/**
 * Coordenação Vocal — ar → centro → voz.
 * À esquerda o ar avança (guia). À direita as barras seguem o volume real.
 * O centro acende quando há emissão contínua com altura definida (som + nota detectados).
 */
export function CoordinationVisual({ cfg, session, reduced }: VisualProps) {
  const air = useRef<(SVGPathElement | null)[]>([]);
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const ring = useRef<SVGCircleElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const core = useRef<SVGCircleElement>(null);
  const sync = useRef(0);
  const lvl = useRef(0);

  useVisualLoop(session.status, reduced, (vt, dt) => {
    const L = session.live.current;
    const running = session.status === 'running';
    const target = running && L.voiced && L.midi !== null ? 1 : 0;
    const k = dt ? Math.min(1, dt * 5) : 1;
    sync.current += (target - sync.current) * k;
    lvl.current += ((running ? levelOf(L.rms) : 0) - lvl.current) * k;
    const s = sync.current;

    air.current.forEach((p, i) => p?.setAttribute('stroke-dashoffset', (-(vt * (70 + i * 12))).toFixed(1)));
    ring.current?.setAttribute('stroke-opacity', (0.28 + 0.62 * s).toFixed(2));
    ring.current?.setAttribute('stroke-width', (2 + 3 * s).toFixed(1));
    halo.current?.setAttribute('opacity', (0.5 * s).toFixed(2));
    core.current?.setAttribute('r', (16 + 10 * s + 6 * lvl.current).toFixed(1));

    bars.current.forEach((r, i) => {
      if (!r) return;
      const decay = 0.45 + 0.55 * Math.sin((i / BARS.length) * Math.PI);
      const wobble = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.55 - vt * 3.2));
      const h = 6 + 210 * lvl.current * decay * wobble;
      r.setAttribute('y', (CY - h / 2).toFixed(1));
      r.setAttribute('height', h.toFixed(1));
      r.setAttribute('opacity', (0.3 + 0.7 * clamp(lvl.current * 2)).toFixed(2));
    });
  });

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <defs>
          <radialGradient id="coord-halo">
            <stop offset="0%" stopColor={GOLD_HI} stopOpacity="0.75" />
            <stop offset="100%" stopColor={GOLD_HI} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1672" height="941" fill={INK} opacity="0.22" />
        {AIR.map((d, i) => (
          <path key={i} ref={(el) => { air.current[i] = el; }} d={d} fill="none" stroke="#F3E7CF" strokeWidth="2.2" strokeOpacity="0.45" strokeDasharray="10 34" strokeLinecap="round" />
        ))}
        {BARS.map((x, i) => (
          <rect key={x} ref={(el) => { bars.current[i] = el; }} x={x} y={CY - 3} width="5" height="6" rx="2.5" fill={GOLD_HI} opacity="0.3" />
        ))}
        <circle ref={halo} cx={CX} cy={CY} r="190" fill="url(#coord-halo)" opacity="0" />
        <circle ref={ring} cx={CX} cy={CY} r="130" fill="none" stroke={GOLD_HI} strokeWidth="2" strokeOpacity="0.28" />
        <circle ref={core} cx={CX} cy={CY} r="16" fill="#FFF1CF" />
      </StageSvg>
      {session.status === 'running' && <StageCue>{cfg.cue}</StageCue>}
    </>
  );
}
