import { Link } from '@tanstack/react-router';
import { Check, Lock, SlidersHorizontal } from 'lucide-react';
import type { CreationPath, VocalToneStatus } from '@/lib/criar/options';

/**
 * A decisão principal da tela: "No meu tom" (usa o teste vocal) ou "Personalizada".
 * Radiogroup de dois cartões grandes. Sem teste vocal, "No meu tom" vira convite — nunca
 * "bloqueado".
 */
export function CreationPathSelector({ value, onChange, vocal }: { value: CreationPath; onChange: (p: CreationPath) => void; vocal: VocalToneStatus }) {
  return (
    <div role="radiogroup" aria-label="Como você quer criar" className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 sm:gap-4">
      <VocalToneOption selected={value === 'meu-tom'} onSelect={() => onChange('meu-tom')} vocal={vocal} />
      <CustomToneOption selected={value === 'personalizada'} onSelect={() => onChange('personalizada')} />
    </div>
  );
}

function OptionShell({
  selected,
  available,
  onSelect,
  children,
  label,
}: {
  selected: boolean;
  available: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={!available || undefined}
      aria-label={label}
      tabIndex={available ? 0 : -1}
      onClick={available ? onSelect : undefined}
      onKeyDown={(e) => {
        if (available && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`c-focus relative flex flex-col gap-2 min-[560px]:min-h-[200px] rounded-[20px] border-2 p-5 transition-[border-color,background-color] duration-200 ${available ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: selected ? 'var(--c-create)' : 'var(--c-border)',
        background: selected ? 'var(--c-create-bg)' : available ? 'var(--c-surface)' : 'var(--c-muted-bg)',
      }}
    >
      {children}
      {available && (
        <span
          aria-hidden
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200"
          style={{ borderColor: selected ? 'var(--c-create)' : 'var(--c-line-strong)', background: selected ? 'var(--c-create-fill)' : 'var(--c-field)' }}
        >
          {selected && <Check size={14} strokeWidth={3} color="#fff" />}
        </span>
      )}
    </div>
  );
}

function ToneMark({ muted }: { muted: boolean }) {
  const bars = [10, 18, 26, 18, 10];
  return (
    <svg width="34" height="28" viewBox="0 0 34 28" aria-hidden>
      {bars.map((h, i) => (
        <rect key={i} x={2 + i * 6.5} y={14 - h / 2} width="3.5" height={h} rx="1.75" fill={muted ? 'var(--c-text-2)' : 'var(--c-create)'} />
      ))}
    </svg>
  );
}

function VocalToneOption({ selected, onSelect, vocal }: { selected: boolean; onSelect: () => void; vocal: VocalToneStatus }) {
  const available = vocal.kind === 'ok';
  return (
    <OptionShell selected={selected} available={available} onSelect={onSelect} label="No meu tom">
      <ToneMark muted={!available} />
      <h3 className="pr-8 text-[22px] font-extrabold tracking-[-0.01em] sm:text-[24px]" style={{ color: 'var(--c-text)' }}>
        No meu tom
      </h3>
      {vocal.kind === 'ok' ? (
        <>
          <p className="text-[15px]" style={{ color: 'var(--c-text-2)' }}>Crie na tonalidade certa para a sua voz.</p>
          <dl className="mt-auto grid gap-1 rounded-[12px] bg-[var(--c-inner)] px-3 py-2 text-[14px]">
            <div className="flex justify-between gap-2">
              <dt style={{ color: 'var(--c-text-2)' }}>Extensão medida</dt>
              <dd className="font-bold" style={{ color: 'var(--c-text)' }}>{vocal.profile.lowestNote} – {vocal.profile.highestNote}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt style={{ color: 'var(--c-text-2)' }}>Tom sugerido</dt>
              {/* TODO: sem cálculo real de tom para música nova — `recommendKey` só transpõe música existente */}
              <dd className="text-right font-semibold" style={{ color: 'var(--c-text-2)' }}>no lançamento</dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <p className="text-[15px]" style={{ color: 'var(--c-text-2)' }}>
            {vocal.kind === 'refazer'
              ? 'Seu teste vocal foi feito numa versão anterior. Refaça para criar no seu tom — leva cerca de 3 minutos.'
              : 'Para criar no seu tom, precisamos conhecer sua voz primeiro. Faça o teste vocal — leva cerca de 3 minutos.'}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>
            <Lock size={14} aria-hidden /> Disponível depois do teste
          </span>
          <div className="mt-auto pt-1">
            <Link
              to="/teste-vocal"
              className="c-press c-focus inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[var(--c-inner)] px-4 text-[15px] font-bold"
              style={{ color: 'var(--c-create-ink)', boxShadow: 'inset 0 0 0 1.5px var(--c-create)' }}
            >
              {vocal.kind === 'refazer' ? 'Refazer teste vocal' : 'Fazer teste vocal'}
            </Link>
          </div>
        </>
      )}
    </OptionShell>
  );
}

function CustomToneOption({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <OptionShell selected={selected} available onSelect={onSelect} label="Personalizada">
      <SlidersHorizontal size={28} strokeWidth={2.2} aria-hidden style={{ color: 'var(--c-create)' }} />
      <h3 className="pr-8 text-[22px] font-extrabold tracking-[-0.01em] sm:text-[24px]" style={{ color: 'var(--c-text)' }}>
        Personalizada
      </h3>
      <p className="text-[15px]" style={{ color: 'var(--c-text-2)' }}>Descreva do seu jeito e escolha estilo e tom.</p>
    </OptionShell>
  );
}
