/**
 * Nota de referência tocada pelo alto-falante. Criar o player num toque do usuário: iOS só
 * libera áudio iniciado por gesto. Não tocar enquanto o microfone mede — o microfone está
 * sem cancelamento de eco (CLAUDE.md, seção 9) e ouviria a própria nota.
 */
export interface TonePlayer {
  /** toca a nota e resolve quando o som acabou */
  play(midi: number, sec: number): Promise<void>;
  close(): void;
}

export function createTonePlayer(): TonePlayer {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  return {
    async play(midi, sec) {
      await ctx.resume().catch(() => {});
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // triângulo: tem harmônicos, então a nota grave ainda soa em alto-falante de celular
      osc.type = 'triangle';
      osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
      gain.gain.setValueAtTime(0.3, t + sec - 0.15);
      gain.gain.linearRampToValueAtTime(0, t + sec);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + sec);
      await new Promise<void>((r) => (osc.onended = () => r()));
    },
    close() {
      ctx.close().catch(() => {});
    },
  };
}
