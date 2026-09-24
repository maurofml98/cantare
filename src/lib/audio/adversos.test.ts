/**
 * Testes adversos de todos os detectores, pelo caminho completo do microfone simulado
 * (`sim.ts`): áudio sintético → janela 2048 + FFT → bandas → calibração → detector.
 *
 * Condições: ruído com picos, quedas de áudio, calibração ruim, 30/60/120 quadros por segundo.
 *
 * `test.failing` = erro conhecido e ainda não corrigido. Quando a correção entrar, o teste
 * passa, o `failing` quebra a suíte e ele precisa virar `test` normal.
 */
import { describe, expect, test } from 'bun:test';
import { render, run, type Adversity, type Seg } from './sim';
import { calibrate } from './levels';

const FPS = [30, 60, 120];
const SLOW = 60_000; // altura e FFT em Node custam; o padrão de 5 s do bun não basta

const CONDS: Record<string, Adversity> = {
  limpo: {},
  // rajadas de 10–25 ms, 6 por segundo, +12 dB sobre o fundo (teclado, estalo, rua)
  picos: { spikesPerSec: 6, spikeGain: 4 },
  // idem, +18 dB
  'picos fortes': { spikesPerSec: 6, spikeGain: 8 },
  // buffer perdido com o aparelho sob carga: 20–40 ms de zeros no meio da emissão
  quedas: { dropouts: [[3.5, 0.03], [4.8, 0.04], [5.3, 0.02], [6.1, 0.035]] },
};

const floor = (dur: number): Seg => ({ kind: 'floor', dur });
const CAL = floor(2);
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** tolerância de tempo: um quadro + a janela de 2048 amostras (43 ms) borrando as bordas */
const tolSec = (fps: number) => 1 / fps + 0.05;

/** roda `body` para cada fps × condição */
function matrix(name: string, body: (adv: Adversity, fps: number) => void, timeout?: number) {
  describe(name, () => {
    for (const [cn, adv] of Object.entries(CONDS))
      for (const fps of FPS) test(`${cn} · ${fps} q/s`, () => body(adv, fps), timeout);
  });
}

/* ---------------- duração (S sustentado, "X") ---------------- */

matrix('duração: "S" de 6 s', (adv, fps) => {
  const { result } = run(render([CAL, floor(1), { kind: 's', dur: 6 }, floor(2)], adv), ['sustain'], fps);
  expect(Math.abs(result!.sustain!.longestSec - 6)).toBeLessThan(tolSec(fps));
});

matrix('duração: "S" 3 s + quebra de 400 ms + 3 s', (adv, fps) => {
  const { result } = run(render([CAL, floor(1), { kind: 's', dur: 3 }, floor(0.4), { kind: 's', dur: 3 }, floor(2)], adv), ['sustain'], fps);
  expect(result!.sustain!.segments).toHaveLength(2);
  expect(Math.abs(result!.sustain!.firstSec - 3)).toBeLessThan(tolSec(fps));
});

matrix('duração: "S" fraco (−22 dB) de 6 s', (adv, fps) => {
  const { result } = run(render([CAL, floor(1), { kind: 's', dur: 6, amp: 0.02 }, floor(2)], adv), ['sustain'], fps);
  // com picos fortes o "S" fraco perde um pouco nas bordas; mais que isso é erro
  expect(Math.abs(result!.sustain!.longestSec - 6)).toBeLessThan(tolSec(fps) + 0.15);
});

/* ---------------- pulsos (S pulsado) ---------------- */

const pulses = (n: number, onSec: number, offSec: number): Seg[] => Array.from({ length: n }, () => [{ kind: 's', dur: onSec } as Seg, floor(offSec)]).flat();

matrix('pulsos: 10 × (180 ms som / 320 ms pausa)', (adv, fps) => {
  const { result } = run(render([CAL, floor(1), ...pulses(10, 0.18, 0.32), floor(2)], adv), ['pulses'], fps);
  expect(result!.pulses!.count).toBe(10);
});

matrix('pulsos: 12 rápidos (5/s)', (adv, fps) => {
  const { result } = run(render([CAL, floor(1), ...pulses(12, 0.1, 0.1), floor(2)], adv), ['pulses'], fps);
  expect(result!.pulses!.count).toBe(12);
});

/* ---------------- cronômetro (trava-línguas) ---------------- */

matrix('cronômetro: leitura de 2,6 s com pausas curtas', (adv, fps) => {
  const reading: Seg[] = [{ kind: 's', dur: 0.5 }, floor(0.15), { kind: 's', dur: 0.6 }, floor(0.3), { kind: 's', dur: 0.7 }, floor(0.2), { kind: 's', dur: 0.15 }];
  const { result } = run(render([CAL, floor(1), ...reading, floor(2)], adv), ['timer'], fps);
  expect(Math.abs(result!.timer!.sec - 2.6)).toBeLessThan(tolSec(fps));
});

