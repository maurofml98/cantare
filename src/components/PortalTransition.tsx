import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';

type Aura = { color: string; label: string; symbol: string };

const AURAS: Record<string, Aura> = {
  '/diario': { color: '#2A3A5A', label: 'A SALA DE ENSAIO', symbol: 'III' },
  '/saude': { color: '#C97B3E', label: 'O CORPO', symbol: 'II' },
  '/repertorio': { color: '#E85D3A', label: 'O BAR', symbol: 'V' },
  '/diario/evolucao': { color: '#7A2E3B', label: 'O PALCO', symbol: 'IV' },
  '/home': { color: '#B8955A', label: 'O VESTÍBULO', symbol: 'I' },
};

function auraFor(to: string): Aura {
  const key = Object.keys(AURAS).find((k) => to === k || to.startsWith(k + '/'));
  return key ? AURAS[key] : AURAS['/home'];
}

type Ctx = { enter: (to: string, origin?: { x: number; y: number }) => void };
const PortalCtx = createContext<Ctx | null>(null);
export const usePortal = () => {
  const c = useContext(PortalCtx);
  if (!c) throw new Error('PortalProvider missing');
  return c;
};

export function PortalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<{ aura: Aura; origin: { x: number; y: number } } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');
  const pendingRef = useRef<string | null>(null);

  const enter = useCallback((to: string, origin?: { x: number; y: number }) => {
    if (phase !== 'idle') return;
    pendingRef.current = to;
    setActive({
      aura: auraFor(to),
      origin: origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    });
    setPhase('in');
  }, [phase]);

  useEffect(() => {
    if (phase === 'in') {
      const t = setTimeout(() => setPhase('hold'), 300);
      return () => clearTimeout(t);
    }
    if (phase === 'hold') {
      const t = setTimeout(() => {
        if (pendingRef.current) navigate({ to: pendingRef.current });
        setPhase('out');
      }, 90);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => {
        setPhase('idle');
        setActive(null);
        pendingRef.current = null;
      }, 320);
      return () => clearTimeout(t);
    }
  }, [phase, navigate]);


  return (
    <PortalCtx.Provider value={{ enter }}>
      {children}
      {active && <PortalOverlay aura={active.aura} origin={active.origin} phase={phase} />}
    </PortalCtx.Provider>
  );
}

function PortalOverlay({
  aura, origin, phase,
}: { aura: Aura; origin: { x: number; y: number }; phase: 'idle' | 'in' | 'hold' | 'out' }) {
  const visible = phase === 'in' || phase === 'hold';
  const fullyIn = phase === 'hold' || phase === 'out';

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none" aria-hidden>
      {/* Ink veil — smooth radial dark fill from click origin */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${origin.x}px ${origin.y}px, #0B0C0F 0%, #07080A 55%, #050507 100%)`,
          opacity: visible ? 1 : 0,
          clipPath: visible
            ? `circle(150% at ${origin.x}px ${origin.y}px)`
            : `circle(0% at ${origin.x}px ${origin.y}px)`,
          WebkitClipPath: visible
            ? `circle(150% at ${origin.x}px ${origin.y}px)`
            : `circle(0% at ${origin.x}px ${origin.y}px)`,
          transitionProperty: 'clip-path, -webkit-clip-path, opacity',
          transitionDuration: '320ms',
          transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      />


      {/* Soft aura glow near origin */}
      <div
        style={{
          position: 'absolute',
          left: origin.x,
          top: origin.y,
          width: 600,
          height: 600,
          marginLeft: -300,
          marginTop: -300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${aura.color}55 0%, ${aura.color}00 60%)`,
          filter: 'blur(40px)',
          opacity: fullyIn ? 0.9 : 0,
          transform: fullyIn ? 'scale(1.2)' : 'scale(0.6)',
          transition: 'opacity 520ms ease-out, transform 700ms ease-out',
        }}
      />

      {/* Thin gold ring pulse */}
      <div
        style={{
          position: 'absolute',
          left: origin.x,
          top: origin.y,
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          borderRadius: '50%',
          border: `1px solid ${aura.color}`,
          opacity: phase === 'in' ? 0 : 0,
          animation: phase === 'in' ? 'portalRing 900ms ease-out forwards' : 'none',
        }}
      />

      {/* World title reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          opacity: fullyIn ? 1 : 0,
          transform: fullyIn ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 420ms ease-out 120ms, transform 520ms cubic-bezier(0.2,0.8,0.2,1) 120ms',
        }}
      >
        <span
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(72px, 11vw, 140px)',
            color: '#E8E4DC',
            letterSpacing: '0.08em',
            lineHeight: 1,
            textShadow: `0 0 60px ${aura.color}88, 0 0 20px #00000088`,
          }}
        >
          {aura.symbol}
        </span>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 400,
            fontSize: 10,
            letterSpacing: '0.5em',
            color: 'rgba(232,228,220,0.55)',
            paddingLeft: '0.5em',
          }}
        >
          {aura.label}
        </span>
      </div>

      <style>{`
        @keyframes portalRing {
          0% { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(28); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/** Convenience: wire an element (Link/card) to trigger the portal. */
export function usePortalNav() {
  const { enter } = usePortal();
  return (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    enter(to, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };
}
