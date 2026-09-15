import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch, freqToMidi, noteLabelToMidi } from '@/lib/audio/pitch';
import { markExerciseComplete } from '@/lib/diario/progress';
import { PITCH_TARGETS, type ExerciseData } from '@/lib/diario/exercises';
import type { SessionConfig } from '@/lib/diario/sessions';

export type SessionStatus = 'idle' | 'starting' | 'running' | 'paused' | 'done';
export type MicState = 'off' | 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'unsupported';

/** Leitura ao vivo (atualizada a cada quadro; visuais leem por ref). */
export interface Live {
  /** RMS do sinal (float −1..1), suavizado. Relativo ao microfone, não é dB calibrado. */
  rms: number;
  voiced: boolean;
  midi: number | null;
  hz: number | null;
  targetMidi: number | null;
  targetIndex: number;
  cents: number | null;
  /** Desvio-padrão da altura nos últimos ~1,2 s, em cents. */
  stability: number | null;
  /** Semitons por segundo nos últimos ~0,6 s. */
  slope: number | null;
}

export interface Snapshot extends Live {
  elapsed: number; // ms
  continuity: number | null; // 0..1
  sync: number | null; // 0..1
  accuracy: number | null; // 0..100
  softening: number | null; // razão recente/início (1 = igual)
  hits: number;
  samples: number;
}

/** Abaixo disso é silêncio. Calibrado para captura sem AGC/supressão (CLAUDE.md, seção 9). */
export const VOICE_GATE = 0.012;
const PITCH_EVERY_MS = 80;
const SNAPSHOT_EVERY_MS = 125;

const emptyLive = (): Live => ({ rms: 0, voiced: false, midi: null, hz: null, targetMidi: null, targetIndex: 0, cents: null, stability: null, slope: null });

function targetAt(id: string, sec: number) {
  const seq = PITCH_TARGETS[id];
  if (!seq?.length) return { midi: null, index: 0 };
  const total = seq.reduce((s, t) => s + t.duration, 0);
  // A sequência se repete durante todo o exercício (antes parava após a primeira volta).
  let t = sec % total;
  for (let i = 0; i < seq.length; i++) {
    if (t < seq[i].duration) return { midi: noteLabelToMidi(seq[i].note), index: i };
    t -= seq[i].duration;
  }
  return { midi: noteLabelToMidi(seq[0].note), index: 0 };
}

