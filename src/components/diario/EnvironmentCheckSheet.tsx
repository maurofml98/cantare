import { useEffect, useRef, useState } from 'react';

type Step = 0 | 1 | 2;

type Props = {
  open: boolean;
  onDismiss: () => void;
  onComplete: () => void;
};

export function EnvironmentCheckSheet({ open, onDismiss, onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [noiseResult, setNoiseResult] = useState<'idle' | 'testing' | 'ok' | 'high'>('idle');
  const [headphones, setHeadphones] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setMicGranted(null);
      setNoiseLevel(0);
      setNoiseResult('idle');
      setHeadphones(false);
      cleanupAudio();
    }
  }, [open]);

  useEffect(() => () => cleanupAudio(), []);

  function cleanupAudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
  }

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      setMicGranted(true);
      setStep(1);
      runNoiseTest();
    } catch {
      setMicGranted(false);
    }
  };

  const skipMic = () => {
    setMicGranted(false);
    setStep(2);
  };

  const runNoiseTest = () => {
    if (!analyserRef.current) return;
    setNoiseResult('testing');
    setNoiseLevel(0);
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
    const start = performance.now();
    let peak = 0;
    let samples = 0;
    let sumRms = 0;

    const loop = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const level = Math.min(1, rms * 4);
      setNoiseLevel(level);
      peak = Math.max(peak, level);
      sumRms += rms;
      samples++;

      const elapsed = performance.now() - start;
      if (elapsed < 3000) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        const avg = sumRms / Math.max(1, samples);
        setNoiseResult(avg > 0.08 || peak > 0.35 ? 'high' : 'ok');
        if (avg <= 0.08 && peak <= 0.35) {
          setTimeout(() => setStep(2), 700);
        }
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const dots = [0, 1, 2];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(3,4,6,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className="w-full max-w-lg lg:max-w-xl animate-in slide-in-from-bottom lg:slide-in-from-bottom-2 lg:zoom-in-95 duration-300 relative overflow-hidden rounded-t-[28px] lg:rounded-[28px] lg:mx-6"
        style={{
          background: 'linear-gradient(180deg, #14141A 0%, #0C0D11 100%)',
          fontFamily: 'DM Sans, sans-serif',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,149,90,0.08)',
        }}

      >
        {/* subtle top hairline in gold */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#B8955A]/40 to-transparent" />

        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Eyebrow */}
        <p
          className="text-center text-[10px] uppercase text-[#B8955A]/80 pt-5 lg:pt-8"
          style={{ letterSpacing: '0.28em', fontFamily: 'DM Sans, sans-serif' }}
        >
          Antes de começar
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {dots.map((d) => (
            <div
              key={d}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: d === step ? 24 : 6,
                backgroundColor: d === step ? '#B8955A' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>


        <div className="px-6 pt-8 min-h-[340px] overflow-hidden relative">
          {/* Step 1 — Mic */}
          {step === 0 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div
                className="mx-auto mb-6 flex items-center justify-center"
                style={{ width: 64, height: 64 }}
              >
                <span style={{ color: '#B8955A', fontSize: 40 }}>◎</span>
              </div>
              <h2
                className="text-white"
                style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 24 }}
              >
                Precisamos do microfone
              </h2>
              <p className="text-[13px] text-[#888899] mt-3 max-w-xs mx-auto" style={{ fontWeight: 300 }}>
                Para analisar sua voz em tempo real durante os exercícios.
              </p>
              {micGranted === false && (
                <p className="text-[12px] text-red-400/80 mt-3" style={{ fontWeight: 300 }}>
                  Acesso negado. Ajuste as permissões do navegador.
                </p>
              )}
              <div className="mt-10 space-y-3">
                <button
                  onClick={requestMic}
                  className="w-full h-13 py-4 rounded-2xl text-[#07080A] transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#B8955A', fontSize: 14, fontWeight: 500, letterSpacing: '0.12em' }}
                >
                  PERMITIR ACESSO
                </button>
                <button
                  onClick={skipMic}
                  className="w-full text-[12px] text-[#666677] hover:text-white transition-colors py-2"
                  style={{ fontWeight: 300 }}
                >
                  Continuar sem microfone
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Noise */}
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <h2
                className="text-white"
                style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 24 }}
              >
                {noiseResult === 'ok'
                  ? 'Ambiente silencioso'
                  : noiseResult === 'high'
                    ? 'Muito ruído de fundo'
                    : 'Verificando ambiente...'}
              </h2>
              <p className="text-[13px] text-[#888899] mt-3" style={{ fontWeight: 300 }}>
                {noiseResult === 'high'
                  ? 'Detectamos ruído alto. Tente um local mais silencioso.'
                  : 'Fique em silêncio por 3 segundos.'}
              </p>

              {/* Noise bar */}
              <div className="mt-10 mx-auto max-w-xs">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-100"
                    style={{
                      width: `${Math.min(100, noiseLevel * 140)}%`,
                      backgroundColor:
                        noiseResult === 'high'
                          ? '#E27D5F'
                          : noiseResult === 'ok'
                            ? '#7BC49A'
                            : '#B8955A',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-[#555566] uppercase" style={{ letterSpacing: '0.1em' }}>
                  <span>Silêncio</span>
                  <span>Ruído</span>
                </div>
              </div>

              {noiseResult === 'ok' && (
                <p className="text-[13px] mt-8" style={{ color: '#7BC49A', fontWeight: 300 }}>
                  ✓ Ambiente pronto
                </p>
              )}

              {noiseResult === 'high' && (
                <div className="mt-10 space-y-3">
                  <button
                    onClick={runNoiseTest}
                    className="w-full py-4 rounded-2xl text-[#07080A] transition-all active:scale-[0.98]"
                    style={{ backgroundColor: '#B8955A', fontSize: 14, fontWeight: 500, letterSpacing: '0.12em' }}
                  >
                    TESTAR NOVAMENTE
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full text-[12px] text-[#666677] hover:text-white transition-colors py-2"
                    style={{ fontWeight: 300 }}
                  >
                    Continuar mesmo assim
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Headphones */}
          {step === 2 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mx-auto mb-6" style={{ color: '#B8955A', fontSize: 40 }}>
                ◈
              </div>
              <h2
                className="text-white"
                style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 24 }}
              >
                Fone de ouvido
              </h2>
              <p className="text-[13px] text-[#888899] mt-3 max-w-xs mx-auto" style={{ fontWeight: 300 }}>
                Fone de ouvido melhora muito a precisão da análise vocal.
              </p>

              <label
                className="mt-8 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                style={{ backgroundColor: '#0D0F12' }}
              >
                <input
                  type="checkbox"
                  checked={headphones}
                  onChange={(e) => setHeadphones(e.target.checked)}
                  className="sr-only peer"
                />
                <span
                  className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: headphones ? '#B8955A' : 'rgba(255,255,255,0.2)',
                    backgroundColor: headphones ? '#B8955A' : 'transparent',
                    color: '#07080A',
                    fontSize: 12,
                  }}
                >
                  {headphones ? '✓' : ''}
                </span>
                <span className="text-[13px] text-white text-left" style={{ fontWeight: 300 }}>
                  Estou usando fone de ouvido
                </span>
              </label>

              <div className="mt-8 space-y-3">
                <button
                  onClick={onComplete}
                  className="w-full py-4 rounded-2xl text-[#07080A] transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#B8955A', fontSize: 14, fontWeight: 500, letterSpacing: '0.12em' }}
                >
                  INICIAR TREINO
                </button>
                <button
                  onClick={onDismiss}
                  className="w-full text-[12px] text-[#666677] hover:text-white transition-colors py-2"
                  style={{ fontWeight: 300 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
