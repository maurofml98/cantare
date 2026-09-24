import { useCallback, useEffect, useRef, useState } from 'react';
import { createAnalysis, type Hold } from '@/lib/audio/detectors';
import { calibrate, type Calibration, type Frame } from '@/lib/audio/levels';
import { openMic, type Mic } from '@/lib/audio/mic';
import { APPROX_MIN_SEC, pickHold, STEP_TIMEOUT_SEC, stepDone, type Instruction } from '@/lib/vocal/capture';

/**
 * Microfone do teste vocal: abre uma vez, calibra o ruído da sala uma vez (mesmas regras do
 * motor de treino — contaminada só permite refazer) e captura cada etapa pelo mesmo caminho
 * de altura dos treinos (`mic.ts` → `PitchTracker`).
 */

export type MicPhase = 'idle' | 'opening' | 'denied' | 'error' | 'calibrating' | 'noisy' | 'contaminated' | 'ready';

export interface CaptureLive {
  /** altura agora (MIDI fracionário); null = sem voz com altura */
  midi: number | null;
  /** nota sendo segurada agora */
  current: Hold | null;
  /** a nota que vale até agora nesta etapa */
  best: Hold | null;
}

export type CaptureEnd =
  | { kind: 'done'; hold: Hold }
  /** tempo esgotado; `approx` = melhor nota segurada por menos que o necessário, se houver */
  | { kind: 'timeout'; approx: Hold | null };

const CALIBRATION_SEC = 2;

export function useVocalMic() {
  const [phase, setPhase] = useState<MicPhase>('idle');
  const [cal, setCal] = useState<Calibration | null>(null);
  const mic = useRef<Mic | null>(null);
  const raf = useRef<number | null>(null);
  const phaseRef = useRef<MicPhase>('idle');

  const go = (p: MicPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const stopLoop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  const loop = (onFrame: (f: Frame) => boolean, withPitch: boolean) => {
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

  const runCalibration = useCallback(() => {
    go('calibrating');
    const frames: Frame[] = [];
    loop((f) => {
      if (phaseRef.current !== 'calibrating') return false;
      frames.push(f);
      if (f.t < CALIBRATION_SEC) return true;
      const c = calibrate(frames);
      setCal(c);
      if (!c) go('error');
      else if (c.quality === 'contaminada') go('contaminated');
      else go(c.quality === 'ok' ? 'ready' : 'noisy');
      return false;
    }, false);
  }, []);

  /** Abre o microfone (se preciso) e mede o ruído da sala. */
  const start = useCallback(async () => {
    if (!mic.current) {
      go('opening');
      try {
        mic.current = await openMic();
      } catch (e) {
        const name = (e as DOMException)?.name;
        go(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
        return;
      }
      if (phaseRef.current !== 'opening') {
        mic.current?.close();
        mic.current = null;
        return;
      }
    }
    runCalibration();
  }, [runCalibration]);

  /** Sala ruidosa: seguir mesmo assim (a captura sai com confiança média). */
  const acceptNoise = useCallback(() => phaseRef.current === 'noisy' && go('ready'), []);

  /**
   * Captura uma etapa. `onLive` a cada ~100 ms; `onEnd` uma vez. Devolve a função que cancela.
   */
  const capture = useCallback((ins: Instruction, onLive: (l: CaptureLive) => void, onEnd: (e: CaptureEnd) => void) => {
    const c = cal;
    if (!c || !mic.current) return () => {};
    const a = createAnalysis(['pitch', 'sustain'], c);
    let lastUi = -1;
    let active = true;
    loop((f) => {
      if (!active) return false;
      a.push(f);
      const holds = a.pitch!.allHolds;
      const current = a.pitch!.currentHold;
      const heard = a.sustain!.lastSoundAt;
      const quiet = heard >= 0 ? f.t - heard : f.t;
      if (f.t - lastUi >= 0.1) {
        lastUi = f.t;
        onLive({ midi: a.pitch!.live.midi, current, best: pickHold(ins, holds) });
      }
      if (stepDone(ins, holds, current, quiet)) {
        onEnd({ kind: 'done', hold: pickHold(ins, holds) ?? current! });
        return false;
      }
      if (f.t > STEP_TIMEOUT_SEC) {
        const ok = pickHold(ins, holds);
        onEnd(ok ? { kind: 'done', hold: ok } : { kind: 'timeout', approx: pickHold(ins, holds, APPROX_MIN_SEC) });
        return false;
      }
      return true;
    }, true);
    return () => {
      active = false;
      stopLoop();
    };
  }, [cal]);

  useEffect(
    () => () => {
      phaseRef.current = 'idle';
      stopLoop();
      mic.current?.close();
      mic.current = null;
    },
    [],
  );

  return { phase, cal, start, recalibrate: runCalibration, acceptNoise, capture };
}

export type VocalMic = ReturnType<typeof useVocalMic>;
