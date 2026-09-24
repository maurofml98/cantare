import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { openMic, type Mic } from '@/lib/audio/mic';
import { activityDb, calibrate, type Calibration, type Frame } from '@/lib/audio/levels';
import { createAnalysis, type Analysis, type AnalysisResult, type DetectMode } from '@/lib/audio/detectors';
import { midiToNote } from '@/lib/audio/pitch';

/**
 * Bancada de teste da detecção com voz real. Fora do layout do app, sem link no menu.
 * Gera um relatório em JSON para colar de volta no desenvolvimento.
 */
export const Route = createFileRoute('/lab/microfone')({
  head: () => ({ meta: [{ title: 'Teste do microfone — Cantare' }, { name: 'robots', content: 'noindex' }] }),
  component: MicLab,
});

const MODES: { id: DetectMode; label: string }[] = [
  { id: 'sustain', label: 'Duração' },
  { id: 'pulses', label: 'Pulsos' },
  { id: 'intensity', label: 'Intensidade' },
  { id: 'pitch', label: 'Altura' },
  { id: 'timer', label: 'Cronômetro' },
];

interface Run {
  mode: DetectMode;
  note: string;
  durSec: number;
  result: AnalysisResult;
  /** atividade (dB acima do ruído) a 20 pontos/s */
  trace: number[];
}

const noteName = (m: number | null) => (m === null ? '—' : `${midiToNote(m).name}${midiToNote(m).octave}`);

