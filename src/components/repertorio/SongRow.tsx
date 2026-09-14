import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Pencil, Trash2, Archive, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { C, SANS } from '@/components/home/primitives';
import { formatSongTime, type SongTarget } from '@/lib/repertoire/store';
import type { RepertoireBlock, RepertoireSong } from '@/lib/types';

export interface DragPayload {
  kind: 'song';
  songId: string;
}

export const DRAG_MIME = 'application/x-cantare-song';

/**
 * Linha compacta de música: posição · nome/artista · tom · duração · ações.
 * Arrastável no desktop; o menu oferece as mesmas ações para teclado e toque.
 */
export function SongRow({
  song,
  position,
  blockName,
  selected,
  flash,
  dropBefore,
  blocks,
  inReserve,
  canMoveUp,
  canMoveDown,
  onSelect,
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
  blockName?: string;
  selected: boolean;
  flash: boolean;
  dropBefore: boolean;
  blocks: RepertoireBlock[];
  inReserve: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onKey: (key: string) => void;
  onEdit: () => void;
  onMove: (target: SongTarget) => void;
  onMoveStep: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDragStartSong: (e: React.DragEvent) => void;
  onDragOverRow: (e: React.DragEvent) => void;
  onDropRow: (e: React.DragEvent) => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStartSong}
      onDragOver={onDragOverRow}
      onDrop={onDropRow}
      className={`group relative flex items-center gap-2 rounded-[6px] py-1.5 pl-1 pr-1.5 transition-[background-color,box-shadow] duration-[var(--dur-hover)] hover:bg-white/[0.025] ${flash ? 'rep-flash' : ''}`}
      style={{
        background: selected ? 'rgba(184,149,90,0.08)' : undefined,
        boxShadow: dropBefore ? `inset 0 2px 0 ${C.gold}` : undefined,
      }}
    >
      <span className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[rgba(232,228,220,0.25)] group-hover:text-[rgba(232,228,220,0.6)] active:cursor-grabbing sm:flex" aria-hidden>
        <GripVertical size={15} />
      </span>
      <span className="w-7 shrink-0 text-right tabular-nums" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
        {position !== null ? String(position).padStart(2, '0') : '·'}
      </span>

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[4px] px-2 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B8955A]/60"
      >
        {song.albumImageUrl && <img src={song.albumImageUrl} alt="" loading="lazy" className="hidden h-8 w-8 shrink-0 rounded-[4px] object-cover opacity-80 md:block" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate" style={{ fontFamily: SANS, fontSize: 15, color: C.paper, fontWeight: 500 }}>{song.title}</span>
          <span className="block truncate" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3 }}>
            {song.artist ?? 'Artista não informado'}
            {blockName && <span> · {blockName}</span>}
            {song.recommendedKey && song.recommendedKey !== song.currentKey && song.currentKey && (
              <span style={{ color: 'rgba(184,149,90,0.8)' }}> · sugerido {song.recommendedKey}</span>
            )}
          </span>
        </span>
      </button>

      <KeyChip value={song.currentKey} onChange={onKey} songTitle={song.title} />

      <span
        className="hidden w-12 shrink-0 text-right tabular-nums sm:block"
        style={{ fontFamily: SANS, fontSize: 13, color: song.durationSec ? C.paper2 : C.paper3 }}
        title={song.durationSec ? 'Duração da música' : 'Sem duração: o total usa uma estimativa de 3min45'}
      >
        {song.durationSec ? formatSongTime(song.durationSec) : '~3:45'}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${song.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#111318]">
          <DropdownMenuLabel className="truncate text-[12px] font-normal text-[rgba(232,228,220,0.5)]">{song.title}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onEdit}><Pencil /> Editar música e tom</DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onMoveStep(-1)}><ArrowUp /> Subir</DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onMoveStep(1)}><ArrowDown /> Descer</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><ListMusic /> Mover para bloco</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="border-white/10 bg-[#111318]">
              {blocks.map((b, i) => (
                <DropdownMenuItem key={b.id} onSelect={() => onMove({ kind: 'block', blockId: b.id })}>
                  {i + 1}. {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {!inReserve && <DropdownMenuItem onSelect={() => onMove({ kind: 'reserve' })}><Archive /> Mover para reserva</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onRemove} className="text-[#D9A08C] focus:text-[#F0C4B4]"><Trash2 /> Remover do projeto</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
