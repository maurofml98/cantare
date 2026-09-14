import { useScene } from '../SceneContext';

type Props = {
  d: string;
  /** SVG viewBox */
  viewBox?: string;
  /** 0..1 — fraction of the path visible */
  reveal?: number;
  strokeWidth?: number;
  glow?: boolean;
  className?: string;
};

/**
 * GoldFilament — a single thin gold line that "ignites" along its path.
 * If `reveal` is omitted, uses scene progress.
 */
export function GoldFilament({
  d,
  viewBox = '0 0 100 100',
  reveal,
  strokeWidth = 0.6,
  glow = true,
  className = '',
}: Props) {
  const { progress, intensity, reducedMotion } = useScene();
  const r = Math.max(0, Math.min(1, reveal ?? progress));
  const shimmer = reducedMotion ? 1 : 1 + intensity * 0.5;

  return (
    <svg
      className={`absolute inset-0 h-full w-full ${className}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="gf-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C97E" />
          <stop offset="50%" stopColor="#B8955A" />
          <stop offset="100%" stopColor="#7A5A2A" />
        </linearGradient>
        {glow && (
          <filter id="gf-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* Base cold trace */}
      <path
        d={d}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Ignited portion */}
      <path
        d={d}
        stroke="url(#gf-grad)"
        strokeWidth={strokeWidth * shimmer}
        strokeLinecap="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1 - r,
          transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1), stroke-width 400ms ease-out',
          filter: glow ? 'url(#gf-glow)' : undefined,
          opacity: 0.4 + r * 0.6,
        }}
      />
    </svg>
  );
}
