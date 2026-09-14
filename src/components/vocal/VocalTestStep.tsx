import { useEffect, useMemo, useRef, useState } from 'react';
import { detectPitch, freqToNoteLabel } from '@/lib/audio/pitch';

type Instruction = 'confortavel' | 'grave' | 'aguda';

export type CaptureConfidence = 'high' | 'medium' | 'low';

interface Props {
  instruction: Instruction;
  onCaptured: (hz: number, note: string, confidence: CaptureConfidence) => void;
  onCancel?: () => void;
}

const COPY: Record<Instruction, { title: string; hint: string; verb: string }> = {
  confortavel: {
    title: 'Cante um "AAAAH" confortável',
    hint: 'Sustente a nota que você usaria em qualquer música — sem esforço.',
    verb: 'Estabilize a nota',
  },
  grave: {
    title: 'Agora a nota mais grave que conseguir',
    hint: 'Desça devagar até o limite. Precisa ser uma nota sustentável, não um resmungo.',
    verb: 'Segure a nota grave',
  },
  aguda: {
    title: 'E agora a mais aguda que conseguir',
    hint: 'Suba com o "AAAAH". Pode usar voz de peito ou mista — o que sustentar melhor.',
    verb: 'Segure a nota aguda',
  },
};

const TIMEOUT_MS = 15000;
const MIN_HZ = 65;
const MAX_HZ = 1200;

/**
 * Heurística leve contra erro de oitava (2º harmônico).
 * - Etapa "grave": se detectar acima de 260 Hz, tenta a metade (mais provável na região baixa).
 * - Etapa "aguda": se detectar abaixo de 180 Hz, tenta o dobro.
 * - Nunca aceita fora da faixa humana [65, 1200] Hz.
 */
function correctOctave(hz: number, instruction: Instruction): number {
  if (!(hz > 0)) return 0;
  let out = hz;
  if (instruction === 'grave' && out > 260) {
    const half = out / 2;
    if (half >= MIN_HZ) out = half;
  } else if (instruction === 'aguda' && out < 180) {
    const dbl = out * 2;
    if (dbl <= MAX_HZ) out = dbl;
  }
  if (out < MIN_HZ || out > MAX_HZ) return 0;
  return out;
}

