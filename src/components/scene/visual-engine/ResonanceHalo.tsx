import { useScene } from '../SceneContext';

export function ResonanceHalo({ size = 320, rings = 4 }: { size?: number; rings?: number }) {
  const { intensity, reducedMotion } = useScene();
  return (
    <div className="pointer-events-none relative" style={{ width: size, height: size }} aria-hidden>
      {Array.from({ length: rings }).map((_, i) => {
        const delay = i * 0.6;
        const base = 0.4 + i * 0.18;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(232,201,126,0.28)',
              transform: `scale(${base + intensity * 0.35})`,
              opacity: reducedMotion ? 0.25 : undefined,
              animation: reducedMotion ? undefined : `haloPulse 3.6s ease-out ${delay}s infinite`,
              boxShadow: `inset 0 0 ${8 + intensity * 20}px rgba(232,201,126,${0.1 + intensity * 0.25})`,
              transition: 'transform 200ms ease-out',
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
      <style>{`@keyframes haloPulse {
        0% { transform: scale(0.5); opacity: 0.55; }
        100% { transform: scale(1.35); opacity: 0; }
      }`}</style>
    </div>
  );
}
