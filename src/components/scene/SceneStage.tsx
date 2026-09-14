import { useEffect, useState, type ReactNode } from 'react';
import { SceneContext, type SceneContextValue } from './SceneContext';

type Props = {
  ctx: Omit<SceneContextValue, 'reducedMotion'>;
  children: ReactNode;
  className?: string;
};

/**
 * SceneStage — fullscreen host for a Scene "world".
 * Provides SceneContext + film grain + vignette. Children (Scene + HUD) render on top.
 */
export function SceneStage({ ctx, children, className = '' }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <SceneContext.Provider value={{ ...ctx, reducedMotion }}>
      <div
        className={`fixed inset-0 z-50 overflow-hidden bg-[#07080A] text-white ${className}`}
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        {children}
        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[60]"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 z-[61] mix-blend-overlay opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          }}
        />
      </div>
    </SceneContext.Provider>
  );
}
