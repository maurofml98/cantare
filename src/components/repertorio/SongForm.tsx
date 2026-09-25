import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KeyGrid } from '@/components/repertorio/KeyPicker';
import type { RepertoireSong } from '@/lib/types';

export interface SongFormValues {
  title: string;
  artist?: string;
  currentKey: string;
  durationSec?: number;
  bpm?: number;
  vocalNote?: string;
  lyrics?: string;
}

/** Editar música: nome, artista, tom (grade), duração, BPM, observação e letra (do próprio cantor). */
export function SongForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RepertoireSong | null;
  onSubmit: (values: SongFormValues) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [duration, setDuration] = useState('');
  const [bpm, setBpm] = useState('');
  const [note, setNote] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setArtist(initial?.artist ?? '');
    setKey(initial?.currentKey ?? '');
    setDuration(initial?.durationSec ? `${Math.floor(initial.durationSec / 60)}:${String(initial.durationSec % 60).padStart(2, '0')}` : '');
    setBpm(initial?.bpm ? String(initial.bpm) : '');
    setNote(initial?.vocalNote ?? '');
    setLyrics(initial?.lyrics ?? '');
    setConfirmDelete(false);
  }, [open, initial]);

  const parseDuration = (v: string) => {
    const m = v.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!m) return undefined;
    return Number(m[1]) * 60 + Number(m[2] ?? 0);
  };
  const durationInvalid = duration.trim() !== '' && parseDuration(duration) === undefined;
  const valid = title.trim().length > 0 && !durationInvalid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0F1114] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{initial ? 'Editar música' : 'Nova música'}</DialogTitle>
          <DialogDescription>O tom é o que mais importa no palco.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSubmit({
              title: title.trim(),
              artist: artist.trim() || undefined,
              currentKey: key,
              durationSec: parseDuration(duration),
              bpm: bpm ? Number(bpm) || undefined : undefined,
              vocalNote: note.trim() || undefined,
              lyrics: lyrics.trim() ? lyrics.trimEnd() : undefined,
            });
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome da música" htmlFor="sf-title">
              <Input id="sf-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/10 bg-background" />
            </Field>
            <Field label="Artista" htmlFor="sf-artist">
              <Input id="sf-artist" value={artist} onChange={(e) => setArtist(e.target.value)} className="border-white/10 bg-background" />
            </Field>
          </div>
          <Field label={key ? `Tom: ${key}` : 'Tom (ainda não definido)'}>
            <KeyGrid value={key} onChange={setKey} compact />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[140px_120px_1fr]">
            <Field label="Duração (m:ss)" htmlFor="sf-dur">
              <Input id="sf-dur" inputMode="numeric" placeholder="3:45" value={duration} onChange={(e) => setDuration(e.target.value)} aria-invalid={durationInvalid} className="border-white/10 bg-background aria-[invalid=true]:border-[#C87F6A]" />
            </Field>
            <Field label="BPM (opcional)" htmlFor="sf-bpm">
              <Input id="sf-bpm" inputMode="numeric" value={bpm} onChange={(e) => setBpm(e.target.value.replace(/\D/g, ''))} className="border-white/10 bg-background" />
            </Field>
            <Field label="Observação" htmlFor="sf-note">
              <Textarea id="sf-note" rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: entrada só voz e violão" className="min-h-10 border-white/10 bg-background" />
            </Field>
          </div>
          {/* Letra: só o que o cantor digita ou cola. Nada de busca em API — direito autoral. */}
          <Field label="Letra (opcional)" htmlFor="sf-lyrics">
            <Textarea
              id="sf-lyrics"
              rows={5}
              maxLength={20000}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Digite ou cole a letra para conferir no Modo Palco."
              className="border-white/10 bg-background"
            />
          </Field>
          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            {initial && onDelete ? (
              confirmDelete ? (
                <span className="flex items-center gap-2">
                  <Button type="button" variant="danger" onClick={onDelete}><Trash2 /> Confirmar remoção</Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>Manter</Button>
                </span>
              ) : (
                <Button type="button" variant="ghost" className="hover:text-[#D9A08C]" onClick={() => setConfirmDelete(true)}><Trash2 /> Remover do projeto</Button>
              )
            ) : <span />}
            <span className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={!valid}>{initial ? 'Salvar' : 'Adicionar'}</Button>
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-normal text-[rgba(232,228,220,0.72)]">{label}</Label>
      {children}
    </div>
  );
}
