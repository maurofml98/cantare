import { useScene } from '../SceneContext';

type Variant = 'warm' | 'cool' | 'neutral';

const PALETTES: Record<Variant, { core: string; halo: string; deep: string }> = {
  warm: { core: 'rgba(200,140,60,0.35)', halo: 'rgba(184,149,90,0.18)', deep: 'rgba(80,45,15,0.35)' },
  cool: { core: 'rgba(120,150,180,0.22)', halo: 'rgba(90,110,140,0.14)', deep: 'rgba(20,30,45,0.35)' },
  neutral: { core: 'rgba(184,149,90,0.14)', halo: 'rgba(232,228,220,0.06)', deep: 'rgba(15,15,20,0.4)' },
};

/**
 * AmbientGradient — radial light that breathes with `phase` and swells with `intensity`.
 * Fully CSS; respects reduced-motion.
 */
export function AmbientGradient({ variant = 'warm' }: { variant?: Variant }) {
  const { intensity, progress, reducedMotion } = useScene();
  const p = PALETTES[variant];
  const swell = 0.6 + progress * 0.4 + intensity * 0.3;
  const scale = 1 + intensity * 0.08;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Deep base */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 60%, ${p.deep} 0%, transparent 60%)`,
        }}
      />
      {/* Halo */}
      <div
        className={reducedMotion ? '' : 'animate-[sceneBreath_7s_ease-in-out_infinite]'}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 55%, ${p.halo} 0%, transparent 55%)`,
          opacity: swell,
          transform: `scale(${scale})`,
          transition: 'opacity 800ms ease-out, transform 400ms ease-out',
        }}
      />
      {/* Core light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${p.core} 0%, transparent 35%)`,
          opacity: 0.35 + progress * 0.5 + intensity * 0.15,
          transition: 'opacity 600ms ease-out',
          mixBlendMode: 'screen',
        }}
      />
      <style>{`@keyframes sceneBreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
    </div>
  );
}