function MicLab() {
  const [mic, setMic] = useState<Mic | null>(null);
  const [error, setError] = useState('');
  const [cal, setCal] = useState<Calibration | null>(null);
  const [phase, setPhase] = useState<'idle' | 'calibrating' | 'recording'>('idle');
  const [mode, setMode] = useState<DetectMode>('sustain');
  const [note, setNote] = useState('');
  const [runs, setRuns] = useState<Run[]>([]);
  const [live, setLive] = useState({ act: 0, value: '' });
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState('');

  const raf = useRef<number | null>(null);
  const calFrames = useRef<Frame[]>([]);
  const an = useRef<Analysis | null>(null);
  const rec = useRef({ trace: [] as number[], lastTrace: 0, t0: null as number | null, lastT: 0 });

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    mic?.close();
  }, [mic]);

  const loop = (m: Mic, onFrame: (f: Frame) => boolean) => {
    const tick = () => {
      if (onFrame(m.read(!!an.current?.needsPitch))) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const open = async () => {
    setError('');
    try {
      setMic(await openMic());
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    }
  };

  const runCalibration = () => {
    if (!mic) return;
    calFrames.current = [];
    setPhase('calibrating');
    loop(mic, (f) => {
      calFrames.current.push(f);
      if (f.t - calFrames.current[0].t < 2) return true;
      setCal(calibrate(calFrames.current));
      setPhase('idle');
      return false;
    });
  };

  const startRec = () => {
    if (!mic || !cal) return;
    an.current = createAnalysis([mode], cal);
    rec.current = { trace: [], lastTrace: 0, t0: null, lastT: 0 };
    setPhase('recording');
    let lastUi = 0;
    loop(mic, (raw) => {
      const a = an.current;
      if (!a) return false;
      // raw.t conta desde a abertura do microfone; o teste conta desde o próprio início
      rec.current.t0 ??= raw.t;
      const f = { ...raw, t: raw.t - rec.current.t0 };
      rec.current.lastT = f.t;
      a.push(f);
      const act = activityDb(f, cal);
      if (f.t - rec.current.lastTrace >= 0.05) {
        rec.current.lastTrace = f.t;
        rec.current.trace.push(Math.round(act));
      }
      if (f.t - lastUi > 0.1) {
        lastUi = f.t;
        const value =
          mode === 'sustain' ? `${a.sustain!.currentSec.toFixed(1)} s` :
          mode === 'timer' ? `${a.timer!.result().spanSec.toFixed(1)} s` :
          mode === 'pulses' ? `${a.pulses!.count} pulsos` :
          mode === 'intensity' ? (a.intensity!.currentDb === null ? '—' : `${a.intensity!.currentDb > 0 ? '+' : ''}${a.intensity!.currentDb.toFixed(1)} dB`) :
          `${noteName(a.pitch!.live.midi)}${a.pitch!.live.stableMidi !== null ? ' (estável)' : ''}`;
        setLive({ act, value });
      }
      return true;
    });
  };

  const stopRec = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const a = an.current;
    an.current = null;
    setPhase('idle');
    if (!a) return;
    const trace = rec.current.trace;
    setRuns((r) => [...r, { mode, note, durSec: +rec.current.lastT.toFixed(1), result: a.result(), trace }]);
    setNote('');
  };

  const report = () =>
    JSON.stringify(
      {
        quando: new Date().toISOString(),
        navegador: navigator.userAgent,
        microfone: mic?.label,
        sampleRate: mic?.sampleRate,
        aplicado: mic && {
          autoGainControl: mic.settings.autoGainControl,
          noiseSuppression: mic.settings.noiseSuppression,
          echoCancellation: mic.settings.echoCancellation,
          channelCount: mic.settings.channelCount,
        },
        custoAlturaMs: mic?.pitchCostMs() && +mic.pitchCostMs()!.toFixed(2),
        calibracao: cal && { ...cal, noiseDb: cal.noiseDb.map((d) => Math.round(d)) },
        testes: runs,
      },
      null,
      1,
    );

  const copy = async () => {
    const text = report();
    // Sem permissão de área de transferência (alguns Android): mostra para copiar à mão.
    const ok = await navigator.clipboard?.writeText(text).then(() => true, () => false);
    if (!ok) return setShown(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const btn = 'rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40';
  const onPct = cal ? Math.min(100, (cal.onDb / 40) * 100) : 0;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <h1 className="font-serif text-2xl">Teste do microfone</h1>

        <section className="flex flex-col gap-2">
          <button className={btn} onClick={open} disabled={!!mic}>1. Abrir microfone</button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {mic && (
            <p className="text-xs text-muted-foreground">
              {mic.label || 'microfone'} · {mic.sampleRate} Hz · AGC {String(mic.settings.autoGainControl)} · supressão {String(mic.settings.noiseSuppression)} · eco {String(mic.settings.echoCancellation)}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <button className={btn} onClick={runCalibration} disabled={!mic || phase !== 'idle'}>
            {phase === 'calibrating' ? 'Silêncio… 2 s' : '2. Calibrar (fique em silêncio)'}
          </button>
          {cal && (
            <p className="text-xs text-muted-foreground">
              Sala: <strong className="text-foreground">{cal.quality}</strong> · ruído {cal.noiseLevelDb.toFixed(0)} dBFS · oscilação {cal.noiseSwingDb.toFixed(1)} dB · limiar {cal.onDb.toFixed(1)} dB
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} disabled={phase === 'recording'}
                className={`${btn} ${mode === m.id ? 'border-primary text-primary' : ''}`}>
                {m.label}
              </button>
            ))}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder='O que você vai fazer (ex.: "S por 10 s no relógio")'
            className="rounded-md border border-border bg-transparent px-3 py-2 text-sm" />
          {phase === 'recording' ? (
            <button className={`${btn} border-primary text-primary`} onClick={stopRec}>Parar</button>
          ) : (
            <button className={btn} onClick={startRec} disabled={!cal}>3. Gravar</button>
          )}
          {phase === 'recording' && (
            <div className="flex flex-col gap-2">
              <div className="relative h-3 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, (live.act / 40) * 100))}%` }} />
                <div className="absolute inset-y-0 w-px bg-foreground" style={{ left: `${onPct}%` }} />
              </div>
              <p className="font-serif text-4xl">{live.value}</p>
            </div>
          )}
        </section>

        {runs.length > 0 && (
          <section className="flex flex-col gap-2">
            {runs.map((r, i) => (
              <details key={i} className="rounded-md border border-border p-3 text-xs">
                <summary>{i + 1}. {MODES.find((m) => m.id === r.mode)?.label} · {r.note || 'sem nota'} · {r.durSec} s</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(r.result, (k, v) => (k === 'curve' ? `${v.length} pontos` : v), 1)}</pre>
              </details>
            ))}
            <button className={btn} onClick={copy}>{copied ? 'Copiado' : '4. Copiar relatório'}</button>
            {shown && <textarea readOnly value={shown} rows={8} className="rounded-md border border-border bg-transparent p-2 text-xs" onFocus={(e) => e.target.select()} />}
          </section>
        )}
      </div>
    </main>
  );
}
