import { StageLight, GoldenStrings, FrequencyRibbon, ParticleBreath } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * CoordinationScene — "voz e ar em sincronia".
 * Linhas horizontais entrando em fase + ribbon central reagindo à intensidade.
 */
export function CoordinationScene() {
  const { intensity, progress, reducedMotion } = useScene();
  const sync = Math.min(1, progress * 0.6 + intensity * 0.6);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight />
      <ParticleBreath direction="drift" density={0.35} />

      {/* Grid técnico sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(184,149,90,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(184,149,90,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 80%)',
        }}
      />

      {/* Cordas horizontais + ribbon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[min(720px,92%)] aspect-[16/7]">
          <GoldenStrings count={9} orientation="horizontal" />
          <div
            className="absolute inset-0"
            style={{
              transform: `scaleY(${0.85 + sync * 0.25})`,
              transition: reducedMotion ? undefined : 'transform 800ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <FrequencyRibbon />
          </div>
          {/* pontos de sincronização */}
          {[0.2, 0.4, 0.6, 0.8].map((p) => (
            <span
              key={p}
              className="absolute h-1.5 w-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${p * 100}%`,
                top: '50%',
                background: 'rgba(232,201,126,0.9)',
                opacity: 0.35 + sync * 0.65,
                boxShadow: `0 0 ${4 + sync * 12}px rgba(232,201,126,${0.4 + sync * 0.5})`,
                transition: 'opacity 300ms, box-shadow 300ms',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