export function VocalTestStep({ instruction, onCaptured, onCancel }: Props) {
  const [note, setNote] = useState<string>('—');
  const [hz, setHz] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [samplesCount, setSamplesCount] = useState(0);
  const [spread, setSpread] = useState(0);
  const [pitchAlive, setPitchAlive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [attemptId, setAttemptId] = useState(0);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const samplesRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);
  const lastPitchAtRef = useRef<number>(0);
  const copy = COPY[instruction];

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;
    setTimedOut(false);
    setError(null);
    setProgress(0);
    setNote('—');
    setHz(0);
    setSamplesCount(0);
    setSpread(0);
    setPitchAlive(false);
    samplesRef.current = [];

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new AC();
        // iOS Safari: garantir resume após interação
        try { await ctx.resume(); } catch { /* ignore */ }
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);

        timeoutRef.current = setTimeout(() => {
          if (doneRef.current) return;
          doneRef.current = true;
          setTimedOut(true);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }, TIMEOUT_MS);

        const loop = () => {
          if (doneRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          const raw = detectPitch(buf, ctx.sampleRate);
          const freq = correctOctave(raw, instruction);
          const now = performance.now();
          if (freq > 0) {
            lastPitchAtRef.current = now;
            setPitchAlive(true);
            samplesRef.current.push(freq);
            if (samplesRef.current.length > 90) samplesRef.current.shift();

            const sorted = [...samplesRef.current].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            setHz(median);
            setNote(freqToNoteLabel(median));
            setSamplesCount(sorted.length);

            const centsSpread = 1200 * Math.log2(sorted[sorted.length - 1] / sorted[0]);
            setSpread(centsSpread);
            const stability = Math.max(0, Math.min(1, 1 - centsSpread / 200));
            const fill = Math.min(1, (samplesRef.current.length / 60) * stability);
            setProgress(fill);

            if (samplesRef.current.length >= 60 && centsSpread < 60) {
              doneRef.current = true;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              onCaptured(median, freqToNoteLabel(median), 'high');
              return;
            }
          } else {
            if (now - lastPitchAtRef.current > 400) setPitchAlive(false);
            setProgress((p) => Math.max(0, p - 0.02));
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e: any) {
        setError(e?.message ?? 'Não foi possível acessar o microfone.');
      }
    }
    init();
    return () => {
      cancelled = true;
      doneRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
      samplesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruction, attemptId]);

  const retry = async () => {
    // iOS: se o context ficou suspended (background), tenta retomar antes de reiniciar
    try { await ctxRef.current?.resume(); } catch { /* ignore */ }
    setAttemptId((n) => n + 1);
  };

  const feedback = useMemo(() => {
    if (error || timedOut) return null;
    if (!pitchAlive) return 'Cante de forma contínua…';
    if (samplesCount < 20) return 'Tente manter a nota por mais tempo.';
    if (spread > 120) return 'Cante um pouco mais alto ou aproxime-se do microfone.';
    if (progress > 0.7) return 'Quase lá. Mantenha por mais 1 segundo.';
    return 'Segure a nota…';
  }, [pitchAlive, samplesCount, spread, progress, error, timedOut]);

  return (
    <div className="mx-auto max-w-md text-center">
      <p
        className="text-[10px] uppercase text-[#B8955A]/80"
        style={{ letterSpacing: '0.32em', fontWeight: 400 }}
      >
        {copy.verb}
      </p>
      <h2
        className="mt-2 text-white"
        style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 30, lineHeight: 1.15 }}
      >
        {copy.title}
      </h2>
      <p className="mt-3 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
        {copy.hint}
      </p>

      <div className="relative mx-auto mt-10 h-52 w-52">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" />
          <circle
            cx="50" cy="50" r="46"
            stroke="#B8955A"
            strokeWidth="2"
            fill="none"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 120ms ease-out',
              filter: 'drop-shadow(0 0 6px rgba(232,201,126,0.55))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 56, color: '#fff', lineHeight: 1 }}
          >
            {note}
          </span>
          <span className="mt-1 text-[10px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.28em' }}>
            {hz > 0 ? `${Math.round(hz)} Hz` : 'aguardando voz'}
          </span>
        </div>
      </div>

      {feedback && (
        <p className="mt-6 text-[12px] text-[#8A8A95]" style={{ fontWeight: 300, letterSpacing: '0.02em' }}>
          {feedback}
        </p>
      )}

      {error && (
        <p className="mt-6 text-[13px] text-red-400" style={{ fontWeight: 300 }}>
          {error}
        </p>
      )}

      {timedOut && !error && (
        <>
          <p
            className="mt-6 text-[13px] text-[#E8C97E]"
            style={{ fontWeight: 300, lineHeight: 1.55 }}
          >
            Não conseguimos detectar uma nota estável. Tente cantar um pouco mais alto, com som contínuo, em "AAAAH".
          </p>
          {samplesRef.current.length >= 10 && (
            <button
              onClick={() => {
                const s = [...samplesRef.current].sort((a, b) => a - b);
                const median = s[Math.floor(s.length / 2)];
                const centsSpread = 1200 * Math.log2(s[s.length - 1] / s[0]);
                let confidence: CaptureConfidence;
                if (s.length >= 30 && centsSpread < 120) confidence = 'medium';
                else confidence = 'low';
                if (median < MIN_HZ || median > MAX_HZ) return;
                doneRef.current = true;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                onCaptured(median, freqToNoteLabel(median), confidence);
              }}
              className="mt-4 text-[10px] uppercase text-[#B8955A] hover:text-[#E8C97E] transition-colors"
              style={{ letterSpacing: '0.28em' }}
            >
              Usar melhor valor aproximado →
            </button>
          )}
        </>
      )}

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          onClick={retry}
          className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
          style={{ letterSpacing: '0.28em' }}
        >
          ↺ Tentar de novo
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
            style={{ letterSpacing: '0.28em' }}
          >
            ✕ Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
