import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { RepertoireSong, SongDifficulty, SongStatus } from '@/lib/types';

export interface SongFormValues {
  title: string;
  artist?: string;
  originalKey: string;
  currentKey: string;
  difficulty: SongDifficulty;
  status: SongStatus;
  vocalNote?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RepertoireSong | null;
  onSubmit: (values: SongFormValues) => void;
  onDelete?: () => void;
}

const DIFFICULTY: { value: SongDifficulty; label: string }[] = [
  { value: 'unknown', label: 'Não avaliada' },
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Média' },
  { value: 'hard', label: 'Difícil' },
];

const STATUS: { value: SongStatus; label: string }[] = [
  { value: 'to_study', label: 'A estudar' },
  { value: 'training', label: 'Em treino' },
  { value: 'ready', label: 'Pronta' },
  { value: 'difficult', label: 'Difícil' },
];

const EMPTY: SongFormValues = {
  title: '',
  artist: '',
  originalKey: 'C',
  currentKey: 'C',
  difficulty: 'unknown',
  status: 'to_study',
  vocalNote: '',
};

export function SongForm({ open, onOpenChange, initial, onSubmit, onDelete }: Props) {
  const [values, setValues] = useState<SongFormValues>(EMPTY);

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              title: initial.title,
              artist: initial.artist ?? '',
              originalKey: initial.originalKey,
              currentKey: initial.currentKey,
              difficulty: initial.difficulty,
              status: initial.status,
              vocalNote: initial.vocalNote ?? '',
            }
          : EMPTY,
      );
    }
  }, [open, initial]);

  const canSubmit = values.title.trim().length > 0 && values.currentKey.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/5">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? 'Editar música' : 'Nova música'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Título">
            <Input
              className="bg-background border-white/5"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              placeholder="Nome da música"
            />
          </Field>
          <Field label="Artista">
            <Input
              className="bg-background border-white/5"
              value={values.artist}
              onChange={(e) => setValues({ ...values, artist: e.target.value })}
              placeholder="Quem canta?"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tom original">
              <Input
                className="bg-background border-white/5"
                value={values.originalKey}
                onChange={(e) => setValues({ ...values, originalKey: e.target.value })}
                placeholder="Ex.: G"
              />
            </Field>
            <Field label="Tom atual">
              <Input
                className="bg-background border-white/5"
                value={values.currentKey}
                onChange={(e) => setValues({ ...values, currentKey: e.target.value })}
                placeholder="Ex.: F#"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dificuldade">
              <Select
                value={values.difficulty}
                onValueChange={(v) => setValues({ ...values, difficulty: v as SongDifficulty })}
              >
                <SelectTrigger className="bg-background border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/5">
                  {DIFFICULTY.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={values.status}
                onValueChange={(v) => setValues({ ...values, status: v as SongStatus })}
              >
                <SelectTrigger className="bg-background border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/5">
                  {STATUS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Observação">
            <Textarea
              className="bg-background border-white/5 min-h-[80px]"
              value={values.vocalNote}
              onChange={(e) => setValues({ ...values, vocalNote: e.target.value })}
              placeholder="Anotações vocais, trechos difíceis, etc."
            />
          </Field>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-primary text-background font-bold h-12"
            disabled={!canSubmit}
            onClick={() => canSubmit && onSubmit(values)}
          >
            {initial ? 'Salvar alterações' : 'Adicionar música'}
          </Button>
          {initial && onDelete && (
            <Button
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onDelete}
            >
              Excluir música
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-widest text-muted">{label}</Label>
      {children}
    </div>
  );
}
