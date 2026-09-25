import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { loadVocalProfile } from '@/lib/vocal/profile';
import { emptyDraft, vocalToneStatus, type CreationDraft, type CreationMode, type VocalToneStatus } from '@/lib/criar/options';
import { CreationPathSelector } from '@/components/criar/CreationPathSelector';
import { AdvancedCreationForm, SimpleCreationForm } from '@/components/criar/CreationForms';
import { CreateGuideButton } from '@/components/criar/CreateGuideButton';
import { CreationLibrary } from '@/components/criar/CreationLibrary';
import { SoonTag } from '@/components/criar/fields';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Route = createFileRoute('/_app/criar')({
  head: () => ({ meta: [{ title: 'Criar música — Cantare' }] }),
  component: CriarPage,
});

/**
 * Criar música (tela de 25/09/2026, referência `referencias/criar-ref.png`). O gerador de guias
 * e bases ainda não existe: a experiência é a definitiva, mas "Criar guia" só avisa que chega em
 * breve. O diferencial a comunicar: criar pensando na voz de quem canta ("No meu tom").
 */
function CriarPage() {
  // perfil vocal só existe no navegador: decide depois de montar
  const [vocal, setVocal] = useState<VocalToneStatus | null>(null);
  const [draft, setDraft] = useState<CreationDraft>(() => emptyDraft('personalizada'));

  useEffect(() => {
    const v = vocalToneStatus(loadVocalProfile());
    setVocal(v);
    // com teste vocal válido, o caminho padrão é o diferencial: "No meu tom"
    if (v.kind === 'ok') setDraft((d) => ({ ...d, path: 'meu-tom' }));
  }, []);

  const patch = (p: Partial<CreationDraft>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-10">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="px-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--c-create-ink)' }}>Transforme ideias em música</p>
            {/* no desktop o botão fica na sidebar */}
            <ThemeToggle className="shrink-0 lg:hidden" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] font-extrabold tracking-[-0.02em] sm:text-[40px]" style={{ color: 'var(--c-text)', lineHeight: 1.05 }}>
              Criar sua música
            </h1>
            <SoonTag />
          </div>
          <p className="mt-2 max-w-[560px] text-[16px]" style={{ color: 'var(--c-text-2)' }}>
            Guias e bases feitas para você cantar — inclusive no tom da sua voz.
          </p>
        </header>

        {vocal === null ? (
          <div aria-hidden className="h-[200px] rounded-[20px]" style={{ background: 'var(--c-surface-blue)' }} />
        ) : (
          <CreationPathSelector value={draft.path} onChange={(p) => patch({ path: p })} vocal={vocal} />
        )}

        <Tabs.Root value={draft.mode} onValueChange={(m) => patch({ mode: m as CreationMode })} className="flex flex-col gap-6">
          <Tabs.List aria-label="Nível de detalhe" className="grid grid-cols-2 gap-1 rounded-[16px] p-1" style={{ background: 'var(--c-track)' }}>
            {(['simples', 'avancado'] as const).map((m) => (
              <Tabs.Trigger
                key={m}
                value={m}
                className="c-focus min-h-[52px] rounded-[12px] text-[16px] font-bold transition-[background-color,color,box-shadow] duration-200 data-[state=active]:bg-[var(--c-inner)] data-[state=active]:text-[var(--c-create-ink)] data-[state=active]:shadow-[inset_0_0_0_1px_var(--c-line-strong)] data-[state=inactive]:text-[var(--c-text-2)]"
              >
                {m === 'simples' ? 'Simples' : 'Avançado'}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="simples" className="outline-none">
            <SimpleCreationForm draft={draft} patch={patch} />
          </Tabs.Content>
          <Tabs.Content value="avancado" className="outline-none">
            {vocal && <AdvancedCreationForm draft={draft} patch={patch} vocal={vocal} />}
          </Tabs.Content>
        </Tabs.Root>

        <CreateGuideButton />
      </div>

      <aside className="min-w-0 xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-[24px] border p-4 sm:p-6" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', boxShadow: 'var(--c-shadow)' }}>
          <CreationLibrary />
        </div>
      </aside>
    </div>
  );
}
