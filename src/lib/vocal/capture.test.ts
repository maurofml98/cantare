/**
 * Teste vocal pelo microfone simulado (`lib/audio/sim.ts`): o cantor faz o que a tela pede —
 * segura a confortável; na grave e na aguda, vai descendo/subindo nota a nota até o limite.
 * Faixas da tabela do CLAUDE.md, seção 9. Rede contra regressão, não validação com voz real.
 */
import { describe, expect, test } from 'bun:test';
import { render, run, type Adversity, type Seg } from '@/lib/audio/sim';
import { midiToHz, pickHold, stepDone, type Instruction } from './capture';

const SLOW = 120_000;
const TYPES: [string, number, number][] = [
  ['Baixo', 40, 64],
  ['Barítono', 45, 69],
  ['Tenor', 48, 72],
  ['Contralto', 53, 77],
  ['Mezzo-soprano', 57, 81],
  ['Soprano', 60, 84],
];
const floor = (dur: number): Seg => ({ kind: 'floor', dur });
interface Sing {
  amp?: number;
  /** vibrato, em semitons de pico (5,5 Hz) */
  vib?: number;
}
const note = (m: number, dur: number, o: Sing = {}): Seg => ({
  kind: 'voice',
  dur,
  amp: o.amp ?? 0.15,
  fundamental: m < 50 ? 0.3 : 1, // voz grave em microfone de celular: fundamental fraca
  f0: o.vib ? (t: number) => midiToHz(m + o.vib! * Math.sin(2 * Math.PI * 5.5 * t)) : midiToHz(m),
});

/** confortável fora do centro (lo + 10): metade/dobro dela não cai por acaso no limite */
const comfortOf = (lo: number) => lo + 10;

function sing(ins: Instruction, lo: number, hi: number, o: Sing = {}): Seg[] {
  const c = comfortOf(lo);
  if (ins === 'confortavel') return [floor(0.5), note(c, 2, o), floor(1.5)];
  const path: number[] = [];
  if (ins === 'grave') for (let m = c; m > lo; m -= 3) path.push(m);
  else for (let m = c; m < hi; m += 3) path.push(m);
  return [floor(0.5), ...path.map((m) => note(m, 1.2, o)), note(ins === 'grave' ? lo : hi, 1.5, o), floor(1.5)];
}

function measure(ins: Instruction, segs: Seg[], adv: Adversity = {}, fps = 60) {
  const { cal, result } = run(render([floor(2), ...segs], adv), ['pitch', 'sustain'], fps);
  expect(cal!.quality).not.toBe('contaminada');
  return pickHold(ins, result!.pitch!.holds)?.midi ?? null;
}

const expected = (ins: Instruction, lo: number, hi: number) => (ins === 'confortavel' ? comfortOf(lo) : ins === 'grave' ? lo : hi);
const STEPS: Instruction[] = ['confortavel', 'grave', 'aguda'];

describe('teste vocal: seis tipos vocais, sala quieta, 60 q/s', () => {
  for (const [name, lo, hi] of TYPES)
    for (const ins of STEPS)
      test(`${name} · ${ins}`, () => expect(Math.abs(measure(ins, sing(ins, lo, hi))! - expected(ins, lo, hi))).toBeLessThan(0.5), SLOW);
});

const ADVERSE: Record<string, { adv?: Adversity; sing?: Sing }> = {
  'picos de ruído +18 dB': { adv: { spikesPerSec: 6, spikeGain: 8 } },
  'quedas de áudio': { adv: { dropouts: [[3.2, 0.03], [4.1, 0.04], [5, 0.03], [6.3, 0.035], [7.7, 0.03]] } },
  // zumbido de 120 Hz ~ −48 dBFS: tem altura limpa e não pode virar a "nota mais grave"
  'zumbido elétrico 120 Hz': { adv: { hum: { hz: 120, amp: 0.004 } } },
  'vibrato ±½ semitom': { sing: { vib: 0.5 } },
  'voz baixa (−40 dBFS)': { sing: { amp: 0.02 } },
};

describe('teste vocal: condições adversas (baixo e soprano, 60 q/s)', () => {
  for (const [cn, { adv, sing: o }] of Object.entries(ADVERSE))
    for (const [name, lo, hi] of [TYPES[0], TYPES[5]])
      for (const ins of STEPS)
        test(`${cn} · ${name} · ${ins}`, () => expect(Math.abs(measure(ins, sing(ins, lo, hi, o), adv)! - expected(ins, lo, hi))).toBeLessThan(0.5), SLOW);
});

describe('teste vocal: 30 e 120 q/s (baixo e soprano)', () => {
  for (const fps of [30, 120])
    for (const [name, lo, hi] of [TYPES[0], TYPES[5]])
      for (const ins of STEPS)
        test(`${fps} q/s · ${name} · ${ins}`, () => expect(Math.abs(measure(ins, sing(ins, lo, hi), {}, fps)! - expected(ins, lo, hi))).toBeLessThan(0.5), SLOW);
});

describe('teste vocal: erros da captura antiga não voltam', () => {
  // Antiga: grave acima de 260 Hz era cortada pela metade — C4 da soprano virava C3.
  test('soprano canta a grave direto em C4 (262 Hz): C4', () => expect(measure('grave', [floor(0.5), note(60, 2), floor(1.5)])! - 60).toBeWithin(-0.5, 0.5), SLOW);
  // Antiga: aguda abaixo de 180 Hz era dobrada — E3 de um baixo virava E4.
  test('baixo canta a aguda direto em E3 (165 Hz): E3', () => expect(measure('aguda', [floor(0.5), note(52, 2), floor(1.5)])! - 52).toBeWithin(-0.5, 0.5), SLOW);
  // Antiga: capturava a primeira nota estável; a descida até o limite era ignorada.
  test('grave: descer até o limite registra o limite, não a primeira nota', () =>
    expect(measure('grave', [floor(0.5), note(55, 1.5), note(50, 1.5), note(45, 1.5), floor(1.5)])! - 45).toBeWithin(-0.5, 0.5), SLOW);
  // Nota só tocada (sem segurar 1 s) não é a extensão.
  test('grave: nota só encostada por 0,5 s não conta', () =>
    expect(measure('grave', [floor(0.5), note(55, 1.5), note(43, 0.5), note(50, 1.5), floor(1.5)])! - 50).toBeWithin(-0.5, 0.5), SLOW);
});

describe('quando a etapa termina', () => {
  const h = (midi: number, sec: number) => ({ midi, sec });
  test('confortável: assim que uma nota completa 1 s', () => {
    expect(stepDone('confortavel', [], h(60, 0.9), 0)).toBe(false);
    expect(stepDone('confortavel', [], h(60, 1), 0)).toBe(true);
  });
  test('grave: não termina enquanto ainda está cantando', () => expect(stepDone('grave', [h(50, 1.5)], h(48, 0.6), 0)).toBe(false));
  test('grave: termina com silêncio depois de nota válida', () => expect(stepDone('grave', [h(50, 1.5)], null, 1)).toBe(true));
  test('grave: silêncio sem nota válida não termina (espera ou tempo esgota)', () => expect(stepDone('grave', [h(50, 0.6)], null, 3)).toBe(false));
});
