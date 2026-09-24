import { useCallback, useEffect, useRef, useState } from 'react';
import { createAnalysis, type Analysis, type AnalysisResult } from '@/lib/audio/detectors';
import { activityDb, calibrate, type Calibration, type Frame } from '@/lib/audio/levels';
import { openMic, type Mic } from '@/lib/audio/mic';
import type { Metric, RunnableExercise } from '@/lib/treinos/exercises';
import { measure } from '@/lib/treinos/progress';

/**
 * Execução (passo 4) do motor de treino: microfone → calibração do ruído da sala → preparo →
 * captura → resultado. Serve qualquer exercício; o que muda é o `metric` da configuração.
 *
 * O microfone e a calibração ficam abertos entre tentativas: "tentar de novo" é imediato.
 */

export type RunPhase =
  | 'idle'
  | 'opening' // pedindo o microfone
  | 'denied'
  | 'error'
  | 'calibrating' // 2 s de silêncio medindo o ruído da sala
  | 'noisy' // ambiente ruim: continuar ou refazer
  | 'inhale' // contagem de preparo
  | 'running'
  | 'done';

export interface RunOutcome {
  analysis: AnalysisResult;
  /** null = nada captado */
  value: number | null;
  /** duração da captura, em segundos */
  durSec: number;
}

const CALIBRATION_SEC = 2;
/** Silêncio depois do último som que encerra a tentativa sozinha. Provisórios. */
const QUIET_TO_STOP: Record<Metric, number> = { longestSec: 0.5, pulseCount: 2, timerSec: 1.5 };
/** Sem nenhum som por este tempo: encerra e avisa. */
const NOTHING_TIMEOUT_SEC = 15;
const MAX_RUN_SEC = 90;

function liveValue(a: Analysis, metric: Metric) {
  // Depois que o som para, mostra o trecho que acabou em vez de voltar a zero.
  if (metric === 'longestSec') return a.sustain?.emitting ? a.sustain.currentSec : (a.sustain?.result().segments.at(-1)?.reduce((s, e) => e - s) ?? 0);
  if (metric === 'pulseCount') return a.pulses?.count ?? 0;
  return a.timer?.result().spanSec ?? 0;
}

export function useTreinoRun(ex: RunnableExercise) {
  const { metric, inhaleSec = 0 } = ex.engine;
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [cal, setCal] = useState<Calibration | null>(null);
  const [live, setLive] = useState({ value: 0, t: 0, emitting: false, inhaleLeft: 0 });
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  const mic = useRef<Mic | null>(null);
  const calRef = useRef<Calibration | null>(null);
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const phaseRef = useRef<RunPhase>('idle');
  const stopRef = useRef<() => void>(() => {});

  const go = (p: RunPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const stopLoop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  /** chama `onFrame` a cada quadro, com o tempo relativo ao início do laço, até ele devolver false */
  const loop = (onFrame: (f: Frame) => boolean, withPitch = false) => {
    stopLoop();
    let t0: number | null = null;
    const tick = () => {
      const m = mic.current;
      if (!m) return;
      const raw = m.read(withPitch);
      t0 ??= raw.t;
      if (onFrame({ ...raw, t: raw.t - t0 })) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const capture = useCallback(() => {
    const c = calRef.current;
    if (!c) return;
    const a = createAnalysis(ex.detect, c);
    go('running');
    let heard = -1; // último instante com som acima do limiar de saída
    let lastUi = -1;
    let now = 0;
    const quiet = QUIET_TO_STOP[metric];
    loop((f) => {
      if (phaseRef.current !== 'running') return false;
      now = f.t;
      a.push(f);
      const act = activityDb(f, c);
      if (act >= c.offDb) heard = f.t;
      const value = liveValue(a, metric);
      const measured = measure(a.result(), metric) !== null;
      if (f.t - lastUi >= 0.1) {
        lastUi = f.t;
        setLive({ value, t: f.t, emitting: act >= c.offDb, inhaleLeft: 0 });
      }
      const finished =
        (measured && heard >= 0 && f.t - heard > quiet) || (!measured && f.t > NOTHING_TIMEOUT_SEC) || f.t > MAX_RUN_SEC;
      if (finished) {
        const analysis = a.result();
        setOutcome({ analysis, value: measure(analysis, metric), durSec: f.t });
        go('done');
        return false;
      }
      return true;
    }, a.needsPitch);
    // encerramento manual
    stopRef.current = () => {
      if (phaseRef.current !== 'running') return;
      stopLoop();
      const analysis = a.result();
      setOutcome({ analysis, value: measure(analysis, metric), durSec: now });
      go('done');
    };
  }, [ex.detect, metric]);

  const prepare = useCallback(() => {
    if (!inhaleSec) return capture();
    go('inhale');
    let left = inhaleSec;
    setLive((l) => ({ ...l, value: 0, t: 0, inhaleLeft: left }));
    timer.current = window.setInterval(() => {
      if (phaseRef.current !== 'inhale') return stopLoop();
      left--;
      if (left > 0) return setLive((l) => ({ ...l, inhaleLeft: left }));
      stopLoop();
      capture();
    }, 1000);
  }, [capture, inhaleSec]);

  const runCalibration = useCallback(() => {
    go('calibrating');
    const frames: Frame[] = [];
    loop((f) => {
      if (phaseRef.current !== 'calibrating') return false;
      frames.push(f);
      if (f.t < CALIBRATION_SEC) return true;
      const c = calibrate(frames);
      calRef.current = c;
      setCal(c);
      if (!c) go('error');
      else if (c.quality !== 'ok') go('noisy');
      else prepare();
      return false;
    });
  }, [prepare]);

  /** Começa uma tentativa: abre o microfone e calibra só na primeira vez. */
  const start = useCallback(async () => {
    if (!['idle', 'done', 'error', 'denied'].includes(phaseRef.current)) return;
    setOutcome(null);
    setLive({ value: 0, t: 0, emitting: false, inhaleLeft: 0 });
    if (!mic.current) {
      go('opening');
      try {
        mic.current = await openMic();
      } catch (e) {
        const name = (e as DOMException)?.name;
        go(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
        return;
      }
      // Saiu da tela durante o pedido de permissão.
      if (phaseRef.current !== 'opening') {
        mic.current?.close();
        mic.current = null;
        return;
      }
    }
    if (!calRef.current) runCalibration();
    else prepare();
  }, [prepare, runCalibration]);

  /** Ambiente ruidoso: seguir mesmo assim. */
  const acceptNoise = useCallback(() => phaseRef.current === 'noisy' && prepare(), [prepare]);

  const recalibrate = useCallback(() => {
    if (!mic.current || phaseRef.current === 'running') return;
    stopLoop();
    runCalibration();
  }, [runCalibration]);

  const stop = useCallback(() => stopRef.current(), []);

  /** Cancela a tentativa em andamento, sem registrar. */
  const cancel = useCallback(() => {
    stopLoop();
    go('idle');
  }, []);

  // Aba escondida no meio da tentativa: cancela (medir respiração sem o usuário vendo não vale).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && ['calibrating', 'inhale', 'running'].includes(phaseRef.current)) cancel();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [cancel]);

  useEffect(
    () => () => {
      phaseRef.current = 'idle';
      stopLoop();
      mic.current?.close();
      mic.current = null;
    },
    [],
  );

  return { phase, cal, live, outcome, start, stop, cancel, acceptNoise, recalibrate };
}

export type TreinoRun = ReturnType<typeof useTreinoRun>;
