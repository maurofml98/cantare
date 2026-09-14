import { useScene } from '../SceneContext';

type Props = { size?: number; amount?: number; idleBreath?: boolean };

export function VoiceOrb({ size = 260, amount, idleBreath = true }: Props) {
  const { intensity, breathAmount, reducedMotion } = useScene();
  const a = amount ?? breathAmount ?? 0;
  const dyn = Math.min(1, a * 0.7 + intensity * 0.6);
  const scale = 0.82 + dyn * 0.28;
  const glow = 0.35 + dyn * 0.65;

  return (
    <div className="pointer-events-none relative" style={{ width: size, height: size }} aria-hidden>
      <div
        className={idleBreath && !reducedMotion ? 'animate-[orbBreath_6.5s_ease-in-out_infinite]' : ''}
        style={{
          position: 'absolute',
          inset: -size * 0.4,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(232,201,126,0.35) 0%, rgba(184,149,90,0.12) 40%, transparent 72%)',
          opacity: 0.35 + dyn * 0.5,
          transform: `scale(${scale})`,
          transition: 'opacity 300ms ease-out, transform 200ms ease-out',
          mixBlendMode: 'screen',
          filter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 45%, rgba(255,225,170,0.9) 0%, rgba(232,201,126,0.55) 30%, rgba(184,149,90,0.18) 55%, transparent 78%)',
          opacity: glow,
          transform: `scale(${scale})`,
          transition: 'opacity 220ms ease-out, transform 160ms ease-out',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(232,201,126,0.35)',
          transform: `scale(${1 + intensity * 0.18})`,
          opacity: 0.15 + intensity * 0.55,
          boxShadow: `inset 0 0 ${20 + intensity * 40}px rgba(232,201,126,${0.15 + intensity * 0.35})`,
          transition: 'opacity 160ms ease-out, transform 140ms ease-out',
          mixBlendMode: 'screen',
        }}
      />
      <style>{`@keyframes orbBreath { 0%,100%{transform:scale(0.96)} 50%{transform:scale(1.04)} }`}</style>
    </div>
  );
}
