import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronRight, Copy, FileDown, MapPin, MoreHorizontal, Music2, Pencil, Play, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { assetSrc, assetSrcSet } from '@/components/media/CinematicImage';
import { durationOf, formatDuration, showSequence, type SongTarget } from '@/lib/repertoire/store';
import { formatClock, formatGap, showProgress } from '@/lib/repertoire/progress';
import { showDateLabel } from '@/lib/home/shows';
import type { RepertoireBlock, RepertoireProject } from '@/lib/types';

/** Peças do Repertório no tema novo (redesenho de 25/09/2026). Cores só por token `--c-*`. */

const today = () => new Date().toISOString().slice(0, 10);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* ============ Resumo do projeto + duração + ações ============ */

export function ProjectSummary({
  project,
  isNext,
  seconds,
  estimated,
  songCount,
  onEdit,
  onDuplicate,
  onPdf,
  onDelete,
  onStage,
  onAddSearch,
  onAddManual,
  busy,
}: {
  project: RepertoireProject;
  isNext: boolean;
  seconds: number;
  estimated: number;
  songCount: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onPdf: () => void;
  onDelete: () => void;
  onStage: () => void;
  onAddSearch: (target: SongTarget, label: string) => void;
  onAddManual: (target: SongTarget) => void;
  busy: string | null;
}) {
  const date = showDateLabel(project.date);
  const past = !!project.date && project.date < today();
  return (
    <section
      aria-labelledby="projeto-atual"
      className="grid grid-cols-1 gap-5 rounded-[20px] border p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6"
      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', boxShadow: 'var(--c-shadow)' }}
    >
      {/* projeto */}
      <div className="flex min-w-0 gap-4">
        <img
          src={assetSrc('cantare-home-palco', 960)}
          srcSet={assetSrcSet('cantare-home-palco')}
          sizes="120px"
          alt=""
          loading="lazy"
          className="hidden h-[112px] w-[112px] shrink-0 rounded-[14px] object-cover sm:block"
          style={{ objectPosition: '28% 40%', filter: 'brightness(1.3)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
              style={isNext ? { background: 'var(--c-primary)', color: '#fff' } : { background: 'var(--c-muted-bg)', color: 'var(--c-text-2)' }}
            >
              {isNext ? 'Próximo show' : past ? 'Show realizado' : project.date ? 'Show marcado' : 'Sem data'}
            </span>
            <ProjectMenu p={project} busy={busy} onEdit={onEdit} onDuplicate={onDuplicate} onPdf={onPdf} onDelete={onDelete} />
          </div>
          <h2 id="projeto-atual" className="mt-1.5 break-words text-[24px] font-extrabold tracking-[-0.02em] sm:text-[28px]" style={{ color: 'var(--c-text)', lineHeight: 1.1 }}>
            {project.name}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]" style={{ color: 'var(--c-text-2)' }}>
            <li className="font-semibold" style={{ color: 'var(--c-text)' }}>{project.type}</li>
            {date ? (
              <li className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden /> {date}</li>
            ) : (
              <li>
                <button type="button" onClick={onEdit} className="c-focus rounded-sm font-semibold underline underline-offset-4" style={{ color: 'var(--c-primary-ink)' }}>
                  Adicionar data
                </button>
              </li>
            )}
            {project.venue && <li className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={15} aria-hidden /> <span className="truncate">{project.venue}</span></li>}
            <li className="inline-flex items-center gap-1.5"><Music2 size={15} aria-hidden /> {plural(songCount, 'música', 'músicas')}</li>
          </ul>
        </div>
      </div>

      {/* duração + ações */}
      <div className="flex min-w-0 flex-col gap-4 lg:border-l lg:pl-6" style={{ borderColor: 'var(--c-border)' }}>
        <DurationProgress seconds={seconds} estimated={estimated} songs={songCount} targetMinutes={project.targetMinutes} onSetTarget={onEdit} />
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={songCount === 0}
            loading={busy === `stage-${project.id}`}
            loadingLabel="Abrindo Modo Palco"
            onClick={onStage}
            title={songCount === 0 ? 'Adicione músicas aos blocos para usar no palco' : undefined}
          >
            <Play className="fill-current" /> Entrar no Modo Palco
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <AddSongMenu blocks={project.blocks} onSearch={onAddSearch} onManual={onAddManual} />
            <Button variant="secondary" size="lg" className="w-full px-3" onClick={onPdf} loading={busy === `pdf-${project.id}`} loadingLabel="Abrindo PDF">
              <FileDown /> Exportar PDF
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "2h10 de 3h00 · faltam 50 min" — o número mais forte da tela. Estado dito em texto, não só cor. */
function DurationProgress({ seconds, estimated, songs, targetMinutes, onSetTarget }: { seconds: number; estimated: number; songs: number; targetMinutes?: number; onSetTarget: () => void }) {
  const p = showProgress(seconds, targetMinutes);
  const color = p.state === 'acima' ? 'var(--c-warn-ink)' : p.state === 'na-medida' ? 'var(--c-green-ink)' : 'var(--c-primary-ink)';
  const bar = p.state === 'acima' ? 'var(--c-warn-bar)' : p.state === 'na-medida' ? 'var(--c-green)' : 'var(--c-primary)';
  return (
    <div>
      <p className="text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>Duração do show{estimated > 0 && songs > 0 ? ' (estimada)' : ''}</p>
      <div className="mt-0.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p className="tabular-nums" style={{ lineHeight: 1 }}>
          <span className="text-[40px] font-extrabold tracking-[-0.03em] sm:text-[48px]" style={{ color }}>{formatClock(p.minutes)}</span>
          {p.state !== 'sem-meta' && <span className="ml-2 text-[20px] font-bold sm:text-[24px]" style={{ color: 'var(--c-text-2)' }}>de {formatClock(p.target)}</span>}
        </p>
        {p.state === 'sem-meta' ? (
          <button type="button" onClick={onSetTarget} className="c-focus rounded-sm pb-1 text-[14px] font-bold underline underline-offset-4" style={{ color: 'var(--c-primary-ink)' }}>
            Definir duração desejada
          </button>
        ) : (
          <p className="pb-1 text-right text-[15px] font-bold" style={{ color }}>
            {p.state === 'abaixo' ? `faltam ${formatGap(p.diff)}` : p.state === 'acima' ? `${formatGap(p.diff)} acima` : p.diff === 0 ? 'na medida' : `na medida (${p.diff > 0 ? '+' : '−'}${formatGap(p.diff)})`}
          </p>
        )}
      </div>
      {p.state !== 'sem-meta' && (
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--c-track)' }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.pct} aria-label="Duração em relação à meta">
          <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${p.pct}%`, background: bar }} />
        </div>
      )}
      {estimated > 0 && songs > 0 && (
        <p className="mt-1.5 text-[12px]" style={{ color: 'var(--c-text-2)' }}>{plural(estimated, 'música sem duração conta', 'músicas sem duração contam')} 3:45.</p>
      )}
    </div>
  );
}

export function AddSongMenu({ blocks, onSearch, onManual, label = 'Adicionar música' }: { blocks: RepertoireBlock[]; onSearch: (t: SongTarget, label: string) => void; onManual: (t: SongTarget) => void; label?: string }) {
  const last = blocks[blocks.length - 1];
  const target: SongTarget = last ? { kind: 'block', blockId: last.id } : { kind: 'reserve' };
  const name = last?.name ?? 'Reserva';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="lg" className="w-full px-3"><Plus /> {label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onSelect={() => onSearch(target, name)}><Search /> Buscar música</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onManual(target)}><Pencil /> Adicionar manualmente</DropdownMenuItem>
        <p className="px-2 pb-1.5 pt-1 text-[12px] text-muted-foreground">Entra em “{name}”. Dá para mover depois.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectMenu({ p, busy, onEdit, onDuplicate, onPdf, onDelete }: { p: RepertoireProject; busy: string | null; onEdit: () => void; onDuplicate: () => void; onPdf: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Mais ações de ${p.name}`} loading={busy === `dup-${p.id}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onEdit}><Pencil /> Editar projeto</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicar projeto</DropdownMenuItem>
        <DropdownMenuItem onSelect={onPdf}><FileDown /> Exportar PDF</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 /> Excluir projeto</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============ Outros projetos ============ */

const STRIPES = ['var(--c-coral)', 'var(--c-purple)', 'var(--c-green)', 'var(--c-orange)'];

/** Próximos por data, depois sem data (editados por último), depois os que já passaram. */
export function orderProjects(list: RepertoireProject[]): RepertoireProject[] {
  const t = today();
  const rank = (p: RepertoireProject) => (!p.date ? 1 : p.date >= t ? 0 : 2);
  return [...list].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    if (!a.date || !b.date) return b.updatedAt.localeCompare(a.updatedAt);
    return rank(a) === 0 ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
}

function projectFacts(p: RepertoireProject) {
  const seq = showSequence(p);
  const d = durationOf(seq.map((s) => s.song));
  return { songs: seq.length, dur: seq.length ? formatDuration(d.seconds, d.estimatedCount > 0) : null };
}

export function OtherProjects({ projects, currentId, onOpen, onAll }: { projects: RepertoireProject[]; currentId: string; onOpen: (id: string) => void; onAll: () => void }) {
  const others = orderProjects(projects.filter((p) => p.id !== currentId)).slice(0, 4);
  return (
    <section aria-labelledby="outros-projetos" className="rounded-[20px] border p-4" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="outros-projetos" className="text-[18px] font-extrabold" style={{ color: 'var(--c-text)' }}>Outros projetos</h2>
        <Button variant="ghost" size="sm" onClick={onAll}>Ver todos</Button>
      </div>
      {others.length === 0 ? (
        <p className="text-[14px]" style={{ color: 'var(--c-text-2)' }}>Este é o seu único projeto por enquanto.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {others.map((p, i) => {
            const f = projectFacts(p);
            const date = showDateLabel(p.date);
            const past = !!p.date && p.date < today();
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  className="c-lift c-focus flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left"
                  style={{ borderColor: 'var(--c-border)', background: 'var(--c-inner)', opacity: past ? 0.72 : 1 }}
                >
                  <span aria-hidden className="w-1 self-stretch rounded-full" style={{ background: STRIPES[i % STRIPES.length] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                    <span className="block truncate text-[13px]" style={{ color: 'var(--c-text-2)' }}>{[date ?? 'Sem data', p.venue].filter(Boolean).join(' · ')}</span>
                    <span className="block text-[13px]" style={{ color: 'var(--c-text-2)' }}>{plural(f.songs, 'música', 'músicas')}{f.dur ? ` · ${f.dur}` : ''}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-2)' }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Faixa compacta de shows (celular e tablet): trocar com um toque, sem carrossel decorativo. */
export function ProjectStrip({ projects, currentId, onOpen }: { projects: RepertoireProject[]; currentId: string; onOpen: (id: string) => void }) {
  if (projects.length < 2) return null;
  return (
    <nav aria-label="Seus shows" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <ul className="flex w-max gap-2 pb-1">
        {orderProjects(projects).map((p) => {
          const active = p.id === currentId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                aria-current={active ? 'true' : undefined}
                className="c-press c-focus flex min-h-[44px] max-w-[200px] items-center rounded-full border px-4 text-[14px] font-semibold"
                style={active ? { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' } : { background: 'var(--c-surface)', color: 'var(--c-text)', borderColor: 'var(--c-border)' }}
              >
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ============ Trocar de show (todos os projetos) ============ */

type Filter = 'todos' | 'proximos' | 'anteriores';

export function ProjectSwitcher({ open, onOpenChange, projects, currentId, onOpen, onNew }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projects: RepertoireProject[];
  currentId?: string;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const t = today();
  const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = orderProjects(projects).filter((p) => {
    if (filter === 'proximos' && !(p.date && p.date >= t)) return false;
    if (filter === 'anteriores' && !(p.date && p.date < t)) return false;
    const s = fold(q.trim());
    return !s || fold(`${p.name} ${p.venue ?? ''}`).includes(s) || p.songs.some((x) => fold(`${x.title} ${x.artist ?? ''}`).includes(s));
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-extrabold">Seus shows</DialogTitle>
          <DialogDescription>Busque por show, local, música ou artista.</DialogDescription>
        </DialogHeader>
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar"
            className="c-focus min-h-[48px] w-full rounded-[12px] border bg-background pl-10 pr-3 text-[15px] outline-none placeholder:text-[var(--c-placeholder)]"
            style={{ borderColor: 'var(--c-line-strong)', color: 'var(--c-text)' }}
          />
        </label>
        <div role="group" aria-label="Filtrar" className="grid grid-cols-3 gap-1 rounded-[12px] p-1" style={{ background: 'var(--c-track)' }}>
          {(['todos', 'proximos', 'anteriores'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className="c-focus min-h-[40px] rounded-[9px] text-[14px] font-bold"
              style={filter === f ? { background: 'var(--c-inner)', color: 'var(--c-text)', boxShadow: 'inset 0 0 0 1px var(--c-line-strong)' } : { color: 'var(--c-text-2)' }}
            >
              {f === 'todos' ? 'Todos' : f === 'proximos' ? 'Próximos' : 'Anteriores'}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5">
          {list.length === 0 && <li className="py-4 text-center text-[14px] text-muted-foreground">Nenhum show encontrado.</li>}
          {list.map((p) => {
            const f = projectFacts(p);
            const active = p.id === currentId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  aria-current={active ? 'true' : undefined}
                  className="c-focus flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2 text-left"
                  style={{ borderColor: active ? 'var(--c-primary)' : 'var(--c-border)', background: active ? 'var(--c-surface-blue)' : 'var(--c-inner)' }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                    <span className="block truncate text-[13px]" style={{ color: 'var(--c-text-2)' }}>
                      {[showDateLabel(p.date) ?? 'Sem data', plural(f.songs, 'música', 'músicas'), f.dur].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-2)' }} />
                </button>
              </li>
            );
          })}
        </ul>
        <Button size="lg" onClick={onNew}><Plus /> Novo projeto</Button>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Estados e pequenos editores ============ */

export function EmptyState({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[20px] border-2 border-dashed p-6 sm:p-8" style={{ borderColor: 'var(--c-line-strong)', background: 'var(--c-surface)' }}>
      <p className="text-[22px] font-extrabold sm:text-[26px]" style={{ color: 'var(--c-text)' }}>{title}</p>
      <p className="max-w-xl text-[15px]" style={{ color: 'var(--c-text-2)' }}>{text}</p>
      <div className="flex flex-wrap gap-2 pt-1">{action}</div>
    </div>
  );
}

export function BlockRename({ block, onSave, onCancel }: { block: RepertoireBlock; onSave: (name: string, description?: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(block.name);
  const [desc, setDesc] = useState(block.description ?? '');
  const field = 'c-focus min-h-[40px] rounded-[10px] border bg-background px-3 text-[15px] outline-none';
  const style = { borderColor: 'var(--c-line-strong)', color: 'var(--c-text)' };
  return (
    <form
      className="flex min-w-0 flex-1 flex-wrap items-center gap-2 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name.trim(), desc.trim() || undefined);
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do bloco" className={`${field} w-44`} style={style} />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Descrição do bloco" placeholder="Descrição (opcional)" className={`${field} min-w-0 flex-1 placeholder:text-[var(--c-placeholder)]`} style={style} />
      <Button size="sm" type="submit">Salvar</Button>
      <Button size="sm" variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
    </form>
  );
}

export function NotesEditor({ project, onSave }: { project: RepertoireProject; onSave: (notes: string) => boolean }) {
  const [value, setValue] = useState(project.notes ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const schedule = (v: string) => {
    setValue(v);
    setState('saving');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState(onSave(v) ? 'saved' : 'error'), 600);
  };
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => schedule(e.target.value)}
        rows={8}
        placeholder="Combinados com a banda, pedidos da noite, ordem de entrada…"
        aria-label="Anotações do projeto"
        className="c-focus w-full rounded-[14px] border bg-background px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-[var(--c-placeholder)]"
        style={{ borderColor: 'var(--c-line-strong)', color: 'var(--c-text)' }}
      />
      <p className="mt-2 text-[13px]" aria-live="polite" style={{ color: state === 'error' ? 'var(--destructive)' : 'var(--c-text-2)' }}>
        {state === 'saving' ? 'Salvando…' : state === 'saved' ? 'Anotações salvas' : state === 'error' ? 'Não foi possível salvar. Tente novamente.' : 'Salva automaticamente enquanto você digita.'}
      </p>
    </div>
  );
}
