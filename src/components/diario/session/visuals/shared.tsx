import { useEffect, useRef, useState } from 'react';
import type { SessionConfig } from '@/lib/diario/sessions';
import type { Session, SessionStatus } from '../useExerciseSession';

/** Coordenadas dos visuais = pixels da arte original (1672×941). */
export const IMG_W = 1672;
export const IMG_H = 941;

export const GOLD = '#B8955A';
export const GOLD_HI = '#E8C97E';
export const INK = '#07080A';

export interface VisualProps {
  exerciseId: string;
  cfg: SessionConfig;
  session: Session;
  reduced: boolean;
  /** Faixa do Teste Vocal em MIDI (grave, agudo, confortável), se existir. */
  range: { low: number; high: number; comfortLow: number; comfortHigh: number } | null;
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** RMS → 0..1 em escala perceptiva (raiz), com piso de ruído. */
export const levelOf = (rms: number) => clamp(Math.sqrt(Math.max(0, rms - 0.004) / 0.22));

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Laço de desenho do visual. O "tempo visual" anda devagar antes de começar, normal durante
 * o exercício, congela na pausa e desacelera até parar na conclusão.
 * Com reduced-motion não há laço: desenha só quando os dados mudam (≈8×/s).
 */
export function useVisualLoop(status: SessionStatus, reduced: boolean, draw: (vt: number, dt: number) => void) {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (reduced) return;
    let id = 0;
    let last = performance.now();
    let vt = 0;
    let spd = 0.45;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = statusRef.current;
      const target = s === 'running' ? 1 : s === 'paused' ? 0 : s === 'done' ? 0 : 0.45;
      spd += (target - spd) * Math.min(1, dt * (s === 'paused' ? 12 : s === 'done' ? 1.4 : 3));
      vt += dt * spd;
      drawRef.current(vt, dt);
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  useEffect(() => {
    if (reduced) drawRef.current(0, 0);
  });
}

export function StageImage({ cfg, className = '', style }: { cfg: SessionConfig; className?: string; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Com SSR a imagem pode terminar de carregar antes da hidratação (onLoad não dispara).
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <img
      ref={ref}
      src={`${cfg.image}-960.webp`}
      srcSet={`${cfg.image}-960.webp 960w, ${cfg.image}-1600.webp 1600w`}
      sizes="(max-width: 1024px) 100vw, 58vw"
      alt=""
      aria-hidden
      decoding="async"
      fetchPriority="high"
      onLoad={() => setLoaded(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ objectPosition: cfg.align === 'left' ? '0% 50%' : '50% 50%', ...style }}
    />
  );
}

/** SVG no mesmo recorte da imagem (object-fit: cover ↔ preserveAspectRatio slice). */
export function StageSvg({ cfg, children, className = '' }: { cfg: SessionConfig; children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${IMG_W} ${IMG_H}`}
      preserveAspectRatio={cfg.align === 'left' ? 'xMinYMid slice' : 'xMidYMid slice'}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Frase curta sobre o palco (instrução do momento). */
export function StageCue({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-[7%] flex justify-center px-6 text-center ${className}`}>
      <p className="rounded-full px-4 py-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(232,228,220,0.86)', background: 'rgba(7,8,10,0.55)', border: '1px solid rgba(232,228,220,0.08)' }}>
        {children}
      </p>
    </div>
  );
}

/** Linha polyline "M x y L x y ..." a partir de uma função y(x). */
export function wavePath(fn: (x: number) => number, x0 = 0, x1 = IMG_W, step = 18) {
  let d = '';
  for (let x = x0; x <= x1 + 0.1; x += step) d += `${d ? 'L' : 'M'}${x.toFixed(0)} ${fn(x).toFixed(1)}`;
  return d;
}
