import { AmbientGradient } from '../primitives/AmbientGradient';
import { ParticleField } from '../primitives/ParticleField';

/**
 * DefaultScene — atmosfera neutra usada como fallback para exercícios
 * cujas Scenes específicas ainda não foram implementadas.
 */
export function DefaultScene() {
  return (
    <div className="absolute inset-0">
      <AmbientGradient variant="neutral" />
      <div className="absolute inset-0 opacity-60">
        <ParticleField preset="dust" density={0.7} />
      </div>
    </div>
  );
}
