/**
 * Criar música — opções e rascunho do formulário (tela de 25/09/2026, referência
 * `referencias/criar-ref.png`). A geração ainda não existe: isto é o contrato que a função real
 * vai receber. Nada aqui chama API.
 */
import { isLegacyProfile, type VocalProfile } from '@/lib/vocal/profile';

/** "No meu tom" (usa o teste vocal) ou "Personalizada" (a pessoa escolhe). */
export type CreationPath = 'meu-tom' | 'personalizada';
export type CreationMode = 'simples' | 'avancado';

export const DESCRIPTION_MAX = 1000;
export const LYRICS_MAX = 4000;
export const STYLE_NOTE_MAX = 300;

/** Poucos estilos, os do público (cantor de barzinho, evento e igreja). */
export const STYLES = ['Sertanejo', 'Gospel', 'Pagode', 'Forró', 'MPB'] as const;

const NOTE_PT: Record<string, string> = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };

/** Tons em português com a cifra — o cantor amador reconhece a cifra do Cifra Club. */
export const KEYS: { value: string; label: string }[] = [
  { value: '', label: 'Livre — o Cantare escolhe' },
  ...['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((k) => ({ value: k, label: `${NOTE_PT[k]} maior (${k})` })),
  ...['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'].map((k) => ({ value: k, label: `${NOTE_PT[k[0]]} menor (${k})` })),
];

export const VOICES = [
  { value: 'masculina', label: 'Masculina' },
  { value: 'feminina', label: 'Feminina' },
] as const;

export const DURATIONS = [
  { value: 'ate-2', label: 'Até 2 min' },
  { value: '2-3', label: '2 a 3 min' },
  { value: '3-4', label: '3 a 4 min' },
  { value: '4-mais', label: 'Mais de 4 min' },
] as const;

export const TEMPOS = [
  { value: 'lento', label: 'Lento' },
  { value: 'medio', label: 'Médio' },
  { value: 'animado', label: 'Animado' },
] as const;

/** O que a geração real vai receber. */
export interface CreationDraft {
  path: CreationPath;
  mode: CreationMode;
  description: string;
  styles: string[];
  otherStyle: string;
  lyrics: string;
  styleNote: string;
  key: string;
  voice: (typeof VOICES)[number]['value'] | '';
  duration: (typeof DURATIONS)[number]['value'] | '';
  tempo: (typeof TEMPOS)[number]['value'] | '';
}

export const emptyDraft = (path: CreationPath): CreationDraft => ({
  path,
  mode: 'simples',
  description: '',
  styles: [],
  otherStyle: '',
  lyrics: '',
  styleNote: '',
  key: '',
  voice: '',
  duration: '',
  tempo: '',
});

/**
 * "No meu tom" depende de um teste vocal válido. Perfil da captura antiga (detector < 3) pode
 * ter grave e aguda errados — pede para refazer em vez de usar.
 */
export type VocalToneStatus = { kind: 'sem-teste' } | { kind: 'refazer'; profile: VocalProfile } | { kind: 'ok'; profile: VocalProfile };

export function vocalToneStatus(profile: VocalProfile | null): VocalToneStatus {
  if (!profile) return { kind: 'sem-teste' };
  return isLegacyProfile(profile) ? { kind: 'refazer', profile } : { kind: 'ok', profile };
}
