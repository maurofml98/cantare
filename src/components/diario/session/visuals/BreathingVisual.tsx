import { useRef } from 'react';
import { BREATH_LABEL, breathAt } from '@/lib/diario/sessions';
import { GOLD_HI, INK, StageImage, StageSvg, easeInOut, useVisualLoop, type VisualProps } from './shared';

const RING_R = 400;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Respiração Profunda — o ciclo respiratório visível.
 * Inspirar: pulmões (imagem) e halo expandem, diafragma desce. Segurar: estável. Expirar: contraem.
 * O anel mostra o andamento da fase atual. Guiado pelo relógio — não mede respiração.
 */
export function BreathingVisual({ cfg, session, reduced }: VisualProps) {
  const img = useRef<HTMLDivElement>(null);
  const halo = useRef<SVGEllipseElement>(null);
  const haloFill = useRef<SVGEllipseElement>(null);
  const diaphragm = useRef<SVGPathElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const breath = cfg.breath!;
  const active = session.status === 'running' || session.status === 'paused';

  useVisualLoop(session.status, reduced, () => {
    const sec = session.clock.current.elapsed / 1000;
    const b = breathAt(breath, sec);
    const on = session.status === 'running' || session.status === 'paused';
    // Movimento reduzido: sem expandir/contrair; a fase segue no texto e no anel.
    const fill = reduced ? 0.5 : on ? easeInOut(b.fill) : session.status === 'done' ? 0 : 0.2;
    if (img.current) img.current.style.transform = `scale(${(1 + 0.04 * fill).toFixed(4)})`;
    halo.current?.setAttribute('rx', (318 + 52 * fill).toFixed(1));
    halo.current?.setAttribute('ry', (292 + 44 * fill).toFixed(1));
    halo.current?.setAttribute('stroke-opacity', (0.18 + 0.5 * fill).toFixed(2));
    haloFill.current?.setAttribute('opacity', (0.08 + 0.32 * fill).toFixed(2));
    const dy = 30 * fill;
    diaphragm.current?.setAttribute('d', `M505 ${648 + dy} Q836 ${452 + dy * 1.6} 1167 ${648 + dy}`);
    diaphragm.current?.setAttribute('stroke-opacity', (0.35 + 0.5 * fill).toFixed(2));
    ring.current?.setAttribute('stroke-dashoffset', (on ? RING_C * (1 - b.phaseT / b.phaseLen) : RING_C).toFixed(1));
  });

  const sec = session.snap.elapsed / 1000;
  const b = breathAt(breath, sec);
  const left = Math.max(1, Math.ceil(b.phaseLen - b.phaseT));

  return (
    <>
      <div ref={img} className="absolute inset-0 will-change-transform" style={{ transformOrigin: '50% 42%' }}>
        <StageImage cfg={cfg} />
      </div>
      <StageSvg cfg={cfg}>
        <defs>
          <radialGradient id="breath-glow">
            <stop offset="0%" stopColor={GOLD_HI} stopOpacity="0.55" />
            <stop offset="100%" stopColor={GOLD_HI} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1672" height="941" fill={INK} opacity="0.18" />
        <ellipse ref={haloFill} cx="836" cy="400" rx="360" ry="320" fill="url(#breath-glow)" opacity="0.1" />
        <ellipse ref={halo} cx="836" cy="400" rx="318" ry="292" fill="none" stroke={GOLD_HI} strokeWidth="2" strokeOpacity="0.2" />
        <path ref={diaphragm} fill="none" stroke="#FFF1CF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" />
        <circle cx="836" cy="420" r={RING_R} fill="none" stroke="rgba(232,228,220,0.1)" strokeWidth="3" />
        <circle
          ref={ring}
          cx="836"
          cy="420"
          r={RING_R}
          fill="none"
          stroke={GOLD_HI}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C}
          transform="rotate(-90 836 420)"
        />
      </StageSvg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center text-center" aria-live="polite">
        {active ? (
          <>
            <p key={b.phase} className="animate-in fade-in duration-300" style={{ fontFamily: "'Newsreader', serif", fontWeight: 300, fontSize: 'clamp(34px, 3.4vw, 56px)', color: '#F3E7CF', lineHeight: 1 }}>
              {BREATH_LABEL[b.phase]}
            </p>
            <p className="mt-1 tabular-nums" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'rgba(232,228,220,0.75)' }}>
              {left} {left === 1 ? 'segundo' : 'segundos'}
            </p>
          </>
        ) : session.status === 'idle' || session.status === 'starting' ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(232,228,220,0.8)' }}>
            Inspire {breath.inhale} s · segure {breath.hold} s · expire {breath.exhale} s
          </p>
        ) : null}
      </div>
    </>
  );
}
