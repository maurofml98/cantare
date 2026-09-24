import { freqToMidi, freqToNoteLabel, noteLabelToMidi } from '@/lib/audio/pitch';
import { DETECTOR_VERSION } from '@/lib/audio/detectors';
import { midiOfKeyPeak, transposeKey } from '@/lib/music/keys';

export type VoiceType =
  | 'Baixo' | 'Barítono' | 'Tenor'
  | 'Contralto' | 'Mezzo-Soprano' | 'Soprano';

export type Confidence = 'high' | 'medium' | 'low';

export interface VocalProfile {
  lowestNote: string;
  highestNote: string;
  lowestHz: number;
  highestHz: number;
  comfortableLow: string;
  comfortableHigh: string;
  comfortableLowHz: number;
  comfortableHighHz: number;
  rangeSemitones: number;
  voiceType: VoiceType;
  recommendedExercises: number[];
  createdAt: string;
  version: 2;

  // v2 additions (optional to preserve back-compat when loading v1)
  confidence?: Confidence;
  voiceTypeConfidence?: 'estimated';
  comfortHz?: number;
  comfortNote?: string;
  /**
   * Versão do detector que mediu (`DETECTOR_VERSION`). Ausente = captura antiga (até
   * 24/09/2026): registrava a primeira nota estável, não o limite, e cortava pela metade
   * graves acima de 260 Hz. A tela pede para refazer.
   */
  detector?: number;
}

/** Perfil medido antes da captura atual do teste vocal — pedir para refazer. */
export const isLegacyProfile = (p: VocalProfile) => (p.detector ?? 0) < 3;

const STORAGE_KEY = 'cantare:vocal-profile';

export function loadVocalProfile(): VocalProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    // aceita v1 e v2
    if (parsed.version === 1 || parsed.version === 2) return parsed as VocalProfile;
    return null;
  } catch {
    return null;
  }
}

export function saveVocalProfile(profile: VocalProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearVocalProfile() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Classifica com base na nota mais grave (aproximada). MVP. */
export function classifyVoice(lowestMidi: number, highestMidi: number): VoiceType {
  const highBoost = highestMidi >= 79 ? 1 : 0;
  const effective = lowestMidi + highBoost;
  if (effective <= 40) return 'Baixo';
  if (effective <= 45) return 'Barítono';
  if (effective <= 50) return 'Tenor';
  if (effective <= 54) return 'Contralto';
  if (effective <= 58) return 'Mezzo-Soprano';
  return 'Soprano';
}

const midiToLabel = (m: number) => freqToNoteLabel(440 * Math.pow(2, (m - 69) / 12));
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Combina 3 confianças em uma resultante (menor manda). */
export function combineConfidence(a: Confidence, b: Confidence, c?: Confidence): Confidence {
  const rank: Record<Confidence, number> = { high: 2, medium: 1, low: 0 };
  const list = c ? [a, b, c] : [a, b];
  const worst = list.reduce((min, cur) => (rank[cur] < rank[min] ? cur : min), 'high' as Confidence);
  return worst;
}

export interface BuildOpts {
  comfortHz?: number;
  confidence?: Confidence;
}

/** Constrói perfil. Usa a nota confortável para centrar a região confortável quando disponível. */
export function buildVocalProfile(lowestHz: number, highestHz: number, opts: BuildOpts = {}): VocalProfile {
  const lowMidi = freqToMidi(lowestHz);
  const highMidi = freqToMidi(highestHz);
  const lowestNote = freqToNoteLabel(lowestHz);
  const highestNote = freqToNoteLabel(highestHz);

  let comfortLowMidi: number;
  let comfortHighMidi: number;

  const comfortMidi = opts.comfortHz && opts.comfortHz > 0 ? freqToMidi(opts.comfortHz) : NaN;
  const validComfort =
    Number.isFinite(comfortMidi) && comfortMidi > lowMidi - 2 && comfortMidi < highMidi + 2;

  if (validComfort) {
    comfortLowMidi = Math.max(Math.round(lowMidi) + 2, Math.round(comfortMidi) - 5);
    comfortHighMidi = Math.min(Math.round(highMidi) - 2, Math.round(comfortMidi) + 5);
    // sanity: garantir low < high
    if (comfortLowMidi >= comfortHighMidi) {
      comfortLowMidi = Math.round(lowMidi) + 2;
      comfortHighMidi = Math.round(highMidi) - 2;
    }
  } else {
    comfortLowMidi = Math.min(highMidi - 1, Math.round(lowMidi) + 2);
    comfortHighMidi = Math.max(lowMidi + 1, Math.round(highMidi) - 2);
  }

  const voiceType = classifyVoice(Math.round(lowMidi), Math.round(highMidi));
  const rangeSemitones = Math.max(0, Math.round(highMidi - lowMidi));

  return {
    lowestNote,
    highestNote,
    lowestHz,
    highestHz,
    comfortableLow: midiToLabel(comfortLowMidi),
    comfortableHigh: midiToLabel(comfortHighMidi),
    comfortableLowHz: midiToHz(comfortLowMidi),
    comfortableHighHz: midiToHz(comfortHighMidi),
    rangeSemitones,
    voiceType,
    recommendedExercises: recommendExercises(voiceType, rangeSemitones),
    createdAt: new Date().toISOString(),
    version: 2,
    confidence: opts.confidence ?? 'high',
    voiceTypeConfidence: 'estimated',
    comfortHz: opts.comfortHz && opts.comfortHz > 0 ? opts.comfortHz : undefined,
    comfortNote: opts.comfortHz && opts.comfortHz > 0 ? freqToNoteLabel(opts.comfortHz) : undefined,
    detector: DETECTOR_VERSION,
  };
}

export function recommendExercises(voiceType: VoiceType, rangeSemitones: number): number[] {
  const base = [1, 2, 5];
  if (rangeSemitones < 18) base.push(4);
  if (voiceType === 'Tenor' || voiceType === 'Soprano') base.push(6);
  base.push(7);
  return base;
}

export interface KeyRecommendation {
  originalKey: string;
  recommendedKey: string;
  semitonesDelta: number;
  difficulty: 'Fácil' | 'Média' | 'Difícil';
  reason: string;
}

export function recommendKey(
  originalKey: string,
  profile: VocalProfile,
  chorusPeakNote?: string,
): KeyRecommendation {
  const peakMidi = chorusPeakNote
    ? noteLabelToMidi(chorusPeakNote)
    : midiOfKeyPeak(originalKey);
  const comfortHighMidi = noteLabelToMidi(profile.comfortableHigh);
  const comfortLowMidi = noteLabelToMidi(profile.comfortableLow);

  let delta = 0;
  let reason = 'Já está na sua região confortável.';

  if (peakMidi > comfortHighMidi) {
    delta = -(peakMidi - comfortHighMidi);
    reason = `Pico melódico ${Math.abs(delta)} semitom(ns) acima do seu confortável.`;
  } else if (peakMidi < comfortLowMidi - 5) {
    delta = comfortLowMidi - peakMidi;
    reason = `Música soa muito grave — subir ${delta} semitom(ns) encaixa melhor.`;
  }

  const recommendedKey = transposeKey(originalKey, delta);
  const abs = Math.abs(delta);
  const difficulty: KeyRecommendation['difficulty'] =
    abs <= 2 ? 'Fácil' : abs <= 5 ? 'Média' : 'Difícil';

  return { originalKey, recommendedKey, semitonesDelta: delta, difficulty, reason };
}
