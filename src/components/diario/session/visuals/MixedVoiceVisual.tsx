import { useRef } from 'react';
import { GOLD_HI, INK, StageCue, StageImage, StageSvg, clamp, easeInOut, lerp, useVisualLoop, type VisualProps } from './shared';

const FLOW = 'M836 560 C 700 500, 905 420, 822 360 C 760 312, 905 282, 836 246';
const TOP = { x: 836, y: 172 };
const BOTTOM = { x: 836, y: 668 };
const SCALE_X = 1240;

/**
 * Voz Mista — peito e cabeça buscando equilíbrio.
 * Um fluxo de luz viaja entre as esferas (orientação, não medição de registro).
 * A régua à direita mostra a altura REAL da sua nota dentro da faixa do Teste Vocal.
 */
export function MixedVoiceVisual({ cfg, session, reduced, range }: VisualProps) {
  const flow = useRef<SVGPathElement>(null);
  const spark = useRef<SVGGElement>(null);
  const haloTop = useRef<SVGCircleElement>(null);
  const haloBottom = useRef<SVGCircleElement>(null);
  const mark = useRef<SVGGElement>(null);
  const markY = useRef(BOTTOM.y);

  const low = range?.low ?? 48;
  const high = range?.high ?? 72;
  const yOf = (midi: number) => lerp(BOTTOM.y, TOP.y, clamp((midi - low) / Math.max(1, high - low)));

  useVisualLoop(session.status, reduced, (vt, dt) => {
    const el = flow.current;
    if (!el) return;
    const len = el.getTotalLength();
    const u = (vt % 6) / 6;
    const s = reduced ? 0.5 : easeInOut(u < 0.5 ? u * 2 : (1 - u) * 2);
    const pt = el.getPointAtLength(s * len);
    spark.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    haloTop.current?.setAttribute('opacity', (0.12 + 0.45 * s).toFixed(2));
    haloBottom.current?.setAttribute('opacity', (0.12 + 0.45 * (1 - s)).toFixed(2));

    const L = session.live.current;
    const show = session.status === 'running' && L.midi !== null;
    if (show) markY.current += (yOf(L.midi!) - markY.current) * (dt ? Math.min(1, dt * 8) : 1);
    mark.current?.setAttribute('transform', `translate(${SCALE_X} ${markY.current.toFixed(1)})`);
    mark.current?.setAttribute('opacity', show ? '1' : '0');
  });

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <defs>
          <radialGradient id="mix-halo">
            <stop offset="0%" stopColor={GOLD_HI} stopOpacity="0.8" />
            <stop offset="100%" stopColor={GOLD_HI} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1672" height="941" fill={INK} opacity="0.15" />
        <circle ref={haloTop} cx={TOP.x} cy={TOP.y} r="150" fill="url(#mix-halo)" opacity="0.2" />
        <circle ref={haloBottom} cx={BOTTOM.x} cy={BOTTOM.y} r="200" fill="url(#mix-halo)" opacity="0.2" />
        <path ref={flow} d={FLOW} fill="none" stroke={GOLD_HI} strokeWidth="2" strokeOpacity="0.35" strokeDasharray="3 10" />
        <g ref={spark}>
          <circle r="30" fill={GOLD_HI} opacity="0.2" />
          <circle r="9" fill="#FFF3D6" />
        </g>

        {/* orientação */}
        <g fontFamily="DM Sans, sans-serif" fontSize="26" fill="rgba(232,228,220,0.8)">
          <text x={TOP.x - 120} y={TOP.y + 9} textAnchor="end">cabeça</text>
          <text x={BOTTOM.x - 150} y={BOTTOM.y + 9} textAnchor="end">peito</text>
          <text x={TOP.x - 120} y="428" textAnchor="end" fill={GOLD_HI}>equilíbrio</text>
          <line x1={TOP.x - 108} x2={TOP.x - 60} y1="419" y2="419" stroke={GOLD_HI} strokeWidth="2" strokeOpacity="0.6" />
        </g>

        {/* régua da sua faixa (dado real: altura da nota) */}
        <g>
          <line x1={SCALE_X} x2={SCALE_X} y1={TOP.y} y2={BOTTOM.y} stroke="rgba(232,228,220,0.22)" strokeWidth="3" strokeLinecap="round" />
          {range && (
            <line x1={SCALE_X} x2={SCALE_X} y1={yOf(range.comfortHigh)} y2={yOf(range.comfortLow)} stroke={GOLD_HI} strokeOpacity="0.45" strokeWidth="9" strokeLinecap="round" />
          )}
          <text x={SCALE_X + 26} y={TOP.y + 9} fontFamily="DM Sans, sans-serif" fontSize="22" fill="rgba(232,228,220,0.6)">agudo</text>
          <text x={SCALE_X + 26} y={BOTTOM.y + 9} fontFamily="DM Sans, sans-serif" fontSize="22" fill="rgba(232,228,220,0.6)">grave</text>
          <g ref={mark} opacity="0">
            <circle r="13" fill="#FFF3D6" />
            <circle r="24" fill="none" stroke="#FFF3D6" strokeOpacity="0.45" strokeWidth="2" />
          </g>
        </g>
      </StageSvg>
      {session.status === 'running' && <StageCue>{cfg.cue}</StageCue>}
    </>
  );
}
