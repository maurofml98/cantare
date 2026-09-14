import { StageLight, FrequencyRibbon } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * PitchScene — Afinação Básica. Painel técnico premium com trilha da voz.
 */
export function PitchScene() {
  const { pitchHz } = useScene();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight intensityBoost={0.6} />

      <div className="absolute inset-0 flex items-center justify-center px-8">
        <div
          className="relative w-full max-w-[860px]"
          style={{
            aspectRatio: '16 / 9',
            background:
              'linear-gradient(180deg, rgba(13,13,15,0.72) 0%, rgba(13,13,15,0.55) 100%)',
            border: '1px solid rgba(184,149,90,0.18)',
            borderRadius: 4,
            boxShadow:
              '0 30px 80px -30px rgba(0,0,0,0.7), inset 0 0 60px rgba(184,149,90,0.05)',
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                x2={100}
                y1={(i / 10) * 100}
                y2={(i / 10) * 100}
                stroke="rgba(232,228,220,0.06)"
                strokeWidth={i === 5 ? 0.25 : 0.12}
              />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={(i / 12) * 100}
                x2={(i / 12) * 100}
                y1={0}
                y2={100}
                stroke="rgba(232,228,220,0.05)"
                strokeWidth={0.1}
              />
            ))}
          </svg>

          <div className="absolute inset-0 p-4">
            <FrequencyRibbon targetHz={null} hzRange={[110, 660]} />
          </div>

          <div
            className="absolute top-3 left-4 text-[10px] text-[#B8955A]"
            style={{ letterSpacing: '0.32em' }}
          >
            PITCH · Hz
          </div>
          <div
            className="absolute top-3 right-4 text-[10px] text-[#8A8A95]"
            style={{ letterSpacing: '0.28em' }}
          >
            {pitchHz ? `${Math.round(pitchHz)} Hz` : '— Hz'}
          </div>
          <div
            className="absolute bottom-3 left-4 text-[9px] text-[#4A4A55]"
            style={{ letterSpacing: '0.28em' }}
          >
            110 — 660 Hz · LOG
          </div>
          <div
            className="absolute bottom-3 right-4 text-[9px] text-[#4A4A55]"
            style={{ letterSpacing: '0.28em' }}
          >
            6.0 s · JANELA
          </div>
        </div>
      </div>
    </div>
  );
}
