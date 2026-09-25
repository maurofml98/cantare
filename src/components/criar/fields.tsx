import { useId, type ReactNode } from 'react';
import { Check, Plus } from 'lucide-react';
import { KEYS, STYLES } from '@/lib/criar/options';

/** Campos da tela Criar música — linguagem clara (tema `.tema-novo`), toque ≥ 44 px. */

export function FieldHead({ htmlFor, id, label, hint, counter }: { htmlFor?: string; id?: string; label: string; hint?: string; counter?: string }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={htmlFor} id={id} className="block text-[16px] font-bold" style={{ color: 'var(--c-text)' }}>
          {label}
        </label>
        {hint && <p className="mt-0.5 text-[13px]" style={{ color: 'var(--c-text-2)' }}>{hint}</p>}
      </div>
      {counter && <span className="shrink-0 text-[12px] tabular-nums" style={{ color: 'var(--c-text-2)' }}>{counter}</span>}
    </div>
  );
}

const INPUT =
  'c-focus w-full rounded-[14px] border bg-[var(--c-field)] px-4 py-3 text-[16px] leading-relaxed outline-none transition-[border-color] duration-150 placeholder:text-[var(--c-placeholder)] focus:border-[var(--c-create)]';

export function TextArea({
  label,
  hint,
  value,
  onChange,
  max,
  rows,
  placeholder,
  action,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  rows: number;
  placeholder: string;
  action?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <FieldHead htmlFor={id} label={label} hint={hint} counter={`${value.length}/${max}`} />
      <textarea
        id={id}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} resize-y`}
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      />
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder, max }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} min-h-[48px]`}
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      />
    </div>
  );
}

/** Chip de escolha: selecionado = cor de criação + marca de check (não só cor). */
export function Chip({ selected, onClick, children, dashed = false }: { selected: boolean; onClick: () => void; children: ReactNode; dashed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="c-press c-focus inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border px-4 text-[15px] font-semibold transition-[background-color,border-color,color] duration-150"
      style={{
        background: selected ? 'var(--c-create-fill)' : 'var(--c-field)',
        borderColor: selected ? 'var(--c-create-fill)' : 'var(--c-border)',
        borderStyle: dashed && !selected ? 'dashed' : 'solid',
        color: selected ? '#fff' : 'var(--c-text)',
      }}
    >
      {selected ? <Check size={16} strokeWidth={3} aria-hidden /> : dashed ? <Plus size={16} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Estilos: vários podem ser marcados; "Outro estilo" abre um campo livre. */
export function StyleSelector({
  styles,
  onToggle,
  other,
  onOther,
  otherOpen,
  onOtherOpen,
  hint = 'Escolha um ou mais.',
}: {
  styles: string[];
  onToggle: (s: string) => void;
  other: string;
  onOther: (v: string) => void;
  otherOpen: boolean;
  onOtherOpen: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <FieldHead id={id} label="Estilo musical" hint={hint} />
      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <Chip key={s} selected={styles.includes(s)} onClick={() => onToggle(s)}>{s}</Chip>
        ))}
        <Chip selected={otherOpen} onClick={() => onOtherOpen(!otherOpen)} dashed>Outro estilo</Chip>
      </div>
      {otherOpen && (
        <div className="mt-2">
          <TextInput label="Qual estilo?" value={other} onChange={onOther} placeholder="Ex.: arrocha, axé, piseiro" max={40} />
        </div>
      )}
    </div>
  );
}

/** Escolha única em chips (voz, duração, andamento). */
export function ChoiceChips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { value: T; label: string }[]; value: T | ''; onChange: (v: T | '') => void }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <FieldHead id={id} label={label} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={value === o.value} onClick={() => onChange(value === o.value ? '' : o.value)}>{o.label}</Chip>
        ))}
      </div>
    </div>
  );
}

/** Tom: select nativo — melhor em Android simples que lista customizada. */
export function KeySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <FieldHead htmlFor={id} label="Tom" hint="Não sabe? Deixe livre." />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} min-h-[48px] appearance-auto`}
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      >
        {KEYS.map((k) => (
          <option key={k.value || 'livre'} value={k.value}>{k.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Tag "Em breve" da área de criação. */
export function SoonTag({ tone = 'create' }: { tone?: 'create' | 'white' }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
      style={tone === 'white' ? { background: 'rgba(255,255,255,0.22)', color: '#fff' } : { background: 'var(--c-create-bg)', color: 'var(--c-create-ink)', boxShadow: 'inset 0 0 0 1px var(--c-create-line)' }}
    >
      Em breve
    </span>
  );
}
