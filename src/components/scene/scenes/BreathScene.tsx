import { StageLight, BreathTree, VoiceOrb, ParticleBreath, ResonanceHalo } from '../visual-engine';
import { useScene } from '../SceneContext';

/**
 * BreathScene — "O ar guiando o corpo".
 *
 * Metáfora visual (sem anatomia realista):
 *  - Orbe central = pulmão de luz.
 *  - BreathTree = filamentos ramificando do centro (raízes de ar).
 *  - Anéis concêntricos = ondas do ciclo respiratório.
 *  - Partículas = ar entrando (inspire) / saindo (expire) / suspenso (hold).
 *
 * Reativo, só-leitura, ao SceneContext: breathPhase, breathAmount, intensity.
 */
export function BreathScene() {
  const { breathAmount = 0, breathPhase, breathProgress = 0, intensity, reducedMotion } = useScene();

  const phase = breathPhase ?? 'rest';
  const phaseLabel =
    phase === 'inspire' ? 'Inspire'
    : phase === 'hold' ? 'Sustente'
    : phase === 'expire' ? 'Expire'
    : 'Prepare-se';
  const phaseHint =
    phase === 'inspire' ? 'ar entrando · 4s'
    : phase === 'hold' ? 'suspenso · 4s'
    : phase === 'expire' ? 'liberando · 8s'
    : 'aguarde o próximo ciclo';

  // Ring scales — três anéis expandem no inspire, seguram no hold, contraem no expire.
  const baseScale = 0.7 + breathAmount * 0.6;
  const ringGlow = 0.15 + breathAmount * 0.55 + intensity * 0.15;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <StageLight />

      {/* Partículas — densidade cresce no inspire, congela no hold, dispersa no expire */}
      <ParticleBreath density={phase === 'hold' ? 0.4 : 0.95} />

      {/* Halos concêntricos — respiração como ondas radiais */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => {
          const s = baseScale * (1 + i * 0.28);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 280,
                height: 280,
                border: '1px solid rgba(184,149,90,0.22)',
                transform: `scale(${s})`,
                opacity: (0.35 - i * 0.09) * (0.5 + ringGlow),
                transition: reducedMotion
                  ? undefined
                  : `transform ${phase === 'expire' ? 3200 : phase === 'inspire' ? 3600 : 900}ms cubic-bezier(0.4,0,0.2,1), opacity 700ms ease-out`,
                boxShadow: `0 0 ${20 + ringGlow * 40}px rgba(184,149,90,${0.08 + ringGlow * 0.18}) inset`,
              }}
            />
          );
        })}
      </div>

      {/* Objeto central: orbe + árvore de ar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute">
            <VoiceOrb size={340} amount={breathAmount} idleBreath={false} />
          </div>
          <div
            className="relative"
            style={{
              transform: `scale(${0.94 + breathAmount * 0.1})`,
              transition: 'transform 900ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <BreathTree size={340} />
          </div>
          {phase === 'hold' && (
            <div className="absolute">
              <ResonanceHalo />
            </div>
          )}
        </div>
      </div>

      {/* Cartão de fase — sobreposto discretamente à base da cena */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ bottom: 'clamp(120px, 22vh, 200px)' }}
      >
        <div
          className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl backdrop-blur-md"
          style={{
            background: 'linear-gradient(180deg, rgba(13,13,15,0.55), rgba(13,13,15,0.75))',
            border: '1px solid rgba(184,149,90,0.22)',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)',
            minWidth: 200,
          }}
        >
          <span
            className="text-[10px] tracking-[0.28em] uppercase"
            style={{ color: 'rgba(232,228,220,0.5)', fontFamily: 'DM Sans, sans-serif' }}
          >
            Fase atual
          </span>
          <span
            className="text-[24px] leading-none"
            style={{
              fontFamily: 'Newsreader, serif',
              fontWeight: 300,
              color: '#E8E4DC',
              letterSpacing: '0.02em',
            }}
          >
            {phaseLabel}
          </span>
          <div className="mt-1 h-[2px] w-24 overflow-hidden rounded-full" style={{ background: 'rgba(184,149,90,0.15)' }}>
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, Math.max(0, breathProgress * 100))}%`,
                background: 'linear-gradient(90deg, rgba(232,201,126,0.9), rgba(184,149,90,1))',
                transition: 'width 220ms linear',
                boxShadow: '0 0 10px rgba(232,201,126,0.5)',
              }}
            />
          </div>
          <span
            className="text-[11px] mt-1"
            style={{ color: 'rgba(232,228,220,0.45)', fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
          >
            {phaseHint}
          </span>
        </div>
      </div>

      {/* Vinhetas laterais — profundidade cinematográfica */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-40"
        style={{ background: 'linear-gradient(to right, rgba(7,8,10,0.7), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-40"
        style={{ background: 'linear-gradient(to left, rgba(7,8,10,0.7), transparent)' }}
      />
    </div>
  );
}
