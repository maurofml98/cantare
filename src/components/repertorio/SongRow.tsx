import { Archive, ArrowDown, ArrowUp, GripVertical, ListMusic, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KeyChip } from '@/components/repertorio/KeyPicker';
import { formatSongTime, type SongTarget } from '@/lib/repertoire/store';
import type { RepertoireBlock, RepertoireSong } from '@/lib/types';

export const DRAG_MIME = 'application/x-cantare-song';

/**
 * Linha de música do Repertório (redesenho de 25/09/2026): ~44 px, escaneável com 45+
 * músicas. Posição · nome · artista · TOM (sempre visível) · duração · ações.
 * Arrasta no desktop; no toque, o menu faz o mesmo (subir, descer, mover).
 */
export function SongRow({
  song,
  position,
  flash,
  dropBefore,
  blocks,
  inReserve,
  canMoveUp,
  canMoveDown,
  compact = false,
  onKey,
  onEdit,
  onMove,
  onMoveStep,
  onRemove,
  onDragStartSong,
  onDragOverRow,
  onDropRow,
}: {
  song: RepertoireSong;
  position: number | null;
  flash: boolean;
  dropBefore: boolean;
  blocks: RepertoireBlock[];
  inReserve: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** coluna estreita (reserva no painel lateral): artista embaixo do nome */
  compact?: boolean;
  onKey: (key: string) => void;
  onEdit: () => void;
  onMove: (target: SongTarget) => void;
  onMoveStep: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDragStartSong: (e: React.DragEvent) => void;
  onDragOverRow: (e: React.DragEvent) => void;
  onDropRow: (e: React.DragEvent) => void;
}) {
  const dur = song.durationSec ? formatSongTime(song.durationSec) : null;
  const wide = !compact;
  return (
    <li
      draggable
      onDragStart={onDragStartSong}
      onDragOver={onDragOverRow}
      onDrop={onDropRow}
      className={`group grid min-h-[44px] items-center gap-x-2 border-b px-1 transition-colors duration-150 last:border-b-0 hover:bg-[var(--c-surface-blue)]/60 ${flash ? 'rep-flash' : ''} ${
        wide
          ? 'grid-cols-[minmax(0,1fr)_auto_40px_32px] sm:grid-cols-[18px_26px_minmax(0,1.5fr)_minmax(0,1fr)_96px_44px_32px]'
          : 'grid-cols-[minmax(0,1fr)_auto_40px_32px] sm:grid-cols-[18px_minmax(0,1fr)_auto_40px_32px]'
      }`}
      style={{ borderColor: 'var(--c-border)', boxShadow: dropBefore ? 'inset 0 2px 0 var(--c-primary)' : undefined }}
    >
      <span className={`hidden cursor-grab sm:flex items-center justify-center active:cursor-grabbing`} aria-hidden style={{ color: 'var(--c-text-2)' }}>
        <GripVertical size={15} />
      </span>
      {wide && (
        <span className="hidden text-right text-[13px] tabular-nums sm:block" style={{ color: 'var(--c-text-2)' }}>
          {position !== null ? position : ''}
        </span>
      )}

      {/* nome (e artista no celular / na coluna estreita) — toque abre a edição */}
      <button type="button" onClick={onEdit} className="c-focus min-w-0 rounded-[6px] py-1.5 text-left" aria-label={`Editar ${song.title}`}>
        <span className="block truncate text-[15px] font-semibold" style={{ color: 'var(--c-text)' }}>
          {wide && position !== null && <span className="mr-1.5 tabular-nums sm:hidden" style={{ color: 'var(--c-text-2)' }}>{position}</span>}
          {song.title}
        </span>
        <span className={`${wide ? 'sm:hidden' : ''} block truncate text-[13px]`} style={{ color: 'var(--c-text-2)' }}>
          {song.artist || 'Artista não informado'}
        </span>
      </button>
      {wide && (
        <span className="hidden truncate text-[14px] sm:block" style={{ color: 'var(--c-text-2)' }}>
          {song.artist || '—'}
        </span>
      )}

      <span className="flex justify-center">
        <KeyChip value={song.currentKey} onChange={onKey} songTitle={song.title} />
      </span>

      <span
        className="text-right text-[13px] tabular-nums"
        style={{ color: 'var(--c-text-2)' }}
        title={dur ? 'Duração da música' : 'Sem duração: o total usa 3:45'}
      >
        {dur ?? '~3:45'}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Ações de ${song.title}`} className="c-focus flex h-9 w-8 items-center justify-center rounded-[8px] hover:bg-[var(--c-surface-blue)]" style={{ color: 'var(--c-text-2)' }}>
            <MoreVertical size={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="truncate text-[12px] font-normal text-muted-foreground">{song.title}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onEdit}><Pencil /> Editar música e tom</DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onMoveStep(-1)}><ArrowUp /> Subir</DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onMoveStep(1)}><ArrowDown /> Descer</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><ListMusic /> Mover para bloco</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {blocks.map((b, i) => (
                <DropdownMenuItem key={b.id} onSelect={() => onMove({ kind: 'block', blockId: b.id })}>
                  {i + 1}. {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {!inReserve && <DropdownMenuItem onSelect={() => onMove({ kind: 'reserve' })}><Archive /> Mover para reserva</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive"><Trash2 /> Remover do projeto</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
