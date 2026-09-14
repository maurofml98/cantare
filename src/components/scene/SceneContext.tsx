import { createContext, useContext } from 'react';

export type ScenePhase = 'idle' | 'intro' | 'active' | 'peak' | 'outro';
export type BreathPhase = 'inspire' | 'hold' | 'expire' | 'rest';

export type SceneContextValue = {
  phase: ScenePhase;
  progress: number; // 0..1
  intensity: number; // 0..1 mic RMS
  pitchHz: number | null;
  accuracy: number; // 0..1
  reducedMotion: boolean;
  /** Optional breath cycle info (populated by respiratory exercises). */
  breathPhase?: BreathPhase;
  /** 0..1 progress within the current breath phase. */
  breathProgress?: number;
  /** 0..1 continuous inflation of the lungs (eases across phases). */
  breathAmount?: number;
};

export const SceneContext = createContext<SceneContextValue>({
  phase: 'idle',
  progress: 0,
  intensity: 0,
  pitchHz: null,
  accuracy: 0,
  reducedMotion: false,
});

export const useScene = () => useContext(SceneContext);
