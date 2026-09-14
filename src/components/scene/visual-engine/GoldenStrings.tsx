import { useScene } from '../SceneContext';

type Props = {
  count?: number;
  orientation?: 'horizontal' | 'vertical';
  reveal?: number;
  className?: string;
};

export function GoldenStrings({
  count = 7,
  orientation = 'horizontal',
  reveal,
  className = '',
}: Props) {
  const { progress, intensity, reducedMotion } = useScene();
  const r = Math.max(0, Math.min(1, reveal ?? progress));
  const vibra = 0.4 + intensity * 1.2;
  const isH = orientation === 'horizontal';

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="gs-grad" x1="0" y1="0" x2={isH ? '1' : '0'} y2={isH ? '0' : '1'}>
          <stop offset="0%" stopColor="rgba(184,149,90,0)" />
          <stop offset="20%" stopColor="rgba(184,149,90,0.6)" />
          <stop offset="50%" stopColor="rgba(232,201,126,0.95)" />
          <stop offset="80%" stopColor="rgba(184,149,90,0.6)" />
          <stop offset="100%" stopColor="rgba(184,149,90,0)" />
        </linearGradient>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const pos = ((i + 1) / (count + 1)) * 100;
        const activeAt = i / count;
        const on = r >= activeAt;
        const wobble = reducedMotion ? 0 : Math.sin((i + 1) * 1.3) * vibra;
        return (
          <line
            key={i}
            x1={isH ? 4 : pos + wobble * 0.15}
            x2={isH ? 96 : pos - wobble * 0.15}
            y1={isH ? pos + wobble * 0.15 : 4}
            y2={isH ? pos - wobble * 0.15 : 96}
            stroke={on ? 'url(#gs-grad)' : 'rgba(232,228,220,0.12)'}
            strokeWidth={on ? 0.35 : 0.2}
            strokeLinecap="round"
            style={{
              opacity: on ? 0.9 : 0.15,
              transition: 'opacity 700ms ease-out, stroke-width 400ms ease-out',
              filter: on ? `drop-shadow(0 0 ${1.2 + intensity * 2}px rgba(232,201,126,0.7))` : undefined,
            }}
          />
        );
      })}
    </svg>
  );
}
