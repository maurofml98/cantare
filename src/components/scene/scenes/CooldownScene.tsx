import { StageLight, VoiceOrb, ParticleBreath, ResonanceHalo } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * CooldownScene — "desligar o instrumento com cuidado".
 * Orbe menor, partículas descendo, halo se fechando à medida que o progresso avança.
 */
export function CooldownScene() {
  const { progress, intensity } = useScene();
  // Energia decrescente: alta no início, baixa no fim.
  const energy = Math.max(0, 1 - progress * 0.8) + intensity * 0.2;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight intensityBoost={0.5} />
      <ParticleBreath direction="down" density={0.35 + energy * 0.35} color="220,200,160" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{
            transform: `scale(${0.85 + energy * 0.15})`,
            opacity: 0.6 + energy * 0.4,
            transition: 'transform 1400ms ease-out, opacity 1400ms ease-out',
          }}
        >
          <div className="absolute">
            <ResonanceHalo size={260} rings={3} />
          </div>
          <VoiceOrb size={200} amount={energy * 0.6} />
        </div>
      </div>

      {/* Camada fria sutil sobreposta ao longo do progresso */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 60%, transparent 40%, rgba(7,8,10,0.55) 100%)',
          opacity: progress,
          transition: 'opacity 1200ms ease-out',
        }}
      />
    </div>
  );
}
