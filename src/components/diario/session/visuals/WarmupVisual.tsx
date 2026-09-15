import { useRef } from 'react';
import { GOLD_HI, INK, StageCue, StageImage, StageSvg, clamp, easeInOut, levelOf, useVisualLoop, wavePath, type VisualProps } from './shared';

/**
 * Aquecimento Geral — "a voz está acordando".
 * A onda nasce pequena e ganha amplitude com o progresso; o volume real soma um pouco de energia.
 * Pontos de luz percorrem a onda. A imagem clareia conforme o aquecimento avança.
 */
export function WarmupVisual({ cfg, session, reduced }: VisualProps) {
  const main = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const echo = useRef<SVGPathElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const veil = useRef<SVGRectElement>(null);
  const energy = useRef(0);

  useVisualLoop(session.status, reduced, (vt, dt) => {
    const p = easeInOut(clamp(session.clock.current.elapsed / session.totalMs));
    const lvl = session.status === 'running' ? levelOf(session.live.current.rms) : 0;
    energy.current += (lvl - energy.current) * Math.min(1, (dt || 1) * 4);
    const started = session.status !== 'idle' && session.status !== 'starting';
    const amp = (started ? 16 + 104 * p : 12) * (0.8 + 0.45 * energy.current);
    const env = (x: number) => 0.22 + 0.78 * Math.exp(-(((x - 836) / 430) ** 2));
    const y = (x: number, ph = 0, a = amp) => 455 - a * env(x) * Math.cos(((x - 836) / 560) * Math.PI * 2 - vt * 1.3 + ph);
    const d = wavePath((x) => y(x));
    main.current?.setAttribute('d', d);
    glow.current?.setAttribute('d', d);
    echo.current?.setAttribute('d', wavePath((x) => y(x, 0.9, amp * 0.62) + 26));
    dots.current.forEach((c, i) => {
      if (!c) return;
      const x = (vt * 150 + i * 418) % 1672;
      c.setAttribute('cx', x.toFixed(0));
      c.setAttribute('cy', y(x).toFixed(1));
      c.setAttribute('opacity', (env(x) * (started ? 0.35 + 0.65 * p : 0.35)).toFixed(2));
    });
    veil.current?.setAttribute('opacity', (0.42 - 0.3 * p).toFixed(3));
  });

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <rect ref={veil} width="1672" height="941" fill={INK} opacity="0.42" />
        <path ref={glow} fill="none" stroke={GOLD_HI} strokeWidth="14" strokeOpacity="0.12" strokeLinecap="round" />
        <path ref={echo} fill="none" stroke={GOLD_HI} strokeWidth="1.5" strokeOpacity="0.35" />
        <path ref={main} fill="none" stroke={GOLD_HI} strokeWidth="3" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} ref={(el) => { dots.current[i] = el; }} r="6" fill="#FFF1CF" />
        ))}
      </StageSvg>
      {session.status === 'running' && <StageCue>{cfg.cue}</StageCue>}
    </>
  );
}
