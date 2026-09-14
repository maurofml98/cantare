import { useScene } from '../SceneContext';

export function StageLight({ intensityBoost = 1 }: { intensityBoost?: number }) {
  const { intensity, progress, reducedMotion } = useScene();
  const glow = 0.4 + progress * 0.35 + intensity * 0.35 * intensityBoost;
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(50,30,10,0.45) 0%, rgba(7,8,10,0) 65%)',
        }}
      />
      <div
        className={reducedMotion ? '' : 'animate-[stageBreath_9s_ease-in-out_infinite]'}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 55%, rgba(184,149,90,0.22) 0%, transparent 55%)',
          opacity: glow,
          mixBlendMode: 'screen',
          transition: 'opacity 700ms ease-out',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 48%, rgba(232,201,126,0.14) 0%, transparent 30%)',
          opacity: 0.5 + intensity * 0.5,
          mixBlendMode: 'screen',
          transition: 'opacity 200ms ease-out',
        }}
      />
      <style>{`@keyframes stageBreath { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
    </div>
  );
}
