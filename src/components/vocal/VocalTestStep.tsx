import { useEffect, useState } from 'react';
import { freqToNoteLabel } from '@/lib/audio/pitch';
import type { Hold } from '@/lib/audio/detectors';
import { captureConfidence, HOLD_SEC, midiToHz, type CaptureConfidence, type Instruction } from '@/lib/vocal/capture';
import type { CaptureLive, VocalMic } from './useVocalMic';

export type { CaptureConfidence };

interface Props {
  instruction: Instruction;
  /** sessão de microfone já calibrada (`useVocalMic`, fase `ready`) */
  mic: VocalMic;
  onCaptured: (hz: number, note: string, confidence: CaptureConfidence) => void;
  onCancel?: () => void;
}

const COPY: Record<Instruction, { title: string; hint: string; verb: string }> = {
  confortavel: {
    title: 'Cante um "AAAAH" confortável',
    hint: 'Sustente a nota que você usaria em qualquer música — sem esforço.',
    verb: 'Estabilize a nota',
  },
  grave: {
    title: 'Agora a nota mais grave que conseguir',
    hint: 'Desça devagar até o limite. Segure a última nota e pare. Precisa ser sustentável, não um resmungo.',
    verb: 'Segure a nota grave',
  },
  aguda: {
    title: 'E agora a mais aguda que conseguir',
    hint: 'Suba com o "AAAAH" até o limite. Segure a última nota e pare. Voz de peito ou mista — o que sustentar melhor.',
    verb: 'Segure a nota aguda',
  },
};

const label = (midi: number) => freqToNoteLabel(midiToHz(midi));

/**
 * Uma etapa do teste vocal. A captura (qual nota vale, quando termina) está em
 * `lib/vocal/capture.ts`; aqui é só a tela.
 */
export function VocalTestStep({ instruction, mic, onCaptured, onCancel }: Props) {
  const [live, setLive] = useState<CaptureLive>({ midi: null, current: null, best: null });
  const [timeout, setTimedOut] = useState<{ approx: Hold | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const copy = COPY[instruction];

  const finish = (hold: Hold, approximate: boolean) => {
    if (!mic.cal) return;
    const hz = midiToHz(hold.midi);
    onCaptured(hz, freqToNoteLabel(hz), captureConfidence(hold, mic.cal, approximate));
  };

  useEffect(() => {
    setLive({ midi: null, current: null, best: null });
    setTimedOut(null);
    return mic.capture(instruction, setLive, (end) => {
      if (end.kind === 'done') finish(end.hold, false);
      else setTimedOut({ approx: end.approx });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruction, attempt, mic.capture]);

  const held = live.current?.sec ?? 0;
  const progress = Math.min(1, held / HOLD_SEC);
  const shown = live.current?.midi ?? live.midi;

  const feedback = timeout
    ? null
    : live.midi === null && !live.current
      ? live.best
        ? 'Pronto? Se chegou no limite, é só parar.'
        : 'Cante de forma contínua…'
      : progress < 1
        ? 'Segure a nota…'
        : instruction === 'confortavel'
          ? 'Isso.'
          : 'Boa. Pode continuar até o limite ou parar.';

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em', fontWeight: 400 }}>
        {copy.verb}
      </p>
      <h2 className="mt-2 text-white" style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 30, lineHeight: 1.15 }}>
        {copy.title}
      </h2>
      <p className="mt-3 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
        {copy.hint}
      </p>

      <div className="relative mx-auto mt-10 h-52 w-52">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="#B8955A"
            strokeWidth="2"
            fill="none"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 120ms ease-out', filter: 'drop-shadow(0 0 6px rgba(232,201,126,0.55))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 56, color: '#fff', lineHeight: 1 }}>
            {shown !== null ? label(shown) : '—'}
          </span>
          <span className="mt-1 text-[10px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.28em' }}>
            {shown !== null ? `${Math.round(midiToHz(shown))} Hz` : 'aguardando voz'}
          </span>
        </div>
      </div>

      {instruction !== 'confortavel' && live.best && !timeout && (
        <p className="mt-6 text-[13px] text-[#E8C97E]" style={{ fontWeight: 300 }}>
          {instruction === 'grave' ? 'Mais grave até agora' : 'Mais aguda até agora'}: {label(live.best.midi)}
        </p>
      )}

      {feedback && (
        <p className="mt-3 text-[12px] text-[#8A8A95]" style={{ fontWeight: 300, letterSpacing: '0.02em' }}>
          {feedback}
        </p>
      )}

      {timeout && (
        <>
          <p className="mt-6 text-[13px] text-[#E8C97E]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
            Não conseguimos uma nota segurada por {HOLD_SEC} segundo. Tente um "AAAAH" contínuo, um pouco mais perto do celular.
          </p>
          {timeout.approx && (
            <button
              onClick={() => finish(timeout.approx!, true)}
              className="mt-4 text-[10px] uppercase text-[#B8955A] hover:text-[#E8C97E] transition-colors"
              style={{ letterSpacing: '0.28em' }}
            >
              Usar melhor valor aproximado ({label(timeout.approx.midi)}) →
            </button>
          )}
        </>
      )}

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
          style={{ letterSpacing: '0.28em' }}
        >
          ↺ Tentar de novo
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
            style={{ letterSpacing: '0.28em' }}
          >
            ✕ Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
