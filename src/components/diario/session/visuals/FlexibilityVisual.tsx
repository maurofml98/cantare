import { useRef } from 'react';
import { GOLD_HI, INK, StageCue, StageImage, StageSvg, clamp, easeInOut, lerp, useVisualLoop, type VisualProps } from './shared';

/**
 * Traçado sobre a linha principal da arte, do vale (grave) subindo para o agudo.
 * Fica dentro da faixa central (x 440–1340) que continua visível em qualquer recorte do palco.
 */
const CURVE = 'M500 650 C 620 700, 800 520, 1010 392 C 1140 318, 1240 262, 1330 236';
const Y_LOW = 668;
const Y_HIGH = 226;

/**
 * Flexibilidade Vocal — a voz percorre os registros.
 * O ponto dourado sobe e desce a curva (grave → agudo → grave). O ponto claro é a sua nota,
 * na mesma escala vertical (faixa do Teste Vocal, ou C3–C5 sem teste).
 */
export function FlexibilityVisual({ cfg, session, reduced, range }: VisualProps) {
  const path = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const guide = useRef<SVGGElement>(null);
  const you = useRef<SVGGElement>(null);
  const link = useRef<SVGLineElement>(null);
  const youY = useRef(Y_LOW);

  useVisualLoop(session.status, reduced, (vt, dt) => {
    const el = path.current;
    if (!el) return;
    const len = el.getTotalLength();
    const cycle = cfg.curveCycle ?? 8;
    const started = session.status !== 'idle' && session.status !== 'starting';
    const t = started ? session.clock.current.elapsed / 1000 : vt;
    const u = (t % cycle) / cycle;
    const s = session.status === 'done' ? 0 : easeInOut(u < 0.5 ? u * 2 : (1 - u) * 2);
    const pt = el.getPointAtLength(s * len);
    guide.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    trail.current?.setAttribute('stroke-dasharray', `${(s * len).toFixed(0)} ${len.toFixed(0)}`);

    const L = session.live.current;
    const low = range?.low ?? 48;
    const high = range?.high ?? 72;
    const show = session.status === 'running' && L.midi !== null;
    if (show) {
      const target = lerp(Y_LOW, Y_HIGH, clamp((L.midi! - low) / Math.max(1, high - low)));
      youY.current += (target - youY.current) * (dt ? Math.min(1, dt * 10) : 1);
    }
    you.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${youY.current.toFixed(1)})`);
    you.current?.setAttribute('opacity', show ? '1' : '0');
    const gap = Math.abs(youY.current - pt.y);
    link.current?.setAttribute('y1', pt.y.toFixed(1));
    link.current?.setAttribute('y2', youY.current.toFixed(1));
    link.current?.setAttribute('x1', pt.x.toFixed(1));
    link.current?.setAttribute('x2', pt.x.toFixed(1));
    link.current?.setAttribute('opacity', show ? (0.25 + 0.6 * (1 - clamp(gap / 200))).toFixed(2) : '0');
  });

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <rect width="1672" height="941" fill={INK} opacity="0.3" />
        <path ref={path} d={CURVE} fill="none" stroke="rgba(243,231,207,0.25)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
        <path ref={trail} d={CURVE} fill="none" stroke={GOLD_HI} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.85" />
        <line ref={link} stroke={GOLD_HI} strokeWidth="2" strokeDasharray="4 6" opacity="0" />
        <g ref={guide}>
          <circle r="42" fill={GOLD_HI} opacity="0.16" />
          <circle r="16" fill={GOLD_HI} />
        </g>
        <g ref={you} opacity="0">
          <circle r="11" fill="#FFF7E6" />
          <circle r="20" fill="none" stroke="#FFF7E6" strokeOpacity="0.5" strokeWidth="2" />
        </g>
        <text x="500" y="712" textAnchor="middle" fill="rgba(232,228,220,0.7)" fontSize="26" fontFamily="DM Sans, sans-serif">grave</text>
        <text x="1290" y="196" textAnchor="middle" fill="rgba(232,228,220,0.7)" fontSize="26" fontFamily="DM Sans, sans-serif">agudo</text>
      </StageSvg>
      {session.status === 'running' && <StageCue>{cfg.cue}</StageCue>}
    </>
  );
}
