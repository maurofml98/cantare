import { useEffect, useRef } from 'react';
import { useScene } from '../SceneContext';

type Preset = 'embers' | 'mist' | 'dust' | 'sparks';

type P = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; hue: string;
};

const PRESETS: Record<Preset, {
  count: number; hue: string; sizeRange: [number, number];
  driftY: number; driftX: number; life: [number, number]; blend: 'lighter' | 'source-over';
}> = {
  embers: { count: 42, hue: 'rgba(200,150,80,', sizeRange: [0.6, 1.8], driftY: -0.35, driftX: 0.08, life: [3, 7], blend: 'lighter' },
  mist:   { count: 26, hue: 'rgba(220,220,230,', sizeRange: [1.5, 3.5], driftY: -0.1, driftX: 0.05, life: [6, 12], blend: 'source-over' },
  dust:   { count: 55, hue: 'rgba(232,228,220,', sizeRange: [0.4, 1.2], driftY: -0.08, driftX: 0.15, life: [8, 14], blend: 'lighter' },
  sparks: { count: 30, hue: 'rgba(220,180,110,', sizeRange: [0.8, 2.2], driftY: -0.5, driftX: 0.2, life: [1.5, 3.5], blend: 'lighter' },
};

/**
 * ParticleField — canvas 2D particles with intensity- and progress-modulated density.
 * Pauses on document hidden; disabled under reduced-motion.
 */
export function ParticleField({
  preset = 'embers',
  density = 1,
}: { preset?: Preset; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { intensity, progress, reducedMotion } = useScene();
  const intensityRef = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => { intensityRef.current = intensity; }, [intensity]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = PRESETS[preset];
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const total = Math.max(6, Math.round(cfg.count * density));
    const particles: P[] = [];
    const spawn = (initial = false): P => {
      const maxLife = cfg.life[0] + Math.random() * (cfg.life[1] - cfg.life[0]);
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : H + Math.random() * 40,
        vx: (Math.random() - 0.5) * cfg.driftX,
        vy: cfg.driftY * (0.6 + Math.random() * 0.8),
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
        size: cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]),
        hue: cfg.hue,
      };
    };
    for (let i = 0; i < total; i++) particles.push(spawn(true));

    let raf = 0;
    let last = performance.now();
    let running = true;
    const onVis = () => { running = !document.hidden; if (running) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener('visibilitychange', onVis);

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = cfg.blend;

      const boost = 0.6 + progressRef.current * 0.6 + intensityRef.current * 0.5;
      for (const p of particles) {
        p.life += dt;
        p.x += p.vx * 60 * dt * boost;
        p.y += p.vy * 60 * dt * boost;
        if (p.life >= p.maxLife || p.y < -10 || p.x < -20 || p.x > W + 20) {
          Object.assign(p, spawn(false));
          continue;
        }
        const t = p.life / p.maxLife;
        const alpha = Math.sin(Math.PI * t) * (0.35 + intensityRef.current * 0.5);
        ctx.fillStyle = `${p.hue}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [preset, density, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
