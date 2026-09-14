import { useScene } from './SceneContext';

type Props = {
  onClose?: () => void;
  title: string;
  subtitle?: string;
  progress: number; // 0..1
  bottom?: React.ReactNode;
  overline?: string;
};

/**
 * SceneHUD — consistent floating chrome for every Scene.
 * Top: close, title, progress hairline.
 * Bottom: dock slot (timer, pitch, CTA — anything the exercise needs).
 */
export function SceneHUD({ onClose, title, subtitle, overline, progress, bottom }: Props) {
  const { intensity } = useScene();
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col">
      {/* Top mask — protects HUD text from bright scenes */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-40"
        style={{
          background:
            'linear-gradient(to bottom, rgba(7,8,10,0.85) 0%, rgba(7,8,10,0.4) 60%, transparent 100%)',
        }}
      />
      {/* Top bar */}
      <div className="pointer-events-auto relative flex items-center justify-between px-5 pt-5">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center text-[#B8B8C0] transition-colors hover:text-white"
          aria-label="Sair"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="text-center">
          {overline && (
            <p
              className="text-[10px] uppercase text-[#8A8A95]"
              style={{ letterSpacing: '0.18em', fontWeight: 400 }}
            >
              {overline}
            </p>
          )}
          <p
            className="text-[12px] text-white mt-0.5"
            style={{ letterSpacing: '0.1em', fontWeight: 400 }}
          >
            {title}
          </p>
        </div>
        <div className="w-9 text-right">
          {subtitle && (
            <p className="text-[10px] text-[#666677]" style={{ letterSpacing: '0.08em' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Progress hairline */}
      <div className="relative mt-4 h-[1px] mx-5 bg-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-[#B8955A]"
          style={{
            width: `${pct}%`,
            transition: 'width 900ms ease-out',
            boxShadow: `0 0 ${6 + intensity * 12}px rgba(184,149,90,${0.35 + intensity * 0.4})`,
          }}
        />
      </div>

      {/* Middle spacer — content of the Scene renders behind this via absolute positioning */}
      <div className="flex-1" />

      {/* Bottom dock */}
      {bottom && (
        <>
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-56"
            style={{
              background:
                'linear-gradient(to top, rgba(7,8,10,0.9) 0%, rgba(7,8,10,0.55) 55%, transparent 100%)',
            }}
          />
          <div
            className="pointer-events-auto relative px-6"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto max-w-md">{bottom}</div>
          </div>
        </>
      )}
    </div>
  );
}
