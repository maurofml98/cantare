import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { midiToNote } from '@/lib/audio/pitch';
import type { VocalProfile } from '@/lib/vocal/profile';
import { profileRanges } from '@/lib/home/today';
import { VoiceBodyMap, type BodyRegion } from '@/components/vocal/VoiceBodyMap';
import { buttonVariants } from '@/components/ui/button';
import { C, SANS, SERIF, focusRing } from '@/components/home/primitives';

type Zone = 'agudo' | 'confortavel' | 'grave';

/** Cores com significado, só aqui: azul discreto = grave/peito, verde-azulado = região confortável, dourado = agudo/cabeça. */
const ZONE: Record<Zone, { color: string; label: string; body: BodyRegion[]; hint: string }> = {
  agudo: { color: '#C9A15E', label: 'Acima da região confortável', body: ['cabeca'], hint: 'Costuma ressoar mais na cabeça' },
  confortavel: { color: '#5FA39A', label: 'Região confortável', body: ['rosto', 'garganta'], hint: 'Onde a voz trabalha sem esforço' },
  grave: { color: '#5B86B8', label: 'Abaixo da região confortável', body: ['peito'], hint: 'Costuma ressoar mais no peito' },
};

const MIN = 40; // E2
const MAX = 84; // C6
const label = (m: number) => {
  const n = midiToNote(m);
  return `${n.name}${n.octave}`;
};

/**
 * Extensão vocal na escada + silhueta. Passar/tocar numa faixa acende a região do corpo.
 * Divisão em faixas usa os limites reais do perfil (grave, confortável, agudo) — é orientação, não medida de ressonância.
 */
