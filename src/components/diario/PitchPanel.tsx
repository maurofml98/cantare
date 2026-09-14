import { useEffect, useRef } from 'react';
import { noteLabelToMidi } from '@/lib/audio/pitch';

export type PitchTarget = { note: string; duration: number };
export type PitchSample = { t: number; midi: number };

type Props = {
  targets: PitchTarget[];
  currentTime: number; // seconds since start
  currentMidi: number | null;
  history: PitchSample[]; // last ~2s
  currentNoteLabel: string;
  onTarget: boolean;
};

const WINDOW_SECONDS = 6; // seconds visible horizontally

export function PitchPanel({
  targets,
  currentTime,
  currentMidi,
  history,
  currentNoteLabel,
  onTarget,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetMidis = targets.map((t) => noteLabelToMidi(t.note));
  const minMidi = Math.min(...targetMidis, 48) - 3; // C3 = 48
  const maxMidi = Math.max(...targetMidis, 72) + 3; // C5 = 72

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const range = maxMidi - minMidi;
    const yFor = (midi: number) => H - ((midi - minMidi) / range) * H;
    const xFor = (t: number) => ((t - (currentTime - WINDOW_SECONDS / 2)) / WINDOW_SECONDS) * W;

    // Grid lines per semitone
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let m = Math.ceil(minMidi); m <= maxMidi; m++) {
      const y = yFor(m);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Target rectangles
    let acc = 0;
    ctx.fillStyle = 'rgba(201,168,76,0.4)';
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const startT = acc;
      const endT = acc + t.duration;
      acc = endT;
      const x1 = xFor(startT);
      const x2 = xFor(endT);
      if (x2 < 0 || x1 > W) continue;
      const midi = noteLabelToMidi(t.note);
      const y = yFor(midi);
      const h = Math.max(6, H / range - 2);
      roundRect(ctx, x1 + 2, y - h / 2, Math.max(2, x2 - x1 - 4), h, 4);
      ctx.fill();
    }

    // Current time cursor
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const cx = xFor(currentTime);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // History trail
    if (history.length > 1) {
      ctx.strokeStyle = 'rgba(224,92,138,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (const p of history) {
        const x = xFor(p.t);
        const y = yFor(p.midi);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Current dot
    if (currentMidi !== null) {
      ctx.fillStyle = '#E05C8A';
      ctx.beginPath();
      ctx.arc(cx, yFor(currentMidi), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [targets, currentTime, currentMidi, history, minMidi, maxMidi]);

  // Note labels along Y axis (show a subset)
  const labels: { midi: number; label: string }[] = [];
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let m = Math.ceil(minMidi); m <= maxMidi; m++) {
    const name = NOTE_NAMES[((m % 12) + 12) % 12];
    if (name.length === 1) {
      labels.push({ midi: m, label: `${name}${Math.floor(m / 12) - 1}` });
    }
  }

  return (
    <div className="w-full flex gap-3" style={{ height: '38vh' }}>
      {/* Y labels */}
      <div className="relative w-8 h-full">
        {labels.map((l) => {
          const range = maxMidi - minMidi;
          const top = ((maxMidi - l.midi) / range) * 100;
          return (
            <span
              key={l.midi}
              className="absolute left-0 text-[10px] text-[#666677] -translate-y-1/2"
              style={{ top: `${top}%`, fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}
            >
              {l.label}
            </span>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="flex-1 h-full rounded-xl overflow-hidden" style={{ backgroundColor: '#0F0F14' }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Current note indicator */}
      <div className="w-16 h-full flex flex-col items-center justify-center">
        <span
          className="text-[10px] uppercase text-[#666677]"
          style={{ letterSpacing: '0.12em', fontFamily: 'DM Sans, sans-serif' }}
        >
          Nota
        </span>
        <span
          className="mt-1 leading-none"
          style={{
            fontFamily: 'Newsreader, serif',
            fontWeight: 600,
            fontSize: 28,
            color: onTarget ? '#B8955A' : currentMidi !== null ? '#fff' : '#444455',
            transition: 'color 0.15s',
          }}
        >
          {currentNoteLabel}
        </span>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
