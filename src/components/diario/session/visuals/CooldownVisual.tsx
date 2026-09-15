import { useRef } from 'react';
import { GOLD_HI, INK, StageCue, StageImage, StageSvg, clamp, easeInOut, levelOf, useVisualLoop, wavePath, type VisualProps } from './shared';

/**
 * Desaquecimento — a energia vocal desacelera.
 * A onda começa ampla, rápida e luminosa; com o progresso perde amplitude, velocidade e brilho.
 * No fim fica quase estável. O volume real dá só um leve brilho extra.
 */
export function CooldownVisual({ cfg, session, reduced }: VisualProps) {
  const wave = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const sun = useRef<SVGCircleElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const veil = useRef<SVGRectElement>(null);
  const phase = useRef(0);
  const energy = useRef(0);

  useVisualLoop(session.status, reduced, (_vt, dt) => {
    const started = session.status !== 'idle' && session.status !== 'starting';
    const p = started ? easeInOut(clamp(session.clock.current.elapsed / session.totalMs)) : 0;
    const moving = session.status === 'running' || session.status === 'idle' || session.status === 'starting' ? 1 : 0;
    const speed = (2.4 - 2.0 * p) * moving * (session.status === 'idle' ? 0.5 : 1);
    phase.current += (dt || 0) * speed;
    const lvl = session.status === 'running' ? levelOf(session.live.current.rms) : 0;
    energy.current += (lvl - energy.current) * Math.min(1, (dt || 1) * 3);

    const amp = 150 * (1 - 0.88 * p);
    const y = (x: number) => 540 - amp * Math.exp(-x / 640) * Math.sin((x / 250) * Math.PI - phase.current);
    const d = wavePath(y, 0, 1672, 16);
    wave.current?.setAttribute('d', d);
    glow.current?.setAttribute('d', d);
    const bright = 1 - 0.6 * p + 0.15 * energy.current;
    wave.current?.setAttribute('stroke-opacity', clamp(bright).toFixed(2));
    glow.current?.setAttribute('stroke-opacity', (0.16 * clamp(bright)).toFixed(3));
    sun.current?.setAttribute('opacity', (0.45 - 0.3 * p).toFixed(2));
    const breathe = reduced ? 0 : (Math.sin(phase.current * 0.5) + 1) / 2;
    ring.current?.setAttribute('r', (110 + 30 * breathe * (1 - p)).toFixed(1));
    ring.current?.setAttribute('opacity', (0.35 * (1 - 0.7 * p)).toFixed(2));
    veil.current?.setAttribute('opacity', (0.12 + 0.4 * p).toFixed(3));
  });

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <defs>
          <radialGradient id="cool-sun">
            <stop offset="0%" stopColor={GOLD_HI} stopOpacity="0.7" />
            <stop offset="100%" stopColor={GOLD_HI} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect ref={veil} width="1672" height="941" fill={INK} opacity="0.12" />
        <circle ref={sun} cx="810" cy="480" r="190" fill="url(#cool-sun)" opacity="0.45" />
        <circle ref={ring} cx="810" cy="480" r="110" fill="none" stroke={GOLD_HI} strokeWidth="2" opacity="0.35" />
        <path ref={glow} fill="none" stroke={GOLD_HI} strokeWidth="16" strokeLinecap="round" strokeOpacity="0.16" />
        <path ref={wave} fill="none" stroke="#F6DFA8" strokeWidth="3" strokeLinecap="round" />
      </StageSvg>
      {session.status === 'running' && <StageCue>{cfg.cue}</StageCue>}
    </>
  );
}
