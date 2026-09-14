import { useEffect, useRef } from 'react';
import { useScene } from '../SceneContext';

type Direction = 'up' | 'down' | 'in' | 'out' | 'drift';
type Props = { direction?: Direction; density?: number; color?: string };
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number };

export function ParticleBreath({ direction, density = 1, color = '240,210,140' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<P[]>([]);
  const raf = useRef<number | null>(null);
  const { intensity, breathPhase, reducedMotion } = useScene();
  const state = useRef({ direction, density, intensity, breathPhase, color });

  useEffect(() => {
    state.current = { direction, density, intensity, breathPhase, color };
  }, [direction, density, intensity, breathPhase, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastSpawn = 0;
    const tick = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);
      const s = state.current;
      const dir: Direction =
        s.direction ??
        (s.breathPhase === 'inspire' ? 'in' : s.breathPhase === 'expire' ? 'out' : 'drift');

      const rate = reducedMotion ? 260 : 70 / Math.max(0.2, s.density);
      if (t - lastSpawn > rate) {
        lastSpawn = t;
        const spawn = 1 + Math.floor(s.intensity * 2);
        for (let i = 0; i < spawn; i++) {
          const p: P = { x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 2600 + Math.random() * 900, size: 0.7 + Math.random() * 1.1 };
          const j = () => (Math.random() - 0.5) * 0.18;
          if (dir === 'up') { p.x = Math.random() * W; p.y = H + 4; p.vy = -0.5 - Math.random() * 0.4; p.vx = j(); }
          else if (dir === 'down') { p.x = Math.random() * W; p.y = -4; p.vy = 0.5 + Math.random() * 0.4; p.vx = j(); }
          else if (dir === 'in') { p.x = W * (0.3 + Math.random() * 0.4); p.y = -4; p.vy = 0.55 + Math.random() * 0.4; p.vx = j(); }
          else if (dir === 'out') { p.x = W * (0.3 + Math.random() * 0.4); p.y = H * (0.4 + Math.random() * 0.3); p.vy = -0.55 - Math.random() * 0.4; p.vx = j(); }
          else { p.x = Math.random() * W; p.y = Math.random() * H; p.vy = j(); p.vx = j(); }
          particles.current.push(p);
        }
      }

      const alive: P[] = [];
      for (const p of particles.current) {
        p.life += 16;
        if (p.life > p.max) continue;
        p.x += p.vx;
        p.y += p.vy;
        alive.push(p);
        const fade = p.life < 300 ? p.life / 300 : p.life > p.max - 500 ? (p.max - p.life) / 500 : 1;
        const alpha = Math.max(0, Math.min(1, fade)) * (0.5 + s.intensity * 0.35);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color}, ${alpha * 0.15})`;
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      particles.current = alive.length > 260 ? alive.slice(-260) : alive;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden
    />
  );
}
