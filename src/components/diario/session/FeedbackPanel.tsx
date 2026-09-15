import { Link } from '@tanstack/react-router';
import { BREATH_LABEL, breathAt, type MetricKey, type SessionConfig } from '@/lib/diario/sessions';
import { midiToNote } from '@/lib/audio/pitch';
import { C, SANS, SERIF } from '@/components/home/primitives';
import { VOICE_GATE, type Session } from './useExerciseSession';
import { clamp, levelOf, type VisualProps } from './visuals/shared';

const note = (m: number) => {
  const n = midiToNote(m);
  return `${n.name}${n.octave}`;
};

/** O que cada métrica significa — aparece antes de começar, no lugar de valores. */
const ABOUT: Record<MetricKey, { label: string; hint: string }> = {
  intensity: { label: 'Intensidade', hint: 'Volume captado, relativo ao seu microfone' },
  continuity: { label: 'Continuidade', hint: 'Quanto do tempo teve som' },
  breathPhase: { label: 'Fase', hint: 'Inspire, segure ou expire' },
  breathCycle: { label: 'Ciclo', hint: 'Quantos ciclos completos' },
  stability: { label: 'Estabilidade', hint: 'Quanto a nota oscila' },
  sync: { label: 'Emissão contínua', hint: 'Tempo com som e nota definida' },
  note: { label: 'Nota atual', hint: 'A nota que você está cantando' },
  direction: { label: 'Direção', hint: 'Subindo, descendo ou sustentando' },
  target: { label: 'Desvio', hint: 'Distância até a nota-alvo, em cents' },
  accuracy: { label: 'Precisão', hint: 'Leituras a até 50 cents do alvo' },
  range: { label: 'Na sua faixa', hint: 'Onde a nota cai no seu Teste Vocal' },
  softening: { label: 'Suavização', hint: 'Volume agora comparado ao início' },
};

const INTENSITY_LABELS = ['Silêncio', 'Muito suave', 'Suave', 'Moderada', 'Forte', 'Muito forte'];
function intensityLabel(rms: number) {
  if (rms < VOICE_GATE) return 0;
  if (rms < 0.03) return 1;
  if (rms < 0.07) return 2;
  if (rms < 0.15) return 3;
  if (rms < 0.28) return 4;
  return 5;
}

