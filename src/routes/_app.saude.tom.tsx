import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { detectPitch } from '@/lib/audio/pitch';

export const Route = createFileRoute('/_app/saude/tom')({
  component: TomPage,
  head: () => ({
    meta: [
      { title: 'Teste de Tom — As Três Cordas · Cantare' },
      { name: 'description', content: 'Teste sua voz nos três registros — grave, médio e agudo — em uma câmara sonora imersiva.' },
    ],
  }),
});

type Register = 'low' | 'mid' | 'high';
const RANGES: Record<Register, { min: number; max: number; label: string; note: string; y: number }> = {
  low:  { min: 100, max: 180, label: 'GRAVE',  note: 'A2–F3', y: 78 },
  mid:  { min: 180, max: 320, label: 'MÉDIO',  note: 'F3–E4', y: 50 },
  high: { min: 320, max: 550, label: 'AGUDO',  note: 'E4–C#5', y: 22 },
};

const CYCLE: Register[] = ['low', 'mid', 'high', 'mid', 'high', 'low'];

function TomPage() {
  const [micReady, setMicReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<Register>('mid');
  const [step, setStep] = useState(0);
  const [freq, setFreq] = useState<number>(0);
  const [hits, setHits] = useState<{ register: Register; ok: boolean }[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'hit' | 'miss'>('idle');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  async function startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      setMicReady(true);
      loop();
    } catch (e: any) {
      setError('Permissão de microfone negada. Autorize e recarregue.');
    }
  }

  function loop() {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const f = detectPitch(buf, ctx.sampleRate);
    if (f > 60 && f < 800) setFreq(f);
    rafRef.current = requestAnimationFrame(loop);
  }

  // Beat loop: prompt a register every 3s
  useEffect(() => {
    if (!running) return;
    const target = CYCLE[step % CYCLE.length];
    setCurrent(target);
    setFeedback('idle');

    // Check window: 1.5s → 2.6s of the beat
    const checkT = setTimeout(() => {
      const range = RANGES[target];
      const ok = freq >= range.min && freq <= range.max;
      setFeedback(ok ? 'hit' : 'miss');
      setHits((h) => [...h, { register: target, ok }]);
    }, 2000);

    const nextT = setTimeout(() => setStep((s) => s + 1), 3000);
    return () => { clearTimeout(checkT); clearTimeout(nextT); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  const targetRange = RANGES[current];
  // Map freq to Y position (log scale between 100Hz - 550Hz)
  const freqY = freq > 0
    ? 90 - Math.max(0, Math.min(1, (Math.log(freq) - Math.log(100)) / (Math.log(550) - Math.log(100)))) * 80
    : 50;

  const totalHits = hits.filter((h) => h.ok).length;
  const done = hits.length >= CYCLE.length;

  return (
    <div className="relative min-h-[80vh] animate-slide-in" style={{ fontFamily: 'DM Sans, sans-serif', color: '#E8E4DC' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(184,149,90,0.7)' }}>II · O CORPO</p>
          <h1 style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 44, marginTop: 6 }}>
            As Três Cordas
          </h1>
          <p style={{ color: 'rgba(232,228,220,0.5)', fontSize: 13, marginTop: 6 }}>
            Cante o registro pedido. A corda vibra quando você acerta o tom.
          </p>
        </div>
        <Link to="/saude" style={{ color: 'rgba(232,228,220,0.4)', fontSize: 12 }}>← Voltar</Link>
      </div>

      {/* Stage */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(201,123,62,0.12), transparent 60%), #0A0B0D',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 460,
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)',
        }}
      >
        {/* Spotlight */}
        <div
          style={{
            position: 'absolute',
            top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 500, height: 400,
            background: 'radial-gradient(ellipse at center top, rgba(232,228,220,0.06), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* SVG: 3 cordas horizontais */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {(['high', 'mid', 'low'] as Register[]).map((reg) => {
            const r = RANGES[reg];
            const isTarget = running && current === reg;
            const stroke = reg === 'low' ? '#B87333' : reg === 'mid' ? '#B8955A' : '#C0C0C0';
            const width = reg === 'low' ? 0.7 : reg === 'mid' ? 0.5 : 0.3;
            return (
              <g key={reg}>
                {/* Label track */}
                <text
                  x="3" y={r.y - 2}
                  fill="rgba(232,228,220,0.35)"
                  style={{ fontFamily: 'DM Sans', fontSize: 1.6, letterSpacing: '0.3em' }}
                >
                  {r.label} · {r.note}
                </text>
                {/* String */}
                <line
                  x1="0" y1={r.y} x2="100" y2={r.y}
                  stroke={stroke}
                  strokeWidth={width}
                  opacity={isTarget ? 1 : 0.35}
                  style={{
                    filter: isTarget ? `drop-shadow(0 0 1px ${stroke}) drop-shadow(0 0 3px ${stroke})` : 'none',
                    transition: 'opacity 0.4s',
                  }}
                />
                {/* Vibration wave when target */}
                {isTarget && (
                  <path
                    d={`M 0 ${r.y} Q 25 ${r.y - 1.5} 50 ${r.y} T 100 ${r.y}`}
                    stroke={stroke} strokeWidth={width * 0.8} fill="none"
                    opacity={0.6}
                    style={{ animation: 'waveBar 0.6s ease-in-out infinite' }}
                  />
                )}
              </g>
            );
          })}

          {/* Voice trail dot */}
          {micReady && freq > 0 && (
            <circle
              cx="80" cy={freqY} r="1.2"
              fill="#E8E4DC"
              style={{ filter: 'drop-shadow(0 0 3px #E8E4DC)', transition: 'cy 90ms linear' }}
            />
          )}
        </svg>

        {/* Center prompt */}
        <div className="absolute inset-x-0 top-8 flex flex-col items-center pointer-events-none">
          {!micReady && !error && (
            <button
              onClick={startMic}
              className="pointer-events-auto"
              style={{
                fontFamily: 'Newsreader, serif', fontWeight: 300,
                fontSize: 20, color: '#E8E4DC',
                border: '1px solid rgba(184,149,90,0.5)',
                padding: '14px 32px', borderRadius: 999,
                background: 'rgba(184,149,90,0.08)',
                letterSpacing: '0.15em',
              }}
            >
              Autorizar microfone
            </button>
          )}
          {error && <p style={{ color: '#E85D3A' }}>{error}</p>}
          {micReady && !running && !done && (
            <button
              onClick={() => { setHits([]); setStep(0); setRunning(true); }}
              className="pointer-events-auto"
              style={{
                fontFamily: 'Newsreader, serif', fontWeight: 300,
                fontSize: 20, color: '#07080A',
                background: '#B8955A',
                padding: '14px 40px', borderRadius: 999,
                letterSpacing: '0.15em',
              }}
            >
              Começar
            </button>
          )}
          {running && (
            <div className="text-center">
              <p style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(232,228,220,0.5)' }}>
                CANTE AGORA
              </p>
              <p
                style={{
                  fontFamily: 'Newsreader, serif', fontWeight: 300,
                  fontSize: 56, marginTop: 4, lineHeight: 1,
                  color: feedback === 'hit' ? '#B8955A' : feedback === 'miss' ? '#E85D3A' : '#E8E4DC',
                  textShadow: feedback === 'hit' ? '0 0 20px #B8955A' : 'none',
                  transition: 'color 0.3s, text-shadow 0.3s',
                }}
              >
                {targetRange.label}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(232,228,220,0.4)', marginTop: 6 }}>
                {targetRange.note} · {freq > 0 ? `${Math.round(freq)} Hz` : '—'}
              </p>
            </div>
          )}
        </div>

        {/* Hit stars */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
          {CYCLE.map((_, i) => {
            const h = hits[i];
            return (
              <span
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: !h ? 'rgba(255,255,255,0.1)' : h.ok ? '#B8955A' : 'rgba(232,93,58,0.5)',
                  boxShadow: h?.ok ? '0 0 10px #B8955A' : 'none',
                  transition: 'all 0.3s',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Result */}
      {done && (
        <div className="mt-10 glass-card p-8 text-center animate-slide-in">
          <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(184,149,90,0.7)' }}>RESULTADO</p>
          <p style={{ fontFamily: 'Newsreader, serif', fontSize: 56, fontWeight: 300, marginTop: 8 }}>
            {totalHits} <span style={{ color: 'rgba(232,228,220,0.3)', fontSize: 32 }}>/ {CYCLE.length}</span>
          </p>
          <p style={{ color: 'rgba(232,228,220,0.5)', fontSize: 13, marginTop: 6 }}>
            {totalHits >= 5 ? 'Domínio impressionante dos três registros.' :
             totalHits >= 3 ? 'Bom controle. Refine seus extremos.' :
             'Aqueça mais e tente de novo — sem pressa.'}
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => { setHits([]); setStep(0); setRunning(true); }}
              style={{
                fontFamily: 'DM Sans', fontSize: 12, letterSpacing: '0.2em',
                border: '1px solid rgba(184,149,90,0.5)', color: '#B8955A',
                padding: '10px 24px', borderRadius: 999,
              }}
            >
              REPETIR
            </button>
            <Link to="/saude"
              style={{
                fontFamily: 'DM Sans', fontSize: 12, letterSpacing: '0.2em',
                background: '#B8955A', color: '#07080A',
                padding: '10px 24px', borderRadius: 999,
              }}
            >
              CONCLUIR
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
