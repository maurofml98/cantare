/**
 * Desafio de afinação da Home — a isca do funil (CLAUDE.md, seção 14): o app toca uma nota,
 * a pessoa canta de volta, em poucos segundos. É jogo, não treino nem avaliação: nada aqui é
 * clínico.
 *
 * A nota vale em qualquer oitava (erro "dobrado" na oitava): homem e mulher cantam a mesma
 * nota de referência onde for confortável, sem precisar do teste vocal.
 */

/** Notas de referência (MIDI, G3–E4): cantáveis em alguma oitava por qualquer voz. */
const POOL = [55, 57, 59, 60, 62, 64];

export const ROUNDS = 3;

/** Sorteia as notas da partida, sem repetir. `rand` injetável para teste. */
export function pickTargets(rand: () => number = Math.random): number[] {
  const pool = [...POOL];
  const out: number[] = [];
  while (out.length < ROUNDS) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

/** Distância em cents até a nota-alvo, na oitava mais próxima: de -600 a +600. */
export function foldedCents(sungMidi: number, targetMidi: number): number {
  const d = sungMidi - targetMidi;
  return Math.round((d - 12 * Math.round(d / 12)) * 100);
}

export type Band = 'afinado' | 'perto' | 'caminho';

/*
 * TODO(Laury): limiares provisórios, não clínicos. ±25 cents é o que um afinador de
 * instrumento considera afinado; ±60 é "perto" o bastante para quem nunca treinou.
 */
const AFINADO_CENTS = 25;
const PERTO_CENTS = 60;

/** Rodadas sem voz captada não entram. Menos de 2 rodadas captadas = sem resultado. */
export function scoreRounds(errors: (number | null)[]): { band: Band; meanAbs: number; heard: number } | null {
  const heard = errors.filter((e): e is number => e !== null);
  if (heard.length < 2) return null;
  const meanAbs = Math.round(heard.reduce((s, e) => s + Math.abs(e), 0) / heard.length);
  const band: Band = meanAbs <= AFINADO_CENTS ? 'afinado' : meanAbs <= PERTO_CENTS ? 'perto' : 'caminho';
  return { band, meanAbs, heard: heard.length };
}

/*
 * TODO(Laury): revisar o texto das três faixas. Regra (decisão do Mauro, 25/09/2026): todas
 * positivas, nenhuma mentindo — "talento" só para quem de fato acertou as notas.
 */
export const RESULT_TEXT: Record<Band, { title: string; text: string }> = {
  afinado: {
    title: 'Parabéns, você tem talento.',
    text: 'Você acertou as notas de perto. Treine sua voz hoje, grátis.',
  },
  perto: {
    title: 'Parabéns, seu ouvido acha as notas.',
    text: 'Você chegou perto de todas. Com treino, a voz chega lá — comece hoje, grátis.',
  },
  caminho: {
    title: 'Parabéns por encarar o desafio.',
    text: 'Afinação se treina, e todo cantor começou de algum lugar. Comece hoje, grátis.',
  },
};