export function FeedbackPanel({ cfg, session, range }: { cfg: SessionConfig; session: Session; range: VisualProps['range'] }) {
  const { status, snap, mic } = session;
  const live = status === 'running' || status === 'paused';
  const needsMic = cfg.mic && (mic === 'denied' || mic === 'error' || mic === 'unsupported');

  return (
    <div className="flex min-h-0 flex-col" style={{ fontFamily: SANS }}>
      <p style={{ fontSize: 12, letterSpacing: '0.12em', color: C.paper3 }}>{live ? 'AO VIVO' : status === 'done' ? 'RESULTADO' : 'O QUE ACOMPANHAMOS'}</p>

      {needsMic && (live || status === 'done') ? (
        <div className="mt-4 rounded-[8px] p-4" style={{ border: `1px solid rgba(200,127,106,0.35)`, background: 'rgba(200,127,106,0.06)' }}>
          <p style={{ fontSize: 14, color: C.paper }}>Sem medições por enquanto</p>
          <p className="mt-1" style={{ fontSize: 13, color: C.paper2, lineHeight: 1.45 }}>O exercício continua guiado. Libere o microfone para ver seu volume e suas notas.</p>
        </div>
      ) : null}

      <div className="mt-3 flex min-h-0 flex-col divide-y overflow-y-auto" style={{ borderColor: C.rule }}>
        {cfg.metrics.map((k) => (
          <div key={k} className="py-4 first:pt-1" style={{ borderColor: C.rule }}>
            {live && !(needsMic && k !== 'breathPhase' && k !== 'breathCycle') ? (
              <Metric k={k} cfg={cfg} session={session} range={range} />
            ) : status === 'done' ? (
              <Result k={k} session={session} />
            ) : (
              <>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 22, color: C.paper, lineHeight: 1.15 }}>{ABOUT[k].label}</p>
                <p className="mt-1" style={{ fontSize: 13.5, color: C.paper3, lineHeight: 1.4 }}>{ABOUT[k].hint}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ k, children }: { k: MetricKey; children?: React.ReactNode }) {
  return (
    <p className="flex items-baseline justify-between gap-3" style={{ fontSize: 12.5, color: C.paper3 }} title={ABOUT[k].hint}>
      <span>{ABOUT[k].label}</span>
      {children}
    </p>
  );
}

function Big({ children, gold = false, dim = false }: { children: React.ReactNode; gold?: boolean; dim?: boolean }) {
  return (
    <p className="mt-1 tabular-nums" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, lineHeight: 1.05, color: dim ? C.paper3 : gold ? '#E8C97E' : C.paper }}>
      {children}
    </p>
  );
}

function Bar({ value, marker = true }: { value: number; marker?: boolean }) {
  const v = clamp(value) * 100;
  return (
    <div className="relative mt-2 h-[6px] rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-out" style={{ width: `${v}%`, background: 'linear-gradient(90deg, #8E7344, #E8C97E)' }} />
      {marker && <span className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full transition-[left] duration-150 ease-out" style={{ left: `calc(${v}% - 1px)`, background: '#FFF1CF' }} />}
    </div>
  );
}

function Metric({ k, cfg, session, range }: { k: MetricKey; cfg: SessionConfig; session: Session; range: VisualProps['range'] }) {
  const s = session.snap;
  const paused = session.status === 'paused';
  switch (k) {
    case 'intensity': {
      const i = intensityLabel(s.rms);
      return (
        <>
          <Label k={k} />
          <Big dim={paused || i === 0}>{paused ? 'Pausado' : INTENSITY_LABELS[i]}</Big>
          <Bar value={paused ? 0 : levelOf(s.rms)} />
        </>
      );
    }
    case 'continuity':
      return (
        <>
          <Label k={k}>{s.continuity !== null && <span>do tempo com som</span>}</Label>
          <Big dim={s.continuity === null}>{s.continuity === null ? 'Medindo…' : `${Math.round(s.continuity * 100)}%`}</Big>
          {s.continuity !== null && <Bar value={s.continuity} marker={false} />}
        </>
      );
    case 'sync':
      return (
        <>
          <Label k={k}>{s.sync !== null && <span>{Math.round(s.sync * 100)}% do tempo</span>}</Label>
          <Big gold={s.voiced && s.midi !== null} dim={paused || !s.voiced}>
            {paused ? 'Pausado' : s.voiced && s.midi !== null ? 'Sincronizado' : s.voiced ? 'Som sem nota definida' : 'Aguardando som'}
          </Big>
          {s.sync !== null && <Bar value={s.sync} marker={false} />}
        </>
      );
    case 'stability': {
      const v = s.stability;
      const word = v === null ? null : v < 15 ? 'Estável' : v < 35 ? 'Quase estável' : 'Oscilando';
      return (
        <>
          <Label k={k}>{v !== null && <span>±{Math.round(v)} cents</span>}</Label>
          <Big gold={word === 'Estável'} dim={v === null}>{word ?? 'Cante para medir'}</Big>
        </>
      );
    }
    case 'note':
      return (
        <>
          <Label k={k}>{s.hz !== null && <span>{Math.round(s.hz)} Hz</span>}</Label>
          <Big dim={s.midi === null}>{s.midi !== null ? note(s.midi) : '—'}</Big>
        </>
      );
    case 'direction': {
      const d = s.slope;
      const word = d === null || s.midi === null ? null : d > 1.5 ? 'Subindo' : d < -1.5 ? 'Descendo' : 'Sustentando';
      return (
        <>
          <Label k={k} />
          <Big dim={!word}>
            {word ? (
              <span className="inline-flex items-center gap-2">
                <DirectionGlyph dir={d! > 1.5 ? 'up' : d! < -1.5 ? 'down' : 'flat'} />
                {word}
              </span>
            ) : '—'}
          </Big>
        </>
      );
    }
    case 'target': {
      const c = s.cents;
      const word = c === null ? null : Math.abs(c) <= 50 ? 'Na nota' : c < 0 ? 'Abaixo do alvo' : 'Acima do alvo';
      return (
        <>
          <Label k={k}>{c !== null && <span className="tabular-nums">{c > 0 ? '+' : ''}{Math.round(c)} cents</span>}</Label>
          <Big gold={word === 'Na nota'} dim={c === null}>{word ?? 'Cante a nota-alvo'}</Big>
          <CentsScale cents={c} />
        </>
      );
    }
    case 'accuracy':
      return (
        <>
          <Label k={k}>{s.samples > 0 && <span>{s.hits} de {s.samples} leituras</span>}</Label>
          <Big dim={s.accuracy === null}>{s.accuracy === null ? '—' : `${s.accuracy}%`}</Big>
          {s.accuracy !== null && <Bar value={s.accuracy / 100} marker={false} />}
        </>
      );
    case 'range': {
      if (!range)
        return (
          <>
            <Label k={k} />
            <p className="mt-1" style={{ fontSize: 13, color: C.paper2 }}>
              Faça o <Link to="/teste-vocal" className="underline underline-offset-4" style={{ color: '#E8C97E' }}>Teste Vocal</Link> para ver sua faixa.
            </p>
          </>
        );
      const m = s.midi;
      const word = m === null ? null : m < range.comfortLow ? 'Abaixo da confortável' : m > range.comfortHigh ? 'Acima da confortável' : 'Região confortável';
      return (
        <>
          <Label k={k}>{m !== null && <span>{note(m)}</span>}</Label>
          <Big gold={word === 'Região confortável'} dim={!word}>{word ?? '—'}</Big>
        </>
      );
    }
    case 'softening': {
      const r = s.softening;
      const pct = r === null ? null : Math.round((1 - r) * 100);
      return (
        <>
          <Label k={k} />
          <Big gold={pct !== null && pct > 0} dim={pct === null}>
            {pct === null ? 'Medindo o início…' : pct > 5 ? `${pct}% mais suave` : pct < -5 ? 'Mais forte que no início' : 'Igual ao início'}
          </Big>
        </>
      );
    }
    case 'breathPhase': {
      const b = breathAt(cfg.breath!, s.elapsed / 1000);
      return (
        <>
          <Label k={k}><span className="tabular-nums">{Math.max(1, Math.ceil(b.phaseLen - b.phaseT))} s</span></Label>
          <Big gold>{paused ? 'Pausado' : BREATH_LABEL[b.phase]}</Big>
          <Bar value={b.phaseT / b.phaseLen} marker={false} />
          <p className="mt-2" style={{ fontSize: 12.5, color: C.paper3 }}>
            {cfg.breath!.inhale} s inspirar · {cfg.breath!.hold} s segurar · {cfg.breath!.exhale} s expirar
          </p>
        </>
      );
    }
    case 'breathCycle': {
      const b = breathAt(cfg.breath!, s.elapsed / 1000);
      const total = Math.ceil(session.totalMs / 1000 / b.cycle);
      return (
        <>
          <Label k={k} />
          <Big>{Math.min(total, b.index + 1)} de {total}</Big>
        </>
      );
    }
  }
}

function Result({ k, session }: { k: MetricKey; session: Session }) {
  const s = session.snap;
  const value =
    k === 'continuity' && s.continuity !== null ? `${Math.round(s.continuity * 100)}%`
    : k === 'sync' && s.sync !== null ? `${Math.round(s.sync * 100)}%`
    : k === 'accuracy' && s.accuracy !== null ? `${s.accuracy}%`
    : k === 'softening' && s.softening !== null ? `${Math.max(0, Math.round((1 - s.softening) * 100))}% mais suave`
    : k === 'breathCycle' ? 'Completo'
    : null;
  return (
    <>
      <Label k={k} />
      <Big dim={!value}>{value ?? '—'}</Big>
    </>
  );
}

function CentsScale({ cents }: { cents: number | null }) {
  const pos = cents === null ? 50 : 50 + clamp(cents, -100, 100) / 2;
  const hit = cents !== null && Math.abs(cents) <= 50;
  return (
    <div className="relative mt-3 h-6" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(232,228,220,0.18)' }} />
      <div className="absolute top-1/2 h-[10px] -translate-y-1/2 rounded-full" style={{ left: '25%', right: '25%', background: 'rgba(232,201,126,0.14)' }} />
      <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: 'rgba(232,201,126,0.6)' }} />
      {cents !== null && (
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left,background-color] duration-150" style={{ left: `${pos}%`, background: hit ? '#E8C97E' : '#D9D2C3', boxShadow: hit ? '0 0 12px rgba(232,201,126,0.7)' : undefined }} />
      )}
      <span className="absolute -bottom-3 left-0" style={{ fontSize: 10.5, color: C.paper3 }}>−100</span>
      <span className="absolute -bottom-3 right-0" style={{ fontSize: 10.5, color: C.paper3 }}>+100</span>
    </div>
  );
}

function DirectionGlyph({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <path
        d={dir === 'up' ? 'M4 16 L18 6 M11 6 H18 V13' : dir === 'down' ? 'M4 6 L18 16 M18 9 V16 H11' : 'M3 11 H19'}
        fill="none"
        stroke="#E8C97E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