export function useExerciseSession(ex: ExerciseData, cfg: SessionConfig) {
  const totalMs = ex.duration * 1000;
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [mic, setMic] = useState<MicState>(cfg.mic ? 'idle' : 'off');
  const [snap, setSnap] = useState<Snapshot>(() => ({ ...emptyLive(), elapsed: 0, continuity: null, sync: null, accuracy: null, softening: null, hits: 0, samples: 0 }));

  const statusRef = useRef<SessionStatus>('idle');
  const clock = useRef({ elapsed: 0 });
  const live = useRef<Live>(emptyLive());
  const acc = useRef({ active: 0, voiced: 0, pitched: 0, hits: 0, samples: 0, earlySum: 0, earlyN: 0, recent: 0 });
  const pitchHist = useRef<{ t: number; midi: number }[]>([]);
  const audio = useRef<{ stream: MediaStream; ctx: AudioContext; analyser: AnalyserNode; buf: Float32Array<ArrayBuffer> } | null>(null);
  const raf = useRef<number | null>(null);
  const speed = useRef(1);

  useEffect(() => {
    // Só em desenvolvimento: ?rapido acelera o relógio 20× para testar conclusão.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('rapido')) speed.current = 20;
    if (cfg.mic && !navigator.mediaDevices?.getUserMedia) setMic('unsupported');
    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((p) => { if (cfg.mic && p.state === 'denied') setMic('denied'); })
      .catch(() => {});
  }, [cfg.mic]);

  const setS = (s: SessionStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const releaseAudio = useCallback(() => {
    const a = audio.current;
    audio.current = null;
    a?.stream.getTracks().forEach((t) => t.stop());
    a?.ctx.close().catch(() => {});
  }, []);

  const requestMic = useCallback(async (): Promise<boolean> => {
    if (!cfg.mic) return false;
    if (audio.current) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMic('unsupported');
      return false;
    }
    setMic('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audio.current = { stream, ctx, analyser, buf: new Float32Array(analyser.fftSize) };
      setMic('active');
      return true;
    } catch (err) {
      const name = (err as DOMException)?.name;
      setMic(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      return false;
    }
  }, [cfg.mic]);

  const finish = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    clock.current.elapsed = totalMs;
    const a = acc.current;
    const accuracy = cfg.visual === 'pitch' && a.samples > 0 ? Math.round((a.hits / a.samples) * 100) : null;
    markExerciseComplete(ex.id, accuracy, ex.duration);
    releaseAudio();
    setMic((m) => (m === 'active' ? 'idle' : m));
    live.current = { ...emptyLive() };
    setSnap((s) => ({ ...s, elapsed: totalMs, accuracy, rms: 0, voiced: false, midi: null, cents: null }));
    setS('done');
  }, [cfg.visual, ex.id, ex.duration, releaseAudio, totalMs]);

  /* ---------- laço principal: relógio + áudio + métricas ---------- */
  const loop = useCallback(() => {
    let last = performance.now();
    let lastPitch = 0;
    let lastSnap = 0;
    const tick = (now: number) => {
      if (statusRef.current !== 'running') return;
      // O timestamp do rAF pode ser anterior ao performance.now() da chamada: nunca negativo.
      const dt = Math.max(0, Math.min(250, now - last)) * speed.current;
      last = now;
      clock.current.elapsed = Math.min(totalMs, clock.current.elapsed + dt);
      const sec = clock.current.elapsed / 1000;
      const L = live.current;
      const A = acc.current;
      A.active += dt;

      const tg = targetAt(ex.id, sec);
      L.targetMidi = tg.midi;
      L.targetIndex = tg.index;

      const au = audio.current;
      if (au) {
        au.analyser.getFloatTimeDomainData(au.buf);
        let sum = 0;
        for (let i = 0; i < au.buf.length; i++) sum += au.buf[i] * au.buf[i];
        const rms = Math.sqrt(sum / au.buf.length);
        L.rms = L.rms * 0.8 + rms * 0.2;
        L.voiced = L.rms > VOICE_GATE;
        if (L.voiced) A.voiced += dt;
        A.recent = A.recent * 0.985 + L.rms * 0.015;
        if (sec < 20 && L.voiced) {
          A.earlySum += L.rms;
          A.earlyN++;
        }

        if (cfg.pitch && now - lastPitch > PITCH_EVERY_MS) {
          lastPitch = now;
          const hz = L.voiced ? detectPitch(au.buf, au.ctx.sampleRate) : -1;
          const hist = pitchHist.current;
          if (hz > 0) {
            const midi = freqToMidi(hz);
            L.hz = hz;
            L.midi = midi;
            hist.push({ t: sec, midi });
            while (hist.length && hist[0].t < sec - 1.2) hist.shift();
            if (hist.length >= 5) {
              const mean = hist.reduce((s, p) => s + p.midi, 0) / hist.length;
              L.stability = Math.sqrt(hist.reduce((s, p) => s + (p.midi - mean) ** 2, 0) / hist.length) * 100;
              const recent = hist.filter((p) => p.t >= sec - 0.6);
              L.slope = recent.length >= 3 ? (recent[recent.length - 1].midi - recent[0].midi) / Math.max(0.2, recent[recent.length - 1].t - recent[0].t) : null;
            }
            if (tg.midi !== null) {
              L.cents = (midi - tg.midi) * 100;
              A.samples++;
              if (Math.abs(L.cents) <= 50) A.hits++;
            }
          } else {
            L.hz = null;
            L.midi = null;
            L.cents = null;
            if (hist.length && hist[hist.length - 1].t < sec - 0.4) {
              hist.length = 0;
              L.stability = null;
              L.slope = null;
            }
          }
        }
        if (cfg.pitch && L.voiced && L.midi !== null) A.pitched += dt;
      }

      if (now - lastSnap > SNAPSHOT_EVERY_MS) {
        lastSnap = now;
        const hasAudio = !!audio.current;
        setSnap({
          ...L,
          elapsed: clock.current.elapsed,
          continuity: hasAudio && A.active > 1500 ? Math.min(1, A.voiced / A.active) : null,
          sync: hasAudio && cfg.pitch && A.active > 1500 ? Math.min(1, A.pitched / A.active) : null,
          accuracy: A.samples > 0 ? Math.round((A.hits / A.samples) * 100) : null,
          softening: hasAudio && A.earlyN > 30 && sec > 25 ? A.recent / (A.earlySum / A.earlyN) : null,
          hits: A.hits,
          samples: A.samples,
        });
      }

      if (clock.current.elapsed >= totalMs) {
        finish();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [cfg.pitch, ex.id, finish, totalMs]);

  /* ---------- ações ---------- */
  const start = useCallback(async () => {
    if (statusRef.current !== 'idle') return; // clique duplo
    setS('starting');
    if (cfg.mic) await requestMic();
    await audio.current?.ctx.resume().catch(() => {});
    // Saiu da tela durante o pedido de permissão: não deixa o microfone aberto.
    if ((statusRef.current as SessionStatus) !== 'starting') {
      releaseAudio();
      return;
    }
    setS('running');
    loop();
  }, [cfg.mic, loop, releaseAudio, requestMic]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    audio.current?.ctx.suspend().catch(() => {});
    live.current.voiced = false;
    setSnap((s) => ({ ...s, voiced: false }));
    setS('paused');
  }, []);

  const resume = useCallback(async () => {
    if (statusRef.current !== 'paused') return;
    await audio.current?.ctx.resume().catch(() => {});
    setS('running');
    loop();
  }, [loop]);

  const retryMic = useCallback(async () => {
    const ok = await requestMic();
    if (ok && statusRef.current === 'paused') audio.current?.ctx.suspend().catch(() => {});
  }, [requestMic]);

  const restart = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    clock.current.elapsed = 0;
    live.current = emptyLive();
    acc.current = { active: 0, voiced: 0, pitched: 0, hits: 0, samples: 0, earlySum: 0, earlyN: 0, recent: 0 };
    pitchHist.current = [];
    setSnap({ ...emptyLive(), elapsed: 0, continuity: null, sync: null, accuracy: null, softening: null, hits: 0, samples: 0 });
    setS('idle');
  }, []);

  // Aba escondida durante o exercício: pausa (o relógio não deve correr sem o usuário).
  useEffect(() => {
    const onVis = () => document.visibilityState === 'hidden' && pause();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pause]);

  useEffect(
    () => () => {
      statusRef.current = 'idle';
      if (raf.current) cancelAnimationFrame(raf.current);
      releaseAudio();
    },
    [releaseAudio],
  );

  return { status, mic, snap, totalMs, clock, live, start, pause, resume, restart, retryMic };
}

export type Session = ReturnType<typeof useExerciseSession>;
