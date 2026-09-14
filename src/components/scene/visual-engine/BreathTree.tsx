import { useScene } from '../SceneContext';

export function BreathTree({ size = 420 }: { size?: number }) {
  const { breathAmount = 0, intensity, reducedMotion } = useScene();
  const glow = 0.25 + breathAmount * 0.75 + intensity * 0.15;
  const scale = 0.96 + breathAmount * 0.08;

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      className="pointer-events-none"
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 900ms cubic-bezier(0.4,0,0.2,1)',
        filter: `drop-shadow(0 0 ${6 + glow * 14}px rgba(232,201,126,${glow * 0.6}))`,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id="bt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,201,126,0.95)" />
          <stop offset="60%" stopColor="rgba(184,149,90,0.7)" />
          <stop offset="100%" stopColor="rgba(184,149,90,0.15)" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#bt-grad)"
        strokeLinecap="round"
        strokeWidth={0.6}
        style={{ opacity: glow, transition: 'opacity 700ms ease-out' }}
      >
        <path d="M50 8 L50 62" />
        <path d="M50 30 C 46 34, 38 38, 30 42" />
        <path d="M50 30 C 54 34, 62 38, 70 42" />
        <path d="M50 46 C 44 52, 34 58, 24 66" />
        <path d="M50 46 C 56 52, 66 58, 76 66" />
        <g strokeWidth={0.35} opacity={0.85}>
          <path d="M30 42 C 24 46, 20 52, 18 60" />
          <path d="M70 42 C 76 46, 80 52, 82 60" />
          <path d="M24 66 C 20 74, 18 82, 20 92" />
          <path d="M76 66 C 80 74, 82 82, 80 92" />
          <path d="M50 62 C 46 72, 44 82, 44 96" />
          <path d="M50 62 C 54 72, 56 82, 56 96" />
        </g>
      </g>
      {[[50,30],[30,42],[70,42],[50,46],[24,66],[76,66],[50,62]].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={0.9 + breathAmount * 0.9}
          fill="rgba(255,225,170,0.9)"
          style={{
            opacity: 0.5 + glow * 0.5,
            transition: 'r 500ms ease-out',
            filter: `drop-shadow(0 0 ${2 + breathAmount * 4}px rgba(232,201,126,0.8))`,
            animation: reducedMotion ? undefined : `bt-blink 4s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bt-blink { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </svg>
  );
}
