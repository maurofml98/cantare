import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowDown, ArrowUp, ChevronDown, Copy, FileDown, GripVertical, MoreHorizontal, Pencil, Play, Plus, Search, Trash2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { C, LINING, Panel, SANS, SERIF, Segmented, focusRing } from '@/components/home/primitives';
import { CinematicImage } from '@/components/media/CinematicImage';
import { KeyGrid } from '@/components/repertorio/KeyPicker';
import { ProjectFormDialog } from '@/components/repertorio/ProjectFormDialog';
import { SongForm, type SongFormValues } from '@/components/repertorio/SongForm';
import { SongRow, DRAG_MIME } from '@/components/repertorio/SongRow';
import { TrendingSongsDialog } from '@/components/repertorio/TrendingSongsDialog';
import {
  addBlock, addSong, blockSongs, createProject, deleteBlock, deleteProject, deleteSong, duplicateProject, durationOf,
  formatDuration, loadProjects, moveBlock, moveSong, reserveSongs, showSequence, updateBlock, updateProject, updateSong,
  type SongTarget,
} from '@/lib/repertoire/store';
import { computeRecommendation } from '@/lib/repertoire/keys';
import { loadVocalProfile } from '@/lib/vocal/profile';
import type { RepertoireBlock, RepertoireProject, RepertoireSong } from '@/lib/types';

type Filter = 'todos' | 'proximos' | 'anteriores';
type Sort = 'data' | 'nome' | 'recentes';
type Tab = 'blocos' | 'musicas' | 'reserva' | 'notas';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Cor por posição do bloco — só um fio lateral, para distinguir momentos do show. */
const BLOCK_ACCENTS = ['#B8955A', '#6E93BF', '#C98B5A', '#8C7BB8', '#6FA394', '#B86F6F', '#A3A06F'];