/* ---------------- altura ---------------- */

matrix('altura: A3 (220 Hz) sustentado', (adv, fps) => {
  const { result } = run(render([CAL, floor(0.5), { kind: 'voice', dur: 2, f0: 220 }, floor(0.5)], adv), ['pitch'], fps);
  expect(Math.abs(result!.pitch!.medianMidi! - 57)).toBeLessThan(0.1);
  expect(result!.pitch!.stableNotes).toEqual([57]);
}, SLOW);

matrix('altura: G2 (98 Hz) com fundamental fraca — sem erro de oitava', (adv, fps) => {
  const { result } = run(render([CAL, floor(0.5), { kind: 'voice', dur: 2, f0: 98, fundamental: 0.25 }, floor(0.5)], adv), ['pitch'], fps);
  expect(result!.pitch!.stableNotes).toEqual([43]);
}, SLOW);

matrix('altura: escala C4 D4 E4 F4 G4', (adv, fps) => {
  const scale = [60, 62, 64, 65, 67].map((m): Seg => ({ kind: 'voice', dur: 0.6, f0: midiHz(m) }));
  const { result } = run(render([CAL, floor(0.5), ...scale, floor(0.5)], adv), ['pitch'], fps);
  expect(result!.pitch!.stableNotes).toEqual([60, 62, 64, 65, 67]);
}, SLOW);

matrix('altura: "S" surdo não vira nota', (adv, fps) => {
  const { result } = run(render([CAL, floor(0.5), { kind: 's', dur: 2 }, floor(0.5)], adv), ['pitch'], fps);
  expect(result!.pitch!.stableNotes).toEqual([]);
}, SLOW);

// Antes (até a versão 2 do detector): gate fixo `rms < 0.01` ignorava voz 13 dB acima do
// ruído só por ser baixa em absoluto (celular longe, voz suave).
matrix('altura: voz baixa (−40 dBFS), acima do ruído da sala', (adv, fps) => {
  const { result } = run(render([CAL, floor(0.5), { kind: 'voice', dur: 2, f0: 220, amp: 0.02 }, floor(0.5)], adv), ['pitch'], fps);
  expect(result!.pitch!.stableNotes).toEqual([57]);
}, SLOW);

/* ---------------- intensidade (messa di voce) ---------------- */

describe('intensidade: erros conhecidos', () => {
  const crescendo = (adv: Adversity) =>
    render([CAL, floor(1), { kind: 'voice', dur: 4, f0: 220, amp: 0.03, env: (u) => 10 ** ((12 * u) / 20) }, floor(1)], adv);

  const flat = (adv: Adversity) => render([CAL, floor(1), { kind: 'voice', dur: 4, f0: 220, amp: 0.06 }, floor(1)], adv);

  // Mesmo erro do cronômetro antes da correção: um quadro de ruído acima do limiar de saída
  // antes da voz vira o "início da emissão", a base fica no nível do ruído e o crescimento
  // explode (+26 dB com picos; +57 dB a 120 q/s mesmo limpo). Nota plana mede +52 dB.
  // Só passa hoje sem picos e a 30/60 q/s. Não usado por exercício pronto (messa di voce
  // aguarda a Laury), mas precisa ser corrigido antes.
  const ok = (cn: string, fps: number) => (cn === 'limpo' || cn === 'quedas') && fps <= 60;
  for (const fps of FPS)
    for (const [cn, adv] of Object.entries(CONDS)) {
      const t = ok(cn, fps) ? test : test.failing;
      // base = 0,4 s iniciais, fim = 20% finais: +12 dB no sinal viram ~10 dB medidos
      t(`crescendo de +12 dB mede entre 8 e 13 dB · ${cn} · ${fps} q/s`, () => {
        const r = run(crescendo(adv), ['intensity'], fps).result!.intensity!.riseDb!;
        expect(r).toBeGreaterThan(8);
        expect(r).toBeLessThan(13);
      });
      // com picos a 120 q/s a nota plana "passa" por acaso: o erro devolve ~0 dB para qualquer
      // curva (o crescendo acima também mede 0,3 dB) — por isso não conta como acerto
      const flatOk = ok(cn, fps) || (cn.startsWith('picos') && fps === 120);
      (flatOk ? test : test.failing)(`nota plana mede menos de 1,5 dB · ${cn} · ${fps} q/s`, () => {
        const r = run(flat(adv), ['intensity'], fps).result!.intensity!.riseDb!;
        expect(Math.abs(r)).toBeLessThan(1.5);
      });
    }
});

