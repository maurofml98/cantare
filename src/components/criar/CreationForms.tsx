import { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { DESCRIPTION_MAX, DURATIONS, LYRICS_MAX, STYLE_NOTE_MAX, TEMPOS, VOICES, type CreationDraft, type VocalToneStatus } from '@/lib/criar/options';
import { ChoiceChips, FieldHead, KeySelector, SoonTag, StyleSelector, TextArea } from './fields';

type Patch = (p: Partial<CreationDraft>) => void;

function useStyles(draft: CreationDraft, patch: Patch) {
  const [otherOpen, setOtherOpen] = useState(draft.otherStyle.length > 0);
  return {
    styles: draft.styles,
    onToggle: (s: string) => patch({ styles: draft.styles.includes(s) ? draft.styles.filter((x) => x !== s) : [...draft.styles, s] }),
    other: draft.otherStyle,
    onOther: (v: string) => patch({ otherStyle: v }),
    otherOpen,
    onOtherOpen: (v: boolean) => {
      setOtherOpen(v);
      if (!v) patch({ otherStyle: '' });
    },
  };
}

/** Simples: só descrição e estilo — para quem não quer saber de teoria. */
export function SimpleCreationForm({ draft, patch }: { draft: CreationDraft; patch: Patch }) {
  const styles = useStyles(draft, patch);
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Descreva sua música"
        hint="O tema, o clima, para quem é. Do seu jeito."
        value={draft.description}
        onChange={(v) => patch({ description: v })}
        max={DESCRIPTION_MAX}
        rows={5}
        placeholder="Ex.: uma música sobre recomeço, falando de superação e fé, com clima animado, para cantar no meu show."
      />
      <StyleSelector {...styles} />
    </div>
  );
}

/**
 * Avançado: letra, estilo, tom e mais opções. "Mais opções" recolhe — a página não vira um
 * formulário gigante no celular.
 */
export function AdvancedCreationForm({ draft, patch, vocal }: { draft: CreationDraft; patch: Patch; vocal: VocalToneStatus }) {
  const styles = useStyles(draft, patch);
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Letra"
        hint="Escreva ou cole. Pode ser só um trecho."
        value={draft.lyrics}
        onChange={(v) => patch({ lyrics: v })}
        max={LYRICS_MAX}
        rows={6}
        placeholder={'Ex.:\nMesmo distante, eu sinto Tua presença\nQuando o caminho parece não ter fim'}
        action={
          <button
            type="button"
            disabled
            className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-[12px] border border-dashed px-3.5 text-[14px] font-semibold"
            style={{ borderColor: 'var(--c-create-line)', color: 'var(--c-text-2)', background: 'var(--c-inner)' }}
          >
            <Sparkles size={16} aria-hidden style={{ color: 'var(--c-create)' }} /> Gerar letra com IA <SoonTag />
          </button>
        }
      />

      <div className="flex flex-col gap-3">
        <TextArea
          label="Estilo"
          hint="Instrumentos, clima, referência de som."
          value={draft.styleNote}
          onChange={(v) => patch({ styleNote: v })}
          max={STYLE_NOTE_MAX}
          rows={2}
          placeholder="Ex.: gospel contemporâneo, violão e piano, clima de adoração, crescente."
        />
        <StyleSelector {...styles} hint="Atalhos rápidos." />
      </div>

      {draft.path === 'meu-tom' && vocal.kind === 'ok' ? (
        <div>
          <FieldHead label="Tom sugerido para sua voz" hint={`Baseado no seu teste vocal (${vocal.profile.lowestNote} – ${vocal.profile.highestNote}).`} />
          <p className="rounded-[14px] px-4 py-3 text-[15px] font-semibold" style={{ background: 'var(--c-create-bg)', color: 'var(--c-create-ink)' }}>
            A sugestão de tom chega junto com o recurso.
          </p>
        </div>
      ) : (
        <KeySelector value={draft.key} onChange={(v) => patch({ key: v })} />
      )}

      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="mais" className="rounded-[16px] border" style={{ borderColor: 'var(--c-border)', background: 'var(--c-inner)' }}>
          <Accordion.Header>
            <Accordion.Trigger className="c-focus group flex min-h-[56px] w-full items-center justify-between rounded-[16px] px-4 text-left text-[16px] font-bold" style={{ color: 'var(--c-text)' }}>
              Mais opções
              <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--c-text-2)' }}>
                Voz, duração, andamento
                <ChevronDown size={20} aria-hidden className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="flex flex-col gap-5 px-4 pb-5 pt-1">
            <ChoiceChips label="Voz principal" options={VOICES} value={draft.voice} onChange={(v) => patch({ voice: v })} />
            <ChoiceChips label="Duração" options={DURATIONS} value={draft.duration} onChange={(v) => patch({ duration: v })} />
            <ChoiceChips label="Andamento" options={TEMPOS} value={draft.tempo} onChange={(v) => patch({ tempo: v })} />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}
