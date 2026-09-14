import { useScene } from '../SceneContext';
import { StageLight, GoldenStrings, VoiceOrb, ParticleBreath, ResonanceHalo } from '../visual-engine';

/**
 * WarmupScene — "Ligar o instrumento vocal".
 * Composição: pedestal circular + orbe dourado central + filamentos verticais
 * de energia + cordas horizontais + halos concêntricos + partículas âmbar.
 */
export function WarmupScene() {
  const { phase, intensity, progress, reducedMotion } = useScene();
  const intro = phase === 'intro' || phase === 'idle';
  const vibra = 0.4 + intensity * 1.4;

  // Filamentos verticais — número + posição fixos
  const filaments = Array.from({ length: 14 }).map((_, i) => {
    const spread = (i - 6.5) * 22; // px do centro
    const delay = (i % 5) * 0.35;
    const height = 260 + (i % 3) * 40;
    return { spread, delay, height, key: i };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight intensityBoost={1.25} />

      {/* Cordas horizontais atravessando a cena */}
      <div className="absolute inset-0" style={{ opacity: 0.7 }}>
        <GoldenStrings count={11} orientation="horizontal" />
      </div>

      {/* Partículas âmbar subindo */}
      <div className="absolute inset-0">
        <ParticleBreath direction="up" density={1.2} />
      </div>

      {/* Filamentos verticais de energia — descem sobre o orbe */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: 400, height: 520 }}>
          {filaments.map(({ spread, delay, height, key }) => {
            const active = progress > key / (filaments.length * 1.4);
            return (
              <span
                key={key}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${spread}px)`,
                  top: '50%',
                  width: 1,
                  height,
                  transform: `translate(-50%, -50%) scaleY(${0.6 + vibra * 0.4})`,
                  transformOrigin: 'center',
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(232,201,126,0.9) 25%, rgba(255,225,170,1) 50%, rgba(232,201,126,0.9) 75%, transparent 100%)',
                  opacity: active ? 0.55 + intensity * 0.45 : 0.12,
                  filter: `drop-shadow(0 0 ${2 + intensity * 6}px rgba(232,201,126,0.9))`,
                  transition:
                    'opacity 700ms ease-out, transform 220ms cubic-bezier(0.22,1,0.36,1)',
                  animation: reducedMotion
                    ? undefined
                    : `fil-flicker 2.6s ease-in-out ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Halos concêntricos + orbe central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute">
            <ResonanceHalo size={520} rings={5} />
          </div>
          <div className="relative">
            <VoiceOrb size={220} />
          </div>
        </div>
      </div>

      {/* Pedestal — base circular no chão da cena */}
      <div className="absolute inset-x-0 flex justify-center pointer-events-none"
           style={{ bottom: '22%' }}>
        <div className="relative" style={{ width: 460, height: 120 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: `${i * 12}px ${i * 40}px`,
                borderRadius: '50%',
                border: '1px solid rgba(184,149,90,0.35)',
                boxShadow: `inset 0 0 ${18 + intensity * 22}px rgba(232,201,126,${0.12 + intensity * 0.2})`,
                opacity: 0.35 + (2 - i) * 0.15,
                transform: `scale(${1 + intensity * 0.03 * (i + 1)})`,
                transition: 'transform 240ms ease-out',
              }}
            />
          ))}
          {/* Pontos de luz no anel externo */}
          {Array.from({ length: 22 }).map((_, i) => {
            const angle = (i / 22) * Math.PI * 2;
            const rx = 220;
            const ry = 50;
            const x = 230 + Math.cos(angle) * rx;
            const y = 60 + Math.sin(angle) * ry;
            return (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 2,
                  height: 2,
                  borderRadius: '50%',
                  background: 'rgba(255,225,170,0.9)',
                  boxShadow: '0 0 4px rgba(232,201,126,0.9)',
                  opacity: 0.5 + Math.sin(i * 0.7 + progress * 6) * 0.3,
                  transition: 'opacity 400ms',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Iris de entrada — abre no início e some */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 0%, transparent 30%, rgba(7,8,10,0.95) 75%)',
          opacity: intro ? 1 : 0,
          transform: intro ? 'scale(1)' : 'scale(1.5)',
          transition:
            'opacity 1200ms cubic-bezier(0.22,1,0.36,1), transform 1600ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      <style>{`
        @keyframes fil-flicker {
          0%, 100% { opacity: var(--f, 0.6); }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