/* ---------------- calibração ruim ---------------- */

describe('calibração ruim: erros conhecidos', () => {
  const s6: Seg[] = [floor(1), { kind: 's', dur: 6 }, floor(2)];


  test('fala na calibração é detectada (pelo nível)', () => {
    const { cal } = run(render([floor(0.5), { kind: 'voice', dur: 1, f0: 150, amp: 0.1 }, floor(0.5), ...s6]), ['sustain'], 60);
    expect(cal!.quality).not.toBe('ok');
  });

  // Silêncio digital (gate do iOS): todas as bandas "mortas", nada é captado depois.
  test.failing('calibração com zeros não desliga a detecção', () => {
    const { cal, result } = run(render([{ kind: 'zero', dur: 2 }, ...s6]), ['sustain'], 60);
    expect(cal!.quality !== 'ok' || Math.abs(result!.sustain!.longestSec - 6) < 0.1).toBe(true);
  });

  // Ruído que sobe depois da calibração (+9,5 dB): o silêncio vira emissão.
  // "S" de 6 s mede 8,4 s; trava-língua de 2,6 s mede 5,0 s.
  test.failing('ruído que sobe depois da calibração não vira emissão', () => {
    const { result } = run(render([CAL, ...s6], { floorStep: { at: 2.5, gain: 3 } }), ['sustain'], 60);
    expect(Math.abs(result!.sustain!.longestSec - 6)).toBeLessThan(0.1);
  });

  test('sala quieta calibra como ok', () => {
    for (const fps of FPS) expect(run(render([CAL, floor(1)]), ['sustain'], fps).cal!.quality).toBe('ok');
  });

  test('calibração precisa de 20 quadros', () => expect(calibrate([])).toBeNull());
});

/* ---------------- calibração contaminada ---------------- */

describe('calibração contaminada: som nos 2 s de silêncio pede para refazer', () => {
  const after: Seg[] = [floor(1)];
  const dirty: Record<string, { segs: Seg[]; adv?: Adversity }> = {
    'sopro forte': { segs: [floor(0.7), { kind: 's', dur: 0.6, amp: 0.05 }, floor(0.7)] },
    'sopro fraco (−28 dB)': { segs: [floor(0.7), { kind: 's', dur: 0.6, amp: 0.01 }, floor(0.7)] },
    tosse: { segs: [floor(1), { kind: 's', dur: 0.15, amp: 0.1 }, floor(0.85)] },
    'fala por 1 s': { segs: [floor(0.5), { kind: 'voice', dur: 1, f0: 150, amp: 0.1 }, floor(0.5)] },
    'fala baixa por 1 s': { segs: [floor(0.5), { kind: 'voice', dur: 1, f0: 150, amp: 0.01 }, floor(0.5)] },
    '"S" começado antes da hora': { segs: [floor(1.7), { kind: 's', dur: 0.3 }] },
    'sopro com picos de ruído': { segs: [floor(0.7), { kind: 's', dur: 0.6, amp: 0.05 }, floor(0.7)], adv: { spikesPerSec: 6, spikeGain: 4 } },
  };
  const clean: Record<string, Adversity> = {
    silêncio: {},
    'picos +12 dB': { spikesPerSec: 6, spikeGain: 4 },
    'picos +18 dB': { spikesPerSec: 6, spikeGain: 8 },
    'picos +24 dB, 12/s': { spikesPerSec: 12, spikeGain: 16 },
    'ventilador (fundo +9,5 dB, constante)': { floor: 0.0045 },
  };
  for (const fps of FPS) {
    for (const [n, { segs, adv }] of Object.entries(dirty))
      test(`${n} · ${fps} q/s → contaminada`, () => expect(run(render([...segs, ...after], adv), ['sustain'], fps).cal!.quality).toBe('contaminada'));
    for (const [n, adv] of Object.entries(clean))
      test(`${n} · ${fps} q/s → não contaminada`, () => expect(run(render([CAL, ...after], adv), ['sustain'], fps).cal!.quality).not.toBe('contaminada'));
  }
  // Limite conhecido: som que ocupa os 2 s inteiros vira o próprio fundo. Fala alta é pega
  // pelo nível (ruidoso); fala baixa contínua passa como sala ok.
  test('fala alta nos 2 s inteiros → ruidoso', () =>
    expect(run(render([{ kind: 'voice', dur: 2, f0: 150, amp: 0.1 }, ...after]), ['sustain'], 60).cal!.quality).toBe('ruidoso'));
});
