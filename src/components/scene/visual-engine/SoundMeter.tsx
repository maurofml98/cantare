import { useScene } from '../SceneContext';

export function SoundMeter({
  bars = 22,
  height = 32,
  label,
}: {
  bars?: number;
  height?: number;
  label?: string;
}) {
  const { intensity } = useScene();
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const p = i / (bars - 1);
        const active = intensity > p * 0.9;
        const wobble = 0.35 + Math.abs(Math.sin(i * 0.9)) * 0.4;
        const h = active ? (0.35 + wobble * intensity) * height : height * 0.12;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 2,
              height: h,
              background: active
                ? 'linear-gradient(to top, rgba(184,149,90,0.9), rgba(232,201,126,1))'
                : 'rgba(232,228,220,0.14)',
              boxShadow: active ? '0 0 6px rgba(232,201,126,0.55)' : 'none',
              transition: 'height 90ms ease-out, background 200ms',
              borderRadius: 1,
            }}
          />
        );
      })}
      {label && (
        <span
          className="ml-2 text-[10px] text-[#8A8A95]"
          style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
