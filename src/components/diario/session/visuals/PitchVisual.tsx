import { useRef } from 'react';
import { midiToNote } from '@/lib/audio/pitch';
import { PITCH_TARGETS } from '@/lib/diario/exercises';
import { GOLD_HI, INK, StageImage, StageSvg, clamp, useVisualLoop, type VisualProps } from './shared';

const AX = 182; // eixo da escada na arte
const AY = 440; // centro tonal
const PX_PER_CENT = 2; // ±120 cents ocupam a escada visível

export const noteName = (midi: number) => {
  const n = midiToNote(midi);
  return `${n.name}${n.octave}`;
};

/**
 * Afinação Básica — a voz encontra a nota.
 * O centro da escada é a nota-alvo. O marcador sobe/desce conforme o desvio real (cents).
 * Perto do centro fica dourado; dentro de ±50 cents pulsa suave.
 */
export function PitchVisual({ cfg, session, reduced, exerciseId }: VisualProps) {
  const marker = useRef<SVGGElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const beam = useRef<SVGLineElement>(null);
  const pulse = useRef<SVGCircleElement>(null);
  const center = useRef<SVGLineElement>(null);
  const y = useRef(AY);

  useVisualLoop(session.status, reduced, (vt, dt) => {
    const L = session.live.current;
    const show = session.status === 'running' && L.cents !== null;
    if (show) {
      const target = AY + clamp(L.cents!, -140, 140) * -PX_PER_CENT;
      y.current += (target - y.current) * (dt ? Math.min(1, dt * 9) : 1);
    }
    const off = Math.abs(y.current - AY) / PX_PER_CENT;
    const near = show ? 1 - clamp(off / 120) : 0;
    const hit = show && off <= 50;
    marker.current?.setAttribute('transform', `translate(0 ${(y.current - AY).toFixed(1)})`);
    marker.current?.setAttribute('opacity', show ? '1' : '0');
    dot.current?.setAttribute('fill', near > 0.6 ? GOLD_HI : '#D9D2C3');
    dot.current?.setAttribute('r', (12 + 6 * near).toFixed(1));
    beam.current?.setAttribute('stroke-opacity', (0.15 + 0.6 * near).toFixed(2));
    center.current?.setAttribute('stroke-opacity', (hit ? 0.9 : 0.35).toFixed(2));
    const ph = (vt % 1.4) / 1.4;
    pulse.current?.setAttribute('r', (20 + 70 * ph).toFixed(1));
    pulse.current?.setAttribute('opacity', hit && !reduced ? (0.55 * (1 - ph)).toFixed(2) : '0');
  });

  const seq = PITCH_TARGETS[exerciseId] ?? [];
  const L = session.snap;
  const active = session.status === 'running' || session.status === 'paused';
  const targetLabel = L.targetMidi !== null ? noteName(L.targetMidi) : seq[0]?.note;
  const youLabel = active && L.midi !== null ? noteName(L.midi) : '—';
  const onNote = active && L.cents !== null && Math.abs(L.cents) <= 50;

  return (
    <>
      <StageImage cfg={cfg} />
      <StageSvg cfg={cfg}>
        <rect width="1672" height="941" fill={INK} opacity="0.12" />
        <line ref={center} x1={AX} x2="1672" y1={AY} y2={AY} stroke={GOLD_HI} strokeWidth="2" strokeDasharray="3 9" strokeOpacity="0.35" />
        <circle ref={pulse} cx={AX} cy={AY} r="20" fill="none" stroke={GOLD_HI} strokeWidth="3" opacity="0" />
        <g ref={marker} opacity="0">
          <line ref={beam} x1={AX} x2={AX + 520} y1={AY} y2={AY} stroke={GOLD_HI} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.2" />
          <circle ref={dot} cx={AX} cy={AY} r="12" fill="#D9D2C3" />
        </g>
      </StageSvg>

      {/* Alvo × você, na área escura da arte */}
      <div className="pointer-events-none absolute right-[5%] top-[10%] flex items-end gap-8 text-right sm:gap-12" aria-live="polite">
        <div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '0.14em', color: 'rgba(232,228,220,0.6)' }}>ALVO</p>
          <p style={{ fontFamily: "'Newsreader', serif", fontWeight: 300, fontSize: 'clamp(40px, 4.4vw, 76px)', color: GOLD_HI, lineHeight: 1 }}>{targetLabel}</p>
        </div>
        <div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '0.14em', color: 'rgba(232,228,220,0.6)' }}>VOCÊ</p>
          <p className="flex items-center justify-end gap-2" style={{ fontFamily: "'Newsreader', serif", fontWeight: 300, fontSize: 'clamp(40px, 4.4vw, 76px)', color: onNote ? GOLD_HI : '#F3E7CF', lineHeight: 1, transition: 'color 200ms' }}>
            {youLabel}
            {onNote && (
              <svg width="28" height="28" viewBox="0 0 24 24" aria-label="na nota" className="animate-in zoom-in-50 fade-in duration-300">
                <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={GOLD_HI} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </p>
        </div>
      </div>

      {/* sequência de alvos */}
      <ol className="pointer-events-none absolute bottom-[7%] right-[5%] flex gap-1.5" aria-label="Sequência de notas-alvo">
        {seq.map((t, i) => {
          const cur = active && i === L.targetIndex;
          return (
            <li
              key={i}
              className="rounded-[6px] px-2.5 py-1 tabular-nums transition-colors duration-300"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: cur ? INK : 'rgba(232,228,220,0.75)',
                background: cur ? GOLD_HI : 'rgba(7,8,10,0.6)',
                border: `1px solid ${cur ? GOLD_HI : 'rgba(232,228,220,0.12)'}`,
              }}
            >
              {t.note}
            </li>
          );
        })}
      </ol>
    </>
  );
}
