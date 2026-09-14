// Utilities for musical key transposition.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
};

export function normalizeKey(key: string): string {
  const trimmed = key.trim();
  const match = trimmed.match(/^([A-G])(b|#)?(m|maj|M)?$/i);
  if (!match) return trimmed;
  const root = match[1].toUpperCase() + (match[2] ?? '');
  const rootSharp = FLAT_TO_SHARP[root] ?? root;
  const minor = (match[3] ?? '').toLowerCase() === 'm' ? 'm' : '';
  return rootSharp + minor;
}

export function keyToPitchClass(key: string): number {
  const norm = normalizeKey(key);
  const root = norm.replace(/m$/, '');
  const idx = NOTE_NAMES.indexOf(root);
  return idx >= 0 ? idx : 0;
}

export function transposeKey(key: string, semitones: number): string {
  const norm = normalizeKey(key);
  const isMinor = norm.endsWith('m');
  const root = norm.replace(/m$/, '');
  const idx = NOTE_NAMES.indexOf(root);
  if (idx < 0) return key;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTE_NAMES[newIdx] + (isMinor ? 'm' : '');
}

/**
 * Heuristic "peak" MIDI note for a song in the given key.
 * Assumes tonic ~ C4 (midi 60) as center; peak sits one octave above tonic.
 * Good enough for MVP recommendations without melody analysis.
 */
export function midiOfKeyPeak(key: string): number {
  const pc = keyToPitchClass(key);
  const tonicMidi = 48 + pc; // C3-based tonic
  return tonicMidi + 12;     // peak ~ 1 octave above tonic
}

export function semitoneDelta(fromKey: string, toKey: string): number {
  return keyToPitchClass(toKey) - keyToPitchClass(fromKey);
}