export function RangeBody({ profile }: { profile: VocalProfile | null }) {
  const [zone, setZone] = useState<Zone | null>(null);

  if (!profile) {
    return (
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4">
        <div className="flex flex-col gap-4">
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.2 }}>Sua faixa ainda não foi medida.</p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.paper2, lineHeight: 1.5 }}>
            Faça o Teste Vocal para descobrir sua extensão e acompanhar como ela muda com o treino.
          </p>
          <div>
            <Link to="/teste-vocal" className={buttonVariants({ variant: 'primary' })}>Fazer teste vocal</Link>
          </div>
        </div>
        <VoiceBodyMap showLabels={false} className="h-full max-h-[380px] w-full opacity-60" />
      </div>
    );
  }

  const { range, comfortable } = profileRanges(profile);
  const pct = (m: number) => (1 - (Math.min(MAX, Math.max(MIN, m)) - MIN) / (MAX - MIN)) * 100;
  const segs: { z: Zone; top: number; bottom: number }[] = [
    { z: 'agudo', top: pct(range.high), bottom: pct(comfortable.high) },
    { z: 'confortavel', top: pct(comfortable.high), bottom: pct(comfortable.low) },
    { z: 'grave', top: pct(comfortable.low), bottom: pct(range.low) },
  ];
  const cTicks = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i).filter((m) => m % 12 === 0 || m % 12 === 7 || m % 12 === 4);

  const Marker = ({ z, note, title }: { z: Zone; note: string; title: string }) => (
    <button
      onMouseEnter={() => setZone(z)}
      onMouseLeave={() => setZone(null)}
      onFocus={() => setZone(z)}
      onBlur={() => setZone(null)}
      onClick={() => setZone((cur) => (cur === z ? null : z))}
      aria-pressed={zone === z}
      className={`flex flex-col items-start rounded-[6px] px-2 py-1 text-left transition-colors duration-[var(--dur-hover)] hover:bg-white/[0.03] ${focusRing}`}
    >
      <span className="whitespace-nowrap" style={{ fontFamily: SANS, fontSize: 12, color: ZONE[z].color }}>{title}</span>
      <span className="mt-0.5 rounded-[4px] px-2 py-0.5" style={{ fontFamily: SERIF, fontSize: 20, color: C.paper, background: `${ZONE[z].color}22`, border: `1px solid ${ZONE[z].color}55` }}>
        {note}
      </span>
    </button>
  );

  return (
    <div className="flex h-full flex-col">
    <div className="grid min-h-[320px] flex-1 grid-cols-[92px_minmax(0,1fr)] gap-3 sm:min-h-[380px] sm:grid-cols-[92px_minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* escada colorida */}
      <div className="relative h-full" role="img" aria-label={`Extensão de ${profile.lowestNote} a ${profile.highestNote}, confortável de ${profile.comfortableLow} a ${profile.comfortableHigh}`}>
        {cTicks.map((m) => (
          <span key={m} className="absolute left-0 flex -translate-y-1/2 items-center gap-2" style={{ top: `${pct(m)}%` }}>
            <span className="w-7 text-right" style={{ fontFamily: SANS, fontSize: 10, color: 'rgba(232,228,220,0.35)' }}>{m % 12 === 0 ? label(m) : ''}</span>
            <span className="h-px" style={{ width: m % 12 === 0 ? 14 : 8, background: 'rgba(232,228,220,0.14)' }} />
          </span>
        ))}
        <span className="absolute bottom-0 left-[52px] top-0 w-px" style={{ background: 'rgba(232,228,220,0.08)' }} />
        {segs.map((s) => (
          <button
            key={s.z}
            aria-label={`${ZONE[s.z].label}: destacar no corpo`}
            aria-pressed={zone === s.z}
            onMouseEnter={() => setZone(s.z)}
            onMouseLeave={() => setZone(null)}
            onFocus={() => setZone(s.z)}
            onBlur={() => setZone(null)}
            onClick={() => setZone((cur) => (cur === s.z ? null : s.z))}
            className={`absolute left-[46px] w-[13px] rounded-full transition-[transform,opacity,box-shadow] duration-[var(--dur-state)] ${focusRing}`}
            style={{
              top: `${s.top}%`,
              height: `${Math.max(1.5, s.bottom - s.top)}%`,
              background: ZONE[s.z].color,
              opacity: zone && zone !== s.z ? 0.35 : 1,
              transform: zone === s.z ? 'scaleX(1.35)' : undefined,
              boxShadow: zone === s.z ? `0 0 14px ${ZONE[s.z].color}` : undefined,
            }}
          />
        ))}
      </div>

      {/* marcadores (desktop: alinhados à escada) */}
      <div className="relative hidden h-full sm:block">
        <div className="absolute left-0" style={{ top: `calc(${pct(range.high)}% - 12px)` }}>
          <Marker z="agudo" note={profile.highestNote} title="Limite agudo" />
        </div>
        <div className="absolute left-0 -translate-y-1/2" style={{ top: `${(pct(comfortable.high) + pct(comfortable.low)) / 2}%` }}>
          <Marker z="confortavel" note={`${profile.comfortableLow} – ${profile.comfortableHigh}`} title="Região confortável" />
        </div>
        <div className="absolute left-0" style={{ top: `calc(${pct(range.low)}% - 48px)` }}>
          <Marker z="grave" note={profile.lowestNote} title="Limite grave" />
        </div>
      </div>

      {/* corpo */}
      <div className="relative flex h-full flex-col">
        <VoiceBodyMap active={zone ? ZONE[zone].body : undefined} showLabels={false} className="h-full min-h-0 w-full flex-1" />
        <p className="min-h-[36px] text-right" style={{ fontFamily: SANS, fontSize: 12, color: zone ? ZONE[zone].color : C.paper3, lineHeight: 1.4 }} aria-live="polite">
          {zone ? ZONE[zone].hint : 'Toque numa faixa para ver no corpo'}
        </p>
      </div>
    </div>
    {/* marcadores (celular: lista) */}
    <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
      <Marker z="agudo" note={profile.highestNote} title="Agudo" />
      <Marker z="confortavel" note={`${profile.comfortableLow}–${profile.comfortableHigh}`} title="Confortável" />
      <Marker z="grave" note={profile.lowestNote} title="Grave" />
    </div>
    </div>
  );
}
