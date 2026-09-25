import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RepertoireProject, RepertoireProjectType, VenuePlace } from '@/lib/types';
import type { ProjectInput } from '@/lib/repertoire/store';
import { VenueInput } from './VenueInput';

export const PROJECT_TYPES: RepertoireProjectType[] = ['Show Barzinho', 'Casamento', 'Culto', 'Gravação', 'Ensaio', 'Aula de Canto', 'Outro'];

/** Criar ou editar projeto. Campos mínimos: nome, tipo e data. Local e duração desejada são opcionais. */
export function ProjectFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: RepertoireProject | null;
  onSubmit: (input: ProjectInput) => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<RepertoireProjectType>('Show Barzinho');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [place, setPlace] = useState<VenuePlace | undefined>(undefined);
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setType(initial?.type ?? 'Show Barzinho');
    setDate(initial?.date ?? '');
    setVenue(initial?.venue ?? '');
    setPlace(initial?.place);
    setHours(initial?.targetMinutes ? String(+(initial.targetMinutes / 60).toFixed(2)).replace('.', ',') : '');
    setSaving(false);
  }, [open, initial]);

  const valid = name.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const h = parseFloat(hours.replace(',', '.'));
    try {
      await onSubmit({
        name: name.trim(),
        type,
        date: date || undefined,
        venue: venue.trim() || undefined,
        // local do mapa só vale enquanto o texto é o que veio da sugestão
        place: venue.trim() ? place : undefined,
        targetMinutes: Number.isFinite(h) && h > 0 ? Math.round(h * 60) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light">{initial ? 'Editar projeto' : 'Novo projeto'}</DialogTitle>
          <DialogDescription>{initial ? 'Ajuste os dados do show.' : 'Um projeto por show: “Bar do Zé, sexta”, “Casamento da Ana”.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome do projeto" htmlFor="pf-name">
            <Input id="pf-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Bar do Zé, sexta" className="border-input bg-background" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de evento">
              <Select value={type} onValueChange={(v) => setType(v as RepertoireProjectType)}>
                <SelectTrigger className="border-input bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="border-input bg-popover">
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data do show" htmlFor="pf-date">
              <Input id="pf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-input bg-background [color-scheme:dark]" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Local (opcional)" htmlFor="pf-venue">
              <VenueInput id="pf-venue" value={venue} place={place} onChange={(t, p) => { setVenue(t); setPlace(p); }} />
            </Field>
            <Field label="Duração (horas)" htmlFor="pf-hours">
              <Input id="pf-hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ex.: 3" className="border-input bg-background" />
            </Field>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!valid} loading={saving} loadingLabel="Salvando projeto" title={!valid ? 'Dê um nome ao projeto' : undefined}>
              {initial ? 'Salvar alterações' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
