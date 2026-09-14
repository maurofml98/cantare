import { StageLight, GoldenStrings, FrequencyRibbon, ParticleBreath } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * FlexibilityScene — "voz entre graves e agudos".
 * Estrutura vertical: cordas verticais + ribbon subindo/descendo com o pitch,
 * arcos de alcance ao topo e à base.
 */
export function FlexibilityScene() {
  const { pitchHz, intensity, progress } = useScene();
  // posição vertical do arco (0 grave → 1 agudo). Sem pitch, usa progresso.
  const norm = pitchHz ? Math.max(0, Math.min(1, (Math.log2(pitchHz) - Math.log2(110)) / (Math.log2(660) - Math.log2(110)))) : progress;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight />
      <ParticleBreath direction="drift" density={0.4} />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[min(80%,640px)] aspect-[3/5]">
          <GoldenStrings count={7} orientation="vertical" />

          {/* Arco de alcance — indicador de posição vocal */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: `${(1 - norm) * 80 + 8}%`,
              width: 120 + intensity * 60,
              height: 120 + intensity * 60,
              border: '1px solid rgba(232,201,126,0.5)',
              boxShadow: `0 0 ${20 + intensity * 40}px rgba(232,201,126,${0.25 + intensity * 0.35})`,
              transition: 'top 260ms cubic-bezier(0.4,0,0.2,1), width 200ms, height 200ms',
              marginLeft: -60,
              marginTop: -60,
            }}
          />

          {/* Ribbon vertical (rotacionado) */}
          <div
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <FrequencyRibbon />
          </div>

          {/* Marcadores grave / agudo */}
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.32em] uppercase" style={{ color: 'rgba(232,201,126,0.6)' }}>Agudo</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.32em] uppercase" style={{ color: 'rgba(232,201,126,0.6)' }}>Grave</span>
        </div>
      </div>
    </div>
  );
}
