// Deep ambient background: light orbs, floating particles, geometric lines.
// Purely decorative; pointer-events: none so it never blocks interaction.
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rand = seed / 233280;
  const rand2 = ((i * 7919) % 100) / 100;
  return {
    top: `${(rand * 90 + 5).toFixed(1)}%`,
    left: `${(rand2 * 90 + 5).toFixed(1)}%`,
    size: 2 + ((i * 3) % 3),
    opacity: 0.1 + ((i * 7) % 30) / 100,
    duration: 6 + (i % 9),
  };
});

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orbs */}
      <div
        className="absolute animate-float"
        style={{
          top: '-10%',
          left: '-10%',
          width: 600,
          height: 600,
          background: '#B8955A',
          filter: 'blur(120px)',
          opacity: 0.06,
          borderRadius: '50%',
          animationDuration: '9s',
        }}
      />
      <div
        className="absolute animate-drift"
        style={{
          bottom: '-15%',
          right: '-15%',
          width: 800,
          height: 800,
          background: '#2A3A4A',
          filter: 'blur(120px)',
          opacity: 0.07,
          borderRadius: '50%',
          animationDuration: '14s',
        }}
      />
      <div
        className="absolute animate-float"
        style={{
          top: '35%',
          right: '10%',
          width: 500,
          height: 500,
          background: '#1A2A1A',
          filter: 'blur(120px)',
          opacity: 0.05,
          borderRadius: '50%',
          animationDuration: '11s',
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-drift"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            background: `rgba(184,149,90,${p.opacity})`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Geometric lines */}
      <svg
        className="absolute animate-float"
        style={{ top: '12%', right: '8%', animationDuration: '7s' }}
        width="200" height="200"
      >
        <line x1="0" y1="200" x2="200" y2="0" stroke="rgba(184,149,90,0.06)" strokeWidth="1" />
      </svg>
      <svg
        className="absolute animate-drift"
        style={{ bottom: '18%', left: '6%', animationDuration: '11s' }}
        width="150" height="20"
      >
        <line x1="0" y1="10" x2="150" y2="10" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>
      <svg
        className="absolute animate-float"
        style={{ top: '55%', left: '3%', animationDuration: '9s' }}
        width="20" height="100"
      >
        <line x1="10" y1="0" x2="10" y2="100" stroke="rgba(184,149,90,0.04)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// Small animated sound-wave decorative SVG
export function SoundWaveBars({ bars = 20, width = 80, height = 24 }: { bars?: number; width?: number; height?: number }) {
  const barW = width / (bars * 1.8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <rect
          key={i}
          x={i * (barW * 1.8)}
          y={height / 2}
          width={barW}
          height={height / 2}
          fill="rgba(184,149,90,0.35)"
          style={{
            transformOrigin: `${i * (barW * 1.8) + barW / 2}px ${height / 2}px`,
            animation: `waveBar 1.2s ease-in-out ${(i * 0.08).toFixed(2)}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
