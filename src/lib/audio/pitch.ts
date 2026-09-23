// Pitch detection via normalized autocorrelation (McLeod-like simplified).
// Returns frequency in Hz, or -1 if no confident pitch.

/** Abaixo disso o quadro não tem altura definida (CLAUDE.md, seção 9). */
export const CLARITY_GATE = 0.55;

export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  // Trim silence at edges: corta só até a PRIMEIRA amostra baixa de cada ponta (ACF2+).
  // Sem o `break`, r1/r2 iam parar perto do meio do buffer (todo sinal periódico passa por
  // zero), o trecho ficava com < 512 amostras e a função devolvia -1 para qualquer voz.
  const THRESH = 0.2;
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < THRESH) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < THRESH) {
      r2 = SIZE - i;
      break;
    }
  }
  const trimmed = buf.subarray(r1, r2);
  const N = trimmed.length;
  if (N < 512) return -1;

  const c = new Float32Array(N);
  for (let lag = 0; lag < N; lag++) {
    let sum = 0;
    for (let i = 0; i < N - lag; i++) sum += trimmed[i] * trimmed[i + lag];
    c[lag] = sum;
  }

  // Find first minimum (transition), then peak.
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1;
  let maxIdx = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxIdx = i;
    }
  }
  if (maxIdx <= 0) return -1;

  // Clareza: correlação no período, normalizada pelo número de termos somados. Sem este gate,
  // chiado ("S", "X") e ruído de sala viravam nota em 41 de 50 quadros.
  const clarity = (c[maxIdx] * N) / ((N - maxIdx) * c[0]);
  if (clarity < CLARITY_GATE) return -1;

  // Parabolic interpolation
  const y1 = c[maxIdx - 1] ?? c[maxIdx];
  const y2 = c[maxIdx];
  const y3 = c[maxIdx + 1] ?? c[maxIdx];
  const shift = (y3 - y1) / (2 * (2 * y2 - y1 - y3) || 1);
  const T0 = maxIdx + shift;
  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1200) return -1;
  return freq;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToNote(midi: number): { name: string; octave: number } {
  const rounded = Math.round(midi);
  return {
    name: NOTE_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
  };
}

export function freqToNoteLabel(freq: number): string {
  if (freq <= 0) return '—';
  const m = freqToMidi(freq);
  const n = midiToNote(m);
  return `${n.name}${n.octave}`;
}

export function noteLabelToMidi(label: string): number {
  const m = label.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) return 60;
  const idx = NOTE_NAMES.indexOf(m[1]);
  return (parseInt(m[2], 10) + 1) * 12 + idx;
}

// Cents difference between two MIDI values (multiply by 100).
export function centsDiff(midi: number, targetMidi: number): number {
  return (midi - targetMidi) * 100;
}
