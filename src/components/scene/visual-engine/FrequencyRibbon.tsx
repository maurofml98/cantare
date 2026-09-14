import { useEffect, useRef } from 'react';
import { useScene } from '../SceneContext';

type Props = { targetHz?: number | null; hzRange?: [number, number] };

export function FrequencyRibbon({ targetHz = null, hzRange = [110, 660] }: Props) {
  const { pitchHz, intensity, reducedMotion } = useScene();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<{ t: number; y: number; w: number }[]>([]);
  const raf = useRef<number | null>(null);
  const state = useRef({ pitchHz, intensity, targetHz, hzRange });

  useEffect(() => {
    state.current = { pitchHz, intensity, targetHz, hzRange };
  }, [pitchHz, intensity, targetHz, hzRange]);

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

    const start = performance.now();
    const tick = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);
      const { pitchHz: hz, intensity: it, targetHz: tHz, hzRange: rg } = state.current;
      const [lo, hi] = rg;
      const map = (f: number) => {
        const lnF = Math.log(Math.max(lo, Math.min(hi, f)));
        const lnLo = Math.log(lo);
        const lnHi = Math.log(hi);
        return H - ((lnF - lnLo) / (lnHi - lnLo)) * H;
      };

      if (tHz) {
        const y = map(tHz);
        ctx.strokeStyle = 'rgba(232,201,126,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const rel = (t - start) / 1000;
      if (hz && hz > 0) historyRef.current.push({ t: rel, y: map(hz), w: 1.6 + it * 3.5 });
      else historyRef.current.push({ t: rel, y: NaN, w: 0 });
      const cutoff = rel - 6;
      while (historyRef.current.length && historyRef.current[0].t < cutoff) historyRef.current.shift();

      const hist = historyRef.current;
      for (let i = 1; i < hist.length; i++) {
        const a = hist[i - 1];
        const b = hist[i];
        if (isNaN(a.y) || isNaN(b.y)) continue;
        const xa = W - ((rel - a.t) / 6) * W;
        const xb = W - ((rel - b.t) / 6) * W;
        const grad = ctx.createLinearGradient(xa, 0, xb, 0);
        grad.addColorStop(0, 'rgba(184,149,90,0.15)');
        grad.addColorStop(1, 'rgba(232,201,126,0.95)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = b.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xa, a.y);
        ctx.lineTo(xb, b.y);
        ctx.stroke();
      }
      const last = hist[hist.length - 1];
      if (last && !isNaN(last.y)) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,225,170,0.95)';
        ctx.arc(W - 2, last.y, 2.2 + it * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(232,201,126,0.28)';
        ctx.arc(W - 2, last.y, 8 + it * 12, 0, Math.PI * 2);
        ctx.fill();
      }

      raf.current = requestAnimationFrame(tick);
    };
    if (!reducedMotion) raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden
    />
  );
}
