import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { RepertoireProject } from '@/lib/types';
import { addSong, loadProjects } from '@/lib/repertoire/store';
import { toRepertoireSong, type CreatedSong } from '@/lib/criar/library';
import { useTema } from '@/lib/tema';

/**
 * Criação → repertório: liga as duas pernas da tríade. Lista os shows do cantor; um toque
 * adiciona a música ao projeto. O conteúdo carrega `.tema-novo` porque o Radix renderiza fora
 * da árvore da página.
 */
export function AddToRepertoireDialog({ song, onOpenChange }: { song: CreatedSong | null; onOpenChange: (open: boolean) => void }) {
  const { tema } = useTema();
  const [projects, setProjects] = useState<RepertoireProject[] | null>(null);
  useEffect(() => {
    if (!song) return;
    try {
      setProjects(loadProjects());
    } catch {
      setProjects([]);
    }
  }, [song]);

  const add = (p: RepertoireProject) => {
    if (!song) return;
    try {
      addSong(p.id, toRepertoireSong(song));
      toast.success('Adicionada ao repertório', { description: `${song.title} → ${p.name}` });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível adicionar. Tente de novo.');
    }
  };

  return (
    <Dialog.Root open={!!song} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(17,24,46,0.45)]" />
        <Dialog.Content data-tema={tema} className="tema-novo fixed inset-x-3 bottom-3 z-50 max-h-[80dvh] overflow-y-auto rounded-[20px] p-5 shadow-xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-[20px] font-extrabold" style={{ color: 'var(--c-text)' }}>Adicionar ao repertório</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[14px]" style={{ color: 'var(--c-text-2)' }}>{song?.title}</Dialog.Description>
            </div>
            <Dialog.Close className="c-focus flex h-11 w-11 items-center justify-center rounded-[12px]" aria-label="Fechar" style={{ color: 'var(--c-text-2)' }}>
              <X size={20} />
            </Dialog.Close>
          </div>

          {projects === null ? null : projects.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-[14px] p-4" style={{ background: 'var(--c-surface-blue)' }}>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--c-text)' }}>Você ainda não tem um repertório.</p>
              <Link
                to="/repertorio"
                search={{ novo: true }}
                className="c-press c-focus inline-flex min-h-[48px] items-center gap-2 rounded-[14px] px-5 text-[15px] font-bold text-white"
                style={{ background: 'var(--c-primary)' }}
              >
                <Plus size={18} /> Criar repertório
              </Link>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => add(p)}
                    className="c-lift c-focus flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[14px] border bg-[var(--c-inner)] px-4 text-left"
                    style={{ borderColor: 'var(--c-border)' }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-bold" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                      <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>
                        {p.songs.length} {p.songs.length === 1 ? 'música' : 'músicas'}
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-2)' }} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
