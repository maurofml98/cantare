import { StageLight, VoiceOrb, ResonanceHalo, ParticleBreath } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * MixedVoiceScene — "encontro entre peito e cabeça".
 * Dois fluxos luminosos (base sobe / topo desce) que se encontram no centro,
 * halo dourado no ponto de equilíbrio.
 */
export function MixedVoiceScene() {
  const { intensity, progress, reducedMotion } = useScene();
  const merge = Math.min(1, 0.3 + progress * 0.5 + intensity * 0.4);

  const flow = (from: 'top' | 'bottom'): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    width: 160 + intensity * 60,
    height: '55%',
    marginLeft: -(80 + intensity * 30),
    background:
      from === 'top'
        ? 'linear-gradient(to bottom, rgba(232,201,126,0.55), rgba(232,201,126,0.05) 90%)'
        : 'linear-gradient(to top, rgba(184,149,90,0.55), rgba(184,149,90,0.05) 90%)',
    filter: `blur(${18 - merge * 10}px)`,
    opacity: 0.5 + merge * 0.4,
    borderRadius: '50%',
    top: from === 'top' ? `${-6 + merge * 10}%` : undefined,
    bottom: from === 'bottom' ? `${-6 + merge * 10}%` : undefined,
    transition: reducedMotion ? undefined : 'all 900ms cubic-bezier(0.4,0,0.2,1)',
    mixBlendMode: 'screen',
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight />
      <ParticleBreath direction="drift" density={0.55} />

      <div className="absolute inset-0">
        <span style={flow('top')} />
        <span style={flow('bottom')} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute">
            <ResonanceHalo size={280 + merge * 80} />
          </div>
          <VoiceOrb size={220 + merge * 40} amount={merge} />
        </div>
      </div>
    </div>
  );
}