export function RepertoireWorkspace({ selectedId, openNew = false }: { selectedId?: string; openNew?: boolean }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<RepertoireProject[] | null>(null);
  const [filter, setFilter] = useState<Filter>('todos');
  const [sort, setSort] = useState<Sort>('data');
  const [query, setQuery] = useState('');
  const [currentId, setCurrentId] = useState<string | undefined>(selectedId);
  const [tab, setTab] = useState<Tab>('blocos');
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; editing: RepertoireProject | null }>({ open: false, editing: null });
  // chegou por "Novo show" da Home: abre o formulário uma vez e limpa o ?novo da URL
  useEffect(() => {
    if (!openNew) return;
    setProjectDialog({ open: true, editing: null });
    navigate({ to: '/repertorio', search: {}, replace: true });
  }, [openNew, navigate]);
  const [confirmDelete, setConfirmDelete] = useState<RepertoireProject | null>(null);
  const [songDialog, setSongDialog] = useState<{ open: boolean; song: RepertoireSong | null; target?: SongTarget }>({ open: false, song: null });
  const [spotify, setSpotify] = useState<{ open: boolean; target?: SongTarget; label?: string; query?: string }>({ open: false });
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ songId?: string; blockId?: string; reserve?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setProjects(loadProjects());
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar seus repertórios.');
      setProjects([]);
    }
  }, []);

  useEffect(reload, [reload]);
  useEffect(() => setCurrentId(selectedId), [selectedId]);

  /** Envolve toda gravação: recarrega, avisa em caso de erro. */
  const act = useCallback(
    (fn: () => void, successMsg?: string) => {
      try {
        fn();
        reload();
        if (successMsg) toast.success(successMsg);
        return true;
      } catch (err) {
        console.error(err);
        toast.error('Não foi possível salvar a alteração. Tente novamente.');
        return false;
      }
    },
    [reload],
  );

  const flash = (id: string) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 900);
  };

  /* ---------- lista de projetos ---------- */

  const today = todayIso();
  const counts = useMemo(() => {
    const list = projects ?? [];
    return {
      todos: list.length,
      proximos: list.filter((p) => p.date && p.date >= today).length,
      anteriores: list.filter((p) => p.date && p.date < today).length,
    };
  }, [projects, today]);

  const visible = useMemo(() => {
    let list = [...(projects ?? [])];
    if (filter === 'proximos') list = list.filter((p) => p.date && p.date >= today);
    if (filter === 'anteriores') list = list.filter((p) => p.date && p.date < today);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.venue?.toLowerCase().includes(q) || p.songs.some((s) => s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      if (sort === 'nome') return a.name.localeCompare(b.name, 'pt-BR');
      if (sort === 'recentes') return b.updatedAt.localeCompare(a.updatedAt);
      // data: próximos primeiro (mais perto), depois sem data, depois anteriores (mais recente primeiro)
      const rank = (p: RepertoireProject) => (!p.date ? 1 : p.date >= today ? 0 : 2);
      const r = rank(a) - rank(b);
      if (r) return r;
      if (!a.date || !b.date) return b.updatedAt.localeCompare(a.updatedAt);
      return rank(a) === 0 ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });
    return list;
  }, [projects, filter, query, sort, today]);

  const nextShowId = useMemo(
    () => (projects ?? []).filter((p) => p.date && p.date >= today).sort((a, b) => a.date!.localeCompare(b.date!))[0]?.id,
    [projects, today],
  );

  const project = useMemo(() => {
    if (!projects?.length) return null;
    return projects.find((p) => p.id === currentId) ?? projects.find((p) => p.id === nextShowId) ?? [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }, [projects, currentId, nextShowId]);

  const selectProject = (id: string) => {
    setCurrentId(id);
    setSelectedSongId(null);
    navigate({ to: '/repertorio/$projectId', params: { projectId: id }, replace: true });
  };

  /* ---------- derivados do projeto ---------- */

  const sequence = project ? showSequence(project) : [];
  const reserve = project ? reserveSongs(project) : [];
  const dur = durationOf(sequence.map((s) => s.song));
  const selectedSong = project?.songs.find((s) => s.id === selectedSongId) ?? null;
  const missingKey = sequence.filter((s) => !s.song.currentKey);

  /* ---------- ações ---------- */

  const submitProject = async (input: Parameters<typeof createProject>[0] & object) => {
    if (typeof input === 'string') return;
    if (projectDialog.editing) {
      const id = projectDialog.editing.id;
      if (act(() => updateProject(id, { name: input.name, type: input.type, date: input.date, venue: input.venue, place: input.place, targetMinutes: input.targetMinutes }), 'Projeto atualizado')) {
        setProjectDialog({ open: false, editing: null });
      }
    } else {
      let created: RepertoireProject | null = null;
      if (act(() => { created = createProject(input); }, 'Projeto criado')) {
        setProjectDialog({ open: false, editing: null });
        if (created) {
          selectProject((created as RepertoireProject).id);
          setTab('blocos');
        }
      }
    }
  };

  const duplicate = (p: RepertoireProject) => {
    setBusy(`dup-${p.id}`);
    let copy: RepertoireProject | null = null;
    const ok = act(() => { copy = duplicateProject(p.id); });
    setBusy(null);
    if (ok && copy) {
      toast.success('Projeto duplicado', { description: 'Ajuste a data e o que mudar no novo show.' });
      selectProject((copy as RepertoireProject).id);
    }
  };

  const exportPdf = (p: RepertoireProject) => {
    setBusy(`pdf-${p.id}`);
    navigate({ to: '/repertorio/imprimir/$projectId', params: { projectId: p.id } });
  };

  const openStage = (p: RepertoireProject) => {
    setBusy(`stage-${p.id}`);
    navigate({ to: '/palco/$projectId', params: { projectId: p.id } });
  };

  const setKey = (song: RepertoireSong, key: string) => {
    if (!project) return;
    const profile = loadVocalProfile();
    const rec = computeRecommendation({ currentKey: key, difficulty: song.difficulty }, profile);
    if (act(() => updateSong(project.id, song.id, { currentKey: key, originalKey: song.originalKey || key, ...rec }))) {
      flash(song.id);
      toast.success(`Tom de “${song.title}”: ${key}`);
      // Próxima pendência de tom ganha foco, para definir em sequência.
      const nextMissing = sequence.find((s) => !s.song.currentKey && s.song.id !== song.id);
      if (selectedSongId === song.id && nextMissing) setSelectedSongId(nextMissing.song.id);
    }
  };

  const submitSong = (v: SongFormValues) => {
    if (!project) return;
    const profile = loadVocalProfile();
    const rec = v.currentKey ? computeRecommendation({ currentKey: v.currentKey, difficulty: 'unknown' }, profile) : {};
    if (songDialog.song) {
      const id = songDialog.song.id;
      if (act(() => updateSong(project.id, id, { ...v, originalKey: songDialog.song!.originalKey || v.currentKey, ...rec }), 'Música atualizada')) {
        flash(id);
        setSongDialog({ open: false, song: null });
      }
    } else {
      let created: RepertoireSong | null = null;
      if (act(() => { created = addSong(project.id, { ...v, originalKey: v.currentKey, difficulty: 'unknown', status: 'to_study', ...rec }, songDialog.target); }, 'Música adicionada')) {
        setSongDialog({ open: false, song: null });
        if (created) {
          flash((created as RepertoireSong).id);
          if (!v.currentKey) setSelectedSongId((created as RepertoireSong).id);
        }
      }
    }
  };

  const moveStep = (song: RepertoireSong, dir: -1 | 1) => {
    if (!project) return;
    const inReserve = project.reserveIds.includes(song.id);
    if (inReserve) {
      const i = project.reserveIds.indexOf(song.id);
      act(() => moveSong(project.id, song.id, { kind: 'reserve' }, i + dir));
    } else {
      const block = project.blocks.find((b) => b.songIds.includes(song.id))!;
      const i = block.songIds.indexOf(song.id);
      act(() => moveSong(project.id, song.id, { kind: 'block', blockId: block.id }, i + dir));
    }
    flash(song.id);
  };

  /* ---------- arrastar e soltar ---------- */

  const onDragStartSong = (song: RepertoireSong) => (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_MIME, song.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const isSongDrag = (e: React.DragEvent) => e.dataTransfer.types.includes(DRAG_MIME);

  const dropOnSong = (target: SongTarget, beforeSongId: string) => (e: React.DragEvent) => {
    if (!project || !isSongDrag(e)) return;
    e.preventDefault();
    e.stopPropagation(); // senão o bloco também recebe o drop e manda a música para o fim
    const songId = e.dataTransfer.getData(DRAG_MIME);
    setDropHint(null);
    if (songId === beforeSongId) return;
    const list = target.kind === 'reserve' ? project.reserveIds : project.blocks.find((b) => b.id === target.blockId)!.songIds;
    const without = list.filter((id) => id !== songId);
    const index = without.indexOf(beforeSongId);
    act(() => moveSong(project.id, songId, target, index));
    flash(songId);
  };
  const dropOnContainer = (target: SongTarget) => (e: React.DragEvent) => {
    if (!project || !isSongDrag(e)) return;
    e.preventDefault();
    const songId = e.dataTransfer.getData(DRAG_MIME);
    setDropHint(null);
    act(() => moveSong(project.id, songId, target));
    flash(songId);
    if (target.kind === 'reserve') toast('Movida para a reserva');
  };
  const overSong = (songId: string) => (e: React.DragEvent) => {
    if (!isSongDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (dropHint?.songId !== songId) setDropHint({ songId });
  };
  const overContainer = (hint: { blockId?: string; reserve?: boolean }) => (e: React.DragEvent) => {
    if (!isSongDrag(e) && !e.dataTransfer.types.includes('application/x-cantare-block')) return;
    e.preventDefault();
    if (dropHint?.blockId !== hint.blockId || dropHint?.reserve !== hint.reserve) setDropHint(hint);
  };

  /* ---------- render ---------- */

  if (!projects) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Carregando repertório">
        <div className="h-28 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-12" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-[8px] bg-white/[0.03] lg:col-span-3" />)}
      </div>
    );
  }

  const rowProps = (song: RepertoireSong, position: number | null, place: SongTarget, list: string[], blockName?: string) => ({
    song,
    position,
    blockName,
    selected: selectedSongId === song.id,
    flash: flashId === song.id,
    dropBefore: dropHint?.songId === song.id,
    blocks: project!.blocks,
    inReserve: place.kind === 'reserve',
    canMoveUp: list.indexOf(song.id) > 0,
    canMoveDown: list.indexOf(song.id) < list.length - 1,
    onSelect: () => setSelectedSongId((cur) => (cur === song.id ? null : song.id)),
    onKey: (k: string) => setKey(song, k),
    onEdit: () => setSongDialog({ open: true, song }),
    onMove: (t: SongTarget) => {
      act(() => moveSong(project!.id, song.id, t));
      flash(song.id);
      toast(t.kind === 'reserve' ? 'Movida para a reserva' : `Movida para ${project!.blocks.find((b) => b.id === (t as { blockId: string }).blockId)?.name}`);
    },
    onMoveStep: (dir: -1 | 1) => moveStep(song, dir),
    onRemove: () => {
      if (act(() => deleteSong(project!.id, song.id))) toast('Música removida', { description: song.title });
    },
    onDragStartSong: onDragStartSong(song),
    onDragOverRow: overSong(song.id),
    onDropRow: dropOnSong(place, song.id),
  });

  return (
    <div style={LINING} className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* ================= Cabeçalho ================= */}
      <header className="flex flex-wrap items-end justify-between gap-4 px-1 xl:col-span-12">
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 4vw, 68px)', color: C.paper, lineHeight: 1 }}>
            Meus <em style={{ color: C.gold }}>projetos</em>
          </h1>
          <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2 }}>
            Organize seus shows, monte seus blocos e tenha sempre suas músicas por perto.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="relative flex-1 sm:w-[340px] sm:flex-none">
            <span className="sr-only">Buscar projetos, músicas ou artistas</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,228,220,0.4)]" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projetos, músicas ou artistas" className="h-11 border-white/10 bg-white/[0.03] pl-9" />
          </label>
          <Button size="lg" onClick={() => setProjectDialog({ open: true, editing: null })}>
            <Plus /> Novo projeto
          </Button>
        </div>
      </header>

      {projects.length === 0 ? (
        <section className="relative flex min-h-[420px] flex-col items-start justify-center gap-5 overflow-hidden rounded-[8px] p-8 md:p-12 xl:col-span-12 2xl:min-h-[560px]" style={{ border: `1px solid ${C.rule}`, background: '#0D0F12' }}>
          <CinematicImage name="cantare-repertorio-preparacao" priority kenBurns overlay="left" intensity={1} position="70% 50%" sizes="100vw" />
          <p className="relative" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 3vw, 44px)', color: C.paper, lineHeight: 1.1 }}>Monte seu primeiro show.</p>
          <p className="relative max-w-xl" style={{ fontFamily: SANS, fontSize: 16, color: C.paper2, lineHeight: 1.55 }}>
            Crie um projeto para organizar músicas, tons e blocos. Na hora do show, o Modo Palco mostra só o que importa: a próxima música e o tom.
          </p>
          <Button size="lg" className="relative" onClick={() => setProjectDialog({ open: true, editing: null })}><Plus /> Criar primeiro projeto</Button>
        </section>
      ) : (
        <>
          {/* ================= Área principal ================= */}
          <div className="flex min-w-0 flex-col gap-5 xl:col-span-9">
            {/* filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                label="Filtrar projetos"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'todos', label: `Todos · ${counts.todos}` },
                  { value: 'proximos', label: `Próximos · ${counts.proximos}` },
                  { value: 'anteriores', label: `Anteriores · ${counts.anteriores}` },
                ]}
              />
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger aria-label="Ordenar projetos" className="h-10 w-[190px] border-white/10 bg-white/[0.03]"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#111318]">
                  <SelectItem value="data">Ordenar por data</SelectItem>
                  <SelectItem value="nome">Ordenar por nome</SelectItem>
                  <SelectItem value="recentes">Editados recentemente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* cards */}
            {visible.length === 0 ? (
              <p className="rounded-[8px] px-5 py-6" style={{ border: `1px dashed ${C.rule}`, fontFamily: SANS, fontSize: 14, color: C.paper2 }}>
                {query ? `Nenhum projeto com “${query}”.` : filter === 'proximos' ? 'Nenhum show com data marcada daqui pra frente. Adicione a data no projeto.' : 'Nenhum projeto neste filtro.'}
              </p>
            ) : (
              <ul className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
                {visible.map((p) => (
                  <ProjectCard
                    key={p.id}
                    p={p}
                    active={project?.id === p.id}
                    isNext={p.id === nextShowId}
                    past={!!p.date && p.date < today}
                    busy={busy}
                    onOpen={() => selectProject(p.id)}
                    onEdit={() => setProjectDialog({ open: true, editing: p })}
                    onDuplicate={() => duplicate(p)}
                    onPdf={() => exportPdf(p)}
                    onDelete={() => setConfirmDelete(p)}
                  />
                ))}
              </ul>
            )}

            {/* projeto selecionado */}
            {project && (
              <Panel className="min-w-0" bodyClassName="!p-0">
                <div className="relative flex flex-wrap items-start justify-between gap-5 overflow-hidden p-5 2xl:p-6" style={{ borderBottom: `1px solid ${C.rule}` }}>
                  <CinematicImage name="cantare-home-palco" overlay="full" intensity={0.95} vignette={false} fade="left" position="35% 45%" className="!left-auto hidden w-[60%] md:block" sizes="40vw" />
                  <div className="relative min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 2.4vw, 40px)', color: C.paper, lineHeight: 1.05 }}>{project.name}</h2>
                      <Button variant="secondary" size="sm" onClick={() => setProjectDialog({ open: true, editing: project })}><Pencil /> Editar</Button>
                    </div>
                    <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>
                      {[project.type, project.venue, project.date ? longDate(project.date) : null].filter(Boolean).join(' · ')}
                      {!project.date && (
                        <button type="button" onClick={() => setProjectDialog({ open: true, editing: project })} className={`ml-2 rounded-sm underline underline-offset-4 ${focusRing}`} style={{ color: C.gold }}>
                          adicionar data
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="relative">
                    <DurationMeter seconds={dur.seconds} estimated={dur.estimatedCount} songs={dur.songCount} targetMinutes={project.targetMinutes} onSetTarget={() => setProjectDialog({ open: true, editing: project })} />
                  </div>

                  <div className="relative flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="lg"
                      disabled={sequence.length === 0}
                      title={sequence.length === 0 ? 'Adicione músicas aos blocos para usar no palco' : undefined}
                      loading={busy === `stage-${project.id}`}
                      loadingLabel="Abrindo Modo Palco"
                      onClick={() => openStage(project)}
                    >
                      <Play className="fill-current" /> Modo Palco
                    </Button>
                    <ProjectMenu p={project} busy={busy} onEdit={() => setProjectDialog({ open: true, editing: project })} onDuplicate={() => duplicate(project)} onPdf={() => exportPdf(project)} onDelete={() => setConfirmDelete(project)} />
                  </div>
                </div>

                {/* abas */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 2xl:px-6">
                  <div role="tablist" aria-label="Seções do projeto" className="flex flex-wrap gap-1">
                    {([
                      ['blocos', `Blocos`, project.blocks.length],
                      ['musicas', 'Músicas', sequence.length],
                      ['reserva', 'Reserva', reserve.length],
                      ['notas', 'Anotações', null],
                    ] as [Tab, string, number | null][]).map(([id, label, n]) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        onDragOver={id === 'reserva' ? overContainer({ reserve: true }) : undefined}
                        onDrop={id === 'reserva' ? dropOnContainer({ kind: 'reserve' }) : undefined}
                        className={`h-10 rounded-[6px] px-4 transition-[background-color,color,box-shadow] duration-[var(--dur-hover)] active:scale-[0.97] ${focusRing}`}
                        style={{
                          fontFamily: SANS,
                          fontSize: 14,
                          color: tab === id ? C.ink : C.paper2,
                          background: tab === id ? C.gold : dropHint?.reserve && id === 'reserva' ? 'rgba(184,149,90,0.2)' : 'transparent',
                        }}
                      >
                        {label}
                        {n !== null && <span className="ml-1.5 tabular-nums" style={{ opacity: 0.7 }}>{n}</span>}
                      </button>
                    ))}
                  </div>
                  {tab === 'blocos' && (
                    <Button variant="secondary" size="sm" onClick={() => {
                      let b: RepertoireBlock | null = null;
                      if (act(() => { b = addBlock(project.id, `Bloco ${project.blocks.length + 1}`); })) {
                        if (b) { setRenaming((b as RepertoireBlock).id); setExpanded((e) => ({ ...e, [(b as RepertoireBlock).id]: true })); }
                      }
                    }}>
                      <Plus /> Adicionar bloco
                    </Button>
                  )}
                  {tab === 'reserva' && (
                    <span className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setSpotify({ open: true, target: { kind: 'reserve' }, label: 'Reserva' })}><Search /> Buscar</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSongDialog({ open: true, song: null, target: { kind: 'reserve' } })}><Plus /> Manual</Button>
                    </span>
                  )}
                </div>

                <div className="p-3 pt-3 sm:p-5 2xl:px-6">
                  {tab === 'blocos' && (
                    <ol className="flex flex-col gap-2">
                      {project.blocks.map((b, bi) => {
                        const songs = blockSongs(project, b);
                        const bd = durationOf(songs);
                        const open = expanded[b.id] ?? bi === 0;
                        const startPos = sequence.findIndex((s) => s.block?.id === b.id) + 1;
                        return (
                          <li
                            key={b.id}
                            className="rounded-[8px] transition-[box-shadow,background-color] duration-[var(--dur-hover)]"
                            style={{
                              border: `1px solid ${C.rule}`,
                              background: dropHint?.blockId === b.id ? 'rgba(184,149,90,0.07)' : 'rgba(255,255,255,0.012)',
                              boxShadow: `inset 3px 0 0 ${BLOCK_ACCENTS[bi % BLOCK_ACCENTS.length]}${dropHint?.blockId === b.id ? ', 0 0 0 1px rgba(184,149,90,0.5)' : ''}`,
                            }}
                            onDragOver={overContainer({ blockId: b.id })}
                            onDrop={(e) => {
                              if (e.dataTransfer.types.includes('application/x-cantare-block')) {
                                e.preventDefault();
                                const id = e.dataTransfer.getData('application/x-cantare-block');
                                setDropHint(null);
                                if (id !== b.id) act(() => moveBlock(project.id, id, bi));
                                return;
                              }
                              dropOnContainer({ kind: 'block', blockId: b.id })(e);
                            }}
                          >
                            <div
                              className="flex items-center gap-2 py-2 pl-2 pr-2 sm:pl-3"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('application/x-cantare-block', b.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                            >
                              <span className="hidden cursor-grab text-[rgba(232,228,220,0.3)] active:cursor-grabbing sm:block" aria-hidden><GripVertical size={16} /></span>
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" style={{ border: `1px solid ${C.rule}`, fontFamily: SANS, fontSize: 13, color: C.paper2 }}>{bi + 1}</span>
                              {renaming === b.id ? (
                                <BlockRename
                                  block={b}
                                  onSave={(name, description) => {
                                    act(() => updateBlock(project.id, b.id, { name: name || b.name, description }));
                                    setRenaming(null);
                                  }}
                                  onCancel={() => setRenaming(null)}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setExpanded((e) => ({ ...e, [b.id]: !open }))}
                                  aria-expanded={open}
                                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-[4px] px-1 py-1 text-left ${focusRing}`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate" style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 500, color: C.paper }}>{b.name}</span>
                                    {b.description && <span className="block truncate" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3 }}>{b.description}</span>}
                                  </span>
                                  <span className="hidden shrink-0 sm:block" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
                                    {songs.length} {songs.length === 1 ? 'música' : 'músicas'}
                                  </span>
                                  <span className="w-16 shrink-0 text-right tabular-nums" style={{ fontFamily: SANS, fontSize: 13.5, color: BLOCK_ACCENTS[bi % BLOCK_ACCENTS.length] }}>
                                    {songs.length ? formatDuration(bd.seconds, bd.estimatedCount > 0) : '—'}
                                  </span>
                                  <ChevronDown size={16} className="shrink-0 text-[rgba(232,228,220,0.45)] transition-transform duration-[var(--dur-state)]" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
                                </button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" aria-label={`Ações do bloco ${b.name}`}><MoreHorizontal /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#111318]">
                                  <DropdownMenuItem onSelect={() => setRenaming(b.id)}><Pencil /> Renomear e descrever</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setSpotify({ open: true, target: { kind: 'block', blockId: b.id }, label: b.name })}><Search /> Buscar músicas</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setSongDialog({ open: true, song: null, target: { kind: 'block', blockId: b.id } })}><Plus /> Adicionar manualmente</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled={bi === 0} onSelect={() => act(() => moveBlock(project.id, b.id, bi - 1))}><ArrowUp /> Subir bloco</DropdownMenuItem>
                                  <DropdownMenuItem disabled={bi === project.blocks.length - 1} onSelect={() => act(() => moveBlock(project.id, b.id, bi + 1))}><ArrowDown /> Descer bloco</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={project.blocks.length === 1}
                                    onSelect={() => {
                                      if (act(() => deleteBlock(project.id, b.id))) toast(`Bloco “${b.name}” excluído`, { description: songs.length ? `${songs.length} ${songs.length === 1 ? 'música foi' : 'músicas foram'} para a reserva.` : undefined });
                                    }}
                                    className="text-[#D9A08C] focus:text-[#F0C4B4]"
                                  >
                                    <Trash2 /> Excluir bloco
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {open && (
                              <div className="px-1 pb-2 sm:px-2">
                                {songs.length === 0 ? (
                                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] px-4 py-4" style={{ border: `1px dashed ${C.rule}` }}>
                                    <span style={{ fontFamily: SANS, fontSize: 13.5, color: C.paper2 }}>Arraste músicas para este bloco ou adicione novas.</span>
                                    <span className="flex gap-2">
                                      <Button variant="secondary" size="sm" onClick={() => setSpotify({ open: true, target: { kind: 'block', blockId: b.id }, label: b.name })}><Search /> Buscar</Button>
                                      <Button variant="ghost" size="sm" onClick={() => setSongDialog({ open: true, song: null, target: { kind: 'block', blockId: b.id } })}><Plus /> Manual</Button>
                                    </span>
                                  </div>
                                ) : (
                                  <ul className="flex flex-col">
                                    {songs.map((s, si) => (
                                      <SongRow key={s.id} {...rowProps(s, startPos + si, { kind: 'block', blockId: b.id }, b.songIds)} />
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {tab === 'musicas' && (
                    sequence.length === 0 ? (
                      <EmptyInline text="Comece adicionando as músicas que você pretende cantar." onSearch={() => setSpotify({ open: true, target: { kind: 'block', blockId: project.blocks[0].id }, label: project.blocks[0].name })} onManual={() => setSongDialog({ open: true, song: null })} />
                    ) : (
                      <ul className="flex flex-col">
                        {sequence.map(({ song, block, position }) => (
                          <SongRow key={song.id} {...rowProps(song, position, { kind: 'block', blockId: block!.id }, block!.songIds, block!.name)} />
                        ))}
                      </ul>
                    )
                  )}

                  {tab === 'reserva' && (
                    <div onDragOver={overContainer({ reserve: true })} onDrop={dropOnContainer({ kind: 'reserve' })} className="rounded-[8px]" style={{ outline: dropHint?.reserve ? `1px solid ${C.gold}` : undefined }}>
                      <p className="mb-2 px-1" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
                        Coringas para pedidos e mudanças de clima. Não entram na duração do show.
                      </p>
                      {reserve.length === 0 ? (
                        <EmptyInline text="Adicione alguns coringas para pedidos e mudanças de clima." onSearch={() => setSpotify({ open: true, target: { kind: 'reserve' }, label: 'Reserva' })} onManual={() => setSongDialog({ open: true, song: null, target: { kind: 'reserve' } })} />
                      ) : (
                        <ul className="flex flex-col">
                          {reserve.map((s) => <SongRow key={s.id} {...rowProps(s, null, { kind: 'reserve' }, project.reserveIds)} />)}
                        </ul>
                      )}
                    </div>
                  )}

                  {tab === 'notas' && <NotesEditor key={project.id} project={project} onSave={(notes) => act(() => updateProject(project.id, { notes }))} />}
                </div>
              </Panel>
            )}

            {/* adicionar música + tom */}
            {project && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <AddSongPanel project={project} onSearch={(q, target, label) => setSpotify({ open: true, target, label, query: q })} onManual={(target) => setSongDialog({ open: true, song: null, target })} />
                <Panel title="Tom da música" subtitle={selectedSong ? `Selecione o tom em que você canta “${selectedSong.title}”.` : missingKey.length ? `${missingKey.length} ${missingKey.length === 1 ? 'música está' : 'músicas estão'} sem tom.` : 'Toque numa música para ajustar o tom.'} labelledBy="tom">
                  {selectedSong ? (
                    <KeyGrid value={selectedSong.currentKey} onChange={(k) => setKey(selectedSong, k)} />
                  ) : missingKey.length ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="secondary" onClick={() => { setSelectedSongId(missingKey[0].song.id); setTab('musicas'); }}>Definir tons pendentes</Button>
                      <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Começando por “{missingKey[0].song.title}”.</span>
                    </div>
                  ) : (
                    <p style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>{sequence.length ? 'Todas as músicas do show têm tom. Confira antes de subir no palco.' : 'Adicione músicas para definir os tons.'}</p>
                  )}
                </Panel>
              </div>
            )}
          </div>

          {/* ================= Coluna lateral ================= */}
          {project && (
            <aside className="flex min-w-0 flex-col gap-5 xl:col-span-3">
              <StagePreview project={project} busy={busy === `stage-${project.id}`} onOpen={() => openStage(project)} />
              <TipsPanel
                missingKey={missingKey.length}
                reserve={reserve.length}
                hasDate={!!project.date}
                gapMin={project.targetMinutes ? project.targetMinutes - Math.round(dur.seconds / 60) : null}
                onFixKeys={() => { if (missingKey[0]) { setSelectedSongId(missingKey[0].song.id); setTab('musicas'); } }}
                onReserve={() => setTab('reserva')}
                onEdit={() => setProjectDialog({ open: true, editing: project })}
              />
            </aside>
          )}
        </>
      )}

      {/* ================= Diálogos ================= */}
      <ProjectFormDialog open={projectDialog.open} onOpenChange={(o) => setProjectDialog((d) => ({ ...d, open: o }))} initial={projectDialog.editing} onSubmit={submitProject} />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="border-white/10 bg-[#0F1114] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">Excluir “{confirmDelete?.name}”?</DialogTitle>
            <DialogDescription>Blocos, músicas, tons e anotações deste projeto serão apagados. Não dá para desfazer.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                const p = confirmDelete!;
                if (act(() => deleteProject(p.id))) {
                  toast('Projeto excluído', { description: p.name });
                  setConfirmDelete(null);
                  if (project?.id === p.id) navigate({ to: '/repertorio', replace: true });
                }
              }}
            >
              <Trash2 /> Excluir projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {project && (
        <>
          <SongForm
            open={songDialog.open}
            onOpenChange={(o) => setSongDialog((d) => ({ ...d, open: o }))}
            initial={songDialog.song}
            onSubmit={submitSong}
            onDelete={songDialog.song ? () => {
              const s = songDialog.song!;
              if (act(() => deleteSong(project.id, s.id))) { toast('Música removida', { description: s.title }); setSongDialog({ open: false, song: null }); }
            } : undefined}
          />
          <TrendingSongsDialog
            project={project}
            open={spotify.open}
            onOpenChange={(o) => setSpotify((s) => ({ ...s, open: o }))}
            target={spotify.target}
            targetLabel={spotify.label}
            initialQuery={spotify.query}
            onSongsAdded={reload}
          />
        </>
      )}

      <style>{`
        .rep-flash { animation: rep-flash 900ms var(--ease-out) 1; }
        @keyframes rep-flash { 0% { background-color: rgba(184,149,90,0.25) } 100% { background-color: transparent } }
      `}</style>
    </div>
  );
}

/* ======================================================================= */

function longDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ProjectMenu({ p, busy, onEdit, onDuplicate, onPdf, onDelete }: { p: RepertoireProject; busy: string | null; onEdit: () => void; onDuplicate: () => void; onPdf: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Mais ações de ${p.name}`} loading={busy === `dup-${p.id}` || busy === `pdf-${p.id}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#111318]">
        <DropdownMenuItem onSelect={onEdit}><Pencil /> Editar projeto</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicar projeto</DropdownMenuItem>
        <DropdownMenuItem onSelect={onPdf}><FileDown /> Exportar PDF</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-[#D9A08C] focus:text-[#F0C4B4]"><Trash2 /> Excluir projeto</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectCard({ p, active, isNext, past, busy, onOpen, onEdit, onDuplicate, onPdf, onDelete }: {
  p: RepertoireProject; active: boolean; isNext: boolean; past: boolean; busy: string | null;
  onOpen: () => void; onEdit: () => void; onDuplicate: () => void; onPdf: () => void; onDelete: () => void;
}) {
  const seq = showSequence(p);
  const d = durationOf(seq.map((s) => s.song));
  const date = p.date ? new Date(`${p.date}T12:00:00`) : null;
  return (
    <li className="w-[260px] shrink-0 snap-start 2xl:w-[290px]" style={{ opacity: past && !active ? 0.62 : 1 }}>
      <div
        className="group relative flex h-full flex-col rounded-[8px] p-4 transition-[transform,border-color,background-color,opacity] duration-[var(--dur-hover)] hover:-translate-y-0.5 hover:opacity-100 motion-lift"
        style={{
          border: `1px solid ${active ? 'rgba(184,149,90,0.7)' : C.rule}`,
          background: active ? 'radial-gradient(120% 100% at 0% 0%, rgba(184,149,90,0.12), transparent 60%), #0F1114' : 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)',
        }}
      >
        <button type="button" onClick={onOpen} aria-current={active ? 'true' : undefined} className={`absolute inset-0 rounded-[8px] ${focusRing}`} aria-label={`Abrir ${p.name}`} />
        <div className="pointer-events-none relative flex items-start justify-between gap-2">
          {date ? (
            <div className="leading-none">
              <span className="block uppercase" style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
              <span className="block" style={{ fontFamily: SERIF, fontSize: 34, color: C.paper }}>{String(date.getDate()).padStart(2, '0')}</span>
              <span className="block uppercase" style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
            </div>
          ) : (
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Sem data</span>
          )}
          {isNext && <span className="mr-9 rounded-[4px] px-2 py-0.5" style={{ fontFamily: SANS, fontSize: 11, color: C.ink, background: C.gold }}>Próximo show</span>}
        </div>
        <p className="pointer-events-none relative mt-3 truncate" style={{ fontFamily: SERIF, fontSize: 22, color: C.paper, lineHeight: 1.15 }}>{p.name}</p>
        <p className="pointer-events-none relative truncate" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3 }}>{[p.type, p.venue].filter(Boolean).join(' · ')}</p>
        <p className="pointer-events-none relative mt-3 flex gap-4" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
          <span>{seq.length} {seq.length === 1 ? 'música' : 'músicas'}</span>
          <span>{seq.length ? formatDuration(d.seconds, d.estimatedCount > 0) : '—'}</span>
        </p>
        <div className="absolute right-2 top-2">
          <ProjectMenu p={p} busy={busy} onEdit={onEdit} onDuplicate={onDuplicate} onPdf={onPdf} onDelete={onDelete} />
        </div>
      </div>
    </li>
  );
}

function DurationMeter({ seconds, estimated, songs, targetMinutes, onSetTarget }: { seconds: number; estimated: number; songs: number; targetMinutes?: number; onSetTarget: () => void }) {
  const min = Math.round(seconds / 60);
  const pct = targetMinutes ? Math.min(100, (min / targetMinutes) * 100) : 0;
  const diff = targetMinutes ? targetMinutes - min : 0;
  return (
    <div className="min-w-[240px]">
      <p style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Duração total{estimated > 0 && songs > 0 ? ' (estimada)' : ''}</p>
      <p style={{ fontFamily: SERIF, fontSize: 30, color: C.paper, lineHeight: 1.1 }}>{songs ? formatDuration(seconds, estimated > 0) : '0min'}</p>
      {targetMinutes ? (
        <>
          <div className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
            <div className="h-full rounded-full transition-[width] duration-[var(--dur-progress)] ease-[var(--ease-out)]" style={{ width: `${pct}%`, background: diff < 0 ? '#C98B5A' : C.gold }} />
          </div>
          <p className="mt-1" style={{ fontFamily: SANS, fontSize: 12.5, color: diff > 0 ? '#D2A45E' : diff < 0 ? '#C98B5A' : '#7FB59A' }}>
            {diff > 0 ? `Faltam ${formatDuration(diff * 60)} para ${formatDuration(targetMinutes * 60)}` : diff < 0 ? `Passa ${formatDuration(-diff * 60)} de ${formatDuration(targetMinutes * 60)}` : 'Na medida da duração desejada'}
          </p>
        </>
      ) : (
        <button type="button" onClick={onSetTarget} className={`mt-1 rounded-sm underline underline-offset-4 ${focusRing}`} style={{ fontFamily: SANS, fontSize: 12.5, color: C.gold }}>
          Definir duração desejada
        </button>
      )}
      {estimated > 0 && songs > 0 && (
        <p style={{ fontFamily: SANS, fontSize: 11.5, color: C.paper3 }}>{estimated} sem duração contam ~3min45 cada</p>
      )}
    </div>
  );
}

function BlockRename({ block, onSave, onCancel }: { block: RepertoireBlock; onSave: (name: string, description?: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(block.name);
  const [desc, setDesc] = useState(block.description ?? '');
  return (
    <form
      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name.trim(), desc.trim() || undefined);
      }}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do bloco" className="h-9 w-44 border-white/15 bg-background" />
      <Input value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Descrição do bloco" placeholder="Descrição (opcional)" className="h-9 min-w-0 flex-1 border-white/15 bg-background" />
      <Button size="sm" type="submit">Salvar</Button>
      <Button size="sm" variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
    </form>
  );
}

function EmptyInline({ text, onSearch, onManual }: { text: string; onSearch: () => void; onManual: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] px-5 py-6" style={{ border: `1px dashed ${C.rule}` }}>
      <span style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>{text}</span>
      <span className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onSearch}><Search /> Buscar músicas</Button>
        <Button variant="ghost" size="sm" onClick={onManual}><Plus /> Adicionar manualmente</Button>
      </span>
    </div>
  );
}

function NotesEditor({ project, onSave }: { project: RepertoireProject; onSave: (notes: string) => boolean }) {
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
      <Textarea
        value={value}
        onChange={(e) => schedule(e.target.value)}
        rows={8}
        placeholder="Combinados com a banda, pedidos da noite, ordem de entrada..."
        className="border-white/10 bg-background text-[15px]"
        aria-label="Anotações do projeto"
      />
      <p className="mt-2" aria-live="polite" style={{ fontFamily: SANS, fontSize: 12.5, color: state === 'error' ? C.warn : C.paper3 }}>
        {state === 'saving' ? 'Salvando…' : state === 'saved' ? 'Anotações salvas' : state === 'error' ? 'Não foi possível salvar. Tente novamente.' : 'Salva automaticamente enquanto você digita.'}
      </p>
    </div>
  );
}

function AddSongPanel({ project, onSearch, onManual }: { project: RepertoireProject; onSearch: (q: string, target: SongTarget, label: string) => void; onManual: (target: SongTarget) => void }) {
  const [mode, setMode] = useState<'busca' | 'manual'>('busca');
  const [q, setQ] = useState('');
  const [dest, setDest] = useState<string>(project.blocks[project.blocks.length - 1]?.id ?? 'reserve');
  useEffect(() => {
    if (dest !== 'reserve' && !project.blocks.some((b) => b.id === dest)) setDest(project.blocks[project.blocks.length - 1]?.id ?? 'reserve');
  }, [project.blocks, dest]);
  const target: SongTarget = dest === 'reserve' ? { kind: 'reserve' } : { kind: 'block', blockId: dest };
  const label = dest === 'reserve' ? 'Reserva' : project.blocks.find((b) => b.id === dest)?.name ?? '';

  return (
    <Panel title="Adicionar música" subtitle="Busque por música, artista ou gênero — ou digite você mesmo." labelledBy="add">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented size="sm" label="Forma de adicionar" value={mode} onChange={setMode} options={[{ value: 'busca', label: 'Buscar' }, { value: 'manual', label: 'Manualmente' }]} />
        <Select value={dest} onValueChange={setDest}>
          <SelectTrigger aria-label="Onde adicionar" className="h-9 w-[200px] border-white/10 bg-white/[0.03] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111318]">
            {project.blocks.map((b, i) => <SelectItem key={b.id} value={b.id}>Em {i + 1}. {b.name}</SelectItem>)}
            <SelectItem value="reserve">Na reserva</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === 'busca' ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(q, target, label);
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Buscar música ou artista</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,228,220,0.4)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: Evidências, Marília Mendonça, modão" className="h-11 border-white/10 bg-background pl-9" />
          </label>
          <Button type="submit" variant="secondary" className="h-11">Buscar</Button>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => onManual(target)}><Plus /> Nova música em {label}</Button>
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Nome, artista e tom. Sem precisar do Spotify.</span>
        </div>
      )}
      <p className="mt-3" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>A busca traz nome, artista e duração. O tom é você quem define.</p>
    </Panel>
  );
}

function StagePreview({ project, busy, onOpen }: { project: RepertoireProject; busy: boolean; onOpen: () => void }) {
  const seq = showSequence(project);
  const first = seq[0];
  return (
    <Panel
      title="Modo Palco"
      subtitle="Tela cheia, letra grande, só o essencial durante o show."
      labelledBy="palco"
      media={<CinematicImage name="cantare-modo-palco" overlay="full" intensity={0.85} position="50% 40%" sizes="(max-width: 1280px) 100vw, 25vw" />}
    >
      <div className="relative mx-auto w-full max-w-[300px] rounded-[26px] p-2" style={{ background: '#050506', border: '1px solid rgba(232,228,220,0.12)' }}>
        <div className="flex min-h-[330px] flex-col rounded-[20px] px-5 py-5" style={{ background: '#000' }}>
          {first ? (
            <>
              <div className="flex justify-between" style={{ fontFamily: SANS, fontSize: 12 }}>
                <span style={{ color: C.gold }}>Próxima música</span>
                <span style={{ color: C.paper3 }}>1 / {seq.length}</span>
              </div>
              <p className="mt-1" style={{ fontFamily: SANS, fontSize: 11.5, color: C.paper3 }}>{first.block?.name}</p>
              <p className="mt-auto break-words text-center" style={{ fontFamily: SERIF, fontSize: 30, color: '#fff', lineHeight: 1.05 }}>{first.song.title}</p>
              <p className="mt-1 text-center" style={{ fontFamily: SERIF, fontSize: 16, color: C.paper2 }}>{first.song.artist}</p>
              <div className="mx-auto mt-4 flex h-20 w-24 flex-col items-center justify-center rounded-[10px]" style={{ border: '1px solid rgba(184,149,90,0.4)' }}>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>Tom</span>
                <span style={{ fontFamily: SERIF, fontSize: 34, color: first.song.currentKey ? C.gold : '#D2A45E', lineHeight: 1 }}>{first.song.currentKey || '?'}</span>
              </div>
              <div className="mt-auto rounded-[10px] py-3 text-center" style={{ background: C.gold, color: C.ink, fontFamily: SANS, fontSize: 14, fontWeight: 500 }} aria-hidden>Próxima música</div>
            </>
          ) : (
            <p className="m-auto text-center" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2 }}>Adicione músicas aos blocos para ver a prévia do palco.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <Button className="w-full" size="lg" variant="primary" disabled={!first} loading={busy} loadingLabel="Abrindo Modo Palco" onClick={onOpen} title={!first ? 'Adicione músicas aos blocos' : undefined}>
          <Play className="fill-current" /> Abrir Modo Palco
        </Button>
        <p className="mt-2 text-center" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Funciona sem internet depois de aberto. A tela fica acesa quando o aparelho permite.</p>
      </div>
    </Panel>
  );
}

function TipsPanel({ missingKey, reserve, hasDate, gapMin, onFixKeys, onReserve, onEdit }: {
  missingKey: number; reserve: number; hasDate: boolean; gapMin: number | null; onFixKeys: () => void; onReserve: () => void; onEdit: () => void;
}) {
  const tips: { title: string; text: string; action?: { label: string; run: () => void } }[] = [];
  if (missingKey > 0) tips.push({ title: `${missingKey} ${missingKey === 1 ? 'música sem tom' : 'músicas sem tom'}`, text: 'Confira todos os tons antes do show.', action: { label: 'Definir agora', run: onFixKeys } });
  if (reserve < 5) tips.push({ title: 'Tenha músicas de reserva', text: `Você tem ${reserve}. Alguns coringas salvam pedidos e mudanças de clima.`, action: { label: 'Ver reserva', run: onReserve } });
  if (gapMin !== null && gapMin > 10) tips.push({ title: `Faltam cerca de ${gapMin} minutos`, text: 'Adicione músicas ou estenda um bloco para fechar a duração.' });
  if (!hasDate) tips.push({ title: 'Marque a data do show', text: 'Assim ele aparece em Próximos e ganha destaque.', action: { label: 'Adicionar data', run: onEdit } });
  if (tips.length === 0) tips.push({ title: 'Repertório pronto', text: 'Tons definidos, reserva montada. Bom show!' });

  return (
    <Panel title="Dicas" subtitle="A partir do que falta neste projeto." labelledBy="dicas">
      <ul className="flex flex-col gap-2.5">
        {tips.slice(0, 4).map((t) => (
          <li key={t.title} className="rounded-[6px] px-3 py-2.5" style={{ border: `1px solid ${C.rule}`, background: 'rgba(255,255,255,0.015)' }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>{t.title}</p>
            <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3, lineHeight: 1.4 }}>{t.text}</p>
            {t.action && (
              <button type="button" onClick={t.action.run} className={`mt-1 rounded-sm underline underline-offset-4 ${focusRing}`} style={{ fontFamily: SANS, fontSize: 12.5, color: C.gold }}>
                {t.action.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
