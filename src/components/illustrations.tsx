import { CSSProperties } from 'react';

type IllustrationProps = {
  className?: string;
  style?: CSSProperties;
  size?: number;
};

/* ILLUSTRATION 1 — Corpo Vocal */
export function VocalBody({ className, style, size = 300, activeRegion }: IllustrationProps & { activeRegion?: 'head' | 'mask' | 'chest' }) {
  const dim = (region: string) => (activeRegion === region ? 1 : 0.55);
  return (
    <svg
      viewBox="0 0 200 400"
      width={size}
      height={size * 2}
      className={className}
      style={style}
      fill="none"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <ellipse cx="100" cy="50" rx="28" ry="34" />
      {/* Neck */}
      <path d="M88 82 L88 100 M112 82 L112 100" />
      {/* Shoulders / torso */}
      <path d="M50 115 Q100 100 150 115 L145 240 Q100 250 55 240 Z" />
      {/* Arms */}
      <path d="M50 118 L38 220 L44 280" />
      <path d="M150 118 L162 220 L156 280" />
      {/* Internal resonance flow lines */}
      <path d="M100 90 Q95 120 100 150 Q108 180 100 220 Q94 260 100 300" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8" />
      <path d="M85 130 Q100 160 115 130" stroke="rgba(255,255,255,0.08)" />
      <path d="M80 190 Q100 220 120 190" stroke="rgba(255,255,255,0.08)" />
      {/* Legs (subtle) */}
      <path d="M78 250 L72 380 M122 250 L128 380" />

      {/* Resonance points — gold */}
      <circle cx="100" cy="40" r="4" fill="#B8955A" opacity={dim('head')}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="72" r="3" fill="#B8955A" opacity={dim('mask')}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="170" r="4" fill="#B8955A" opacity={dim('chest')}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ILLUSTRATION 2 — Microfone Conceitual */
export function VintageMic({ className, style, size = 200 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="1"
      strokeLinecap="round"
    >
      {/* Sound waves */}
      <path d="M20 100 Q30 90 40 100" opacity="0.4" />
      <path d="M10 100 Q25 80 45 100" opacity="0.3" />
      <path d="M160 100 Q170 90 180 100" opacity="0.4" />
      <path d="M155 100 Q175 80 190 100" opacity="0.3" />
      <circle cx="100" cy="100" r="70" strokeDasharray="2 6" opacity="0.15" />
      <circle cx="100" cy="100" r="90" strokeDasharray="2 8" opacity="0.1" />
      {/* Mic body */}
      <rect x="80" y="50" width="40" height="70" rx="20" />
      {/* Grille lines */}
      <line x1="85" y1="65" x2="115" y2="65" />
      <line x1="85" y1="75" x2="115" y2="75" />
      <line x1="85" y1="85" x2="115" y2="85" />
      <line x1="85" y1="95" x2="115" y2="95" />
      {/* Gold capsule */}
      <circle cx="100" cy="80" r="6" fill="#B8955A" opacity="0.7" stroke="none" />
      {/* Stand */}
      <path d="M100 120 L100 160" />
      <path d="M80 160 L120 160" />
      <path d="M100 160 L100 175" />
      <ellipse cx="100" cy="180" rx="30" ry="4" />
    </svg>
  );
}

/* ILLUSTRATION 3 — Onda Sonora */
export function SoundWave({ className, style, size = 400 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 80"
      width={size}
      height={size * 0.2}
      className={className}
      style={style}
      fill="none"
      stroke="rgba(255,255,255,0.15)"
      strokeLinecap="round"
    >
      <path d="M0 40 Q30 20 60 40 T120 40" strokeWidth="0.5" />
      <path d="M120 40 Q150 10 180 40 T240 40" strokeWidth="1.5" />
      <path d="M240 40 Q270 25 300 40 T360 40" strokeWidth="2" />
      <path d="M360 40 Q380 35 400 40" strokeWidth="0.8" />
    </svg>
  );
}

/* ILLUSTRATION 4 — Nota Geométrica (logo) */
export function GeoNote({ className, style, size = 24 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke="#B8955A"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <ellipse cx="8" cy="18" rx="4" ry="3" />
      <line x1="12" y1="17" x2="12" y2="3" />
      <line x1="12" y1="3" x2="20" y2="6" />
    </svg>
  );
}

/* Initial in gold circle (avatar substitute) */
export function InitialAvatar({ initial, size = 36 }: { initial: string; size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 1}
          fill="none"
          stroke="#B8955A"
          strokeWidth="1"
        />
      </svg>
      <span
        className="text-white"
        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: size * 0.5 }}
      >
        {initial}
      </span>
    </div>
  );
}
