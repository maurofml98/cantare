import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProjectFormDialog } from '@/components/repertorio/ProjectFormDialog';
import { SongForm, type SongFormValues } from '@/components/repertorio/SongForm';
import { SongRow, DRAG_MIME } from '@/components/repertorio/SongRow';
import { TrendingSongsDialog } from '@/components/repertorio/TrendingSongsDialog';
import { BlockRename, EmptyState, NotesEditor, OtherProjects, ProjectStrip, ProjectSummary, ProjectSwitcher } from '@/components/repertorio/parts';
import {
  addBlock, addSong, blockSongs, createProject, deleteBlock, deleteProject, deleteSong, duplicateProject, durationOf,
  formatDuration, loadProjects, moveBlock, moveSong, reserveSongs, showSequence, updateBlock, updateProject, updateSong,
  type SongTarget,
} from '@/lib/repertoire/store';
import { computeRecommendation } from '@/lib/repertoire/keys';
import { loadVocalProfile } from '@/lib/vocal/profile';
import type { RepertoireBlock, RepertoireProject, RepertoireSong } from '@/lib/types';

type Tab = 'musicas' | 'notas';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Faixa suave por posição do bloco — distingue momentos do show sem arco-íris. */
const BLOCK_TINTS = ['var(--c-block-1)', 'var(--c-block-2)', 'var(--c-block-3)', 'var(--c-block-4)'];

/**
 * Repertório (redesenho de 25/09/2026, referência `referencias/repertorio-ref.png`). Ferramenta de
 * trabalho: projeto → blocos → músicas, densidade para 45+ músicas, tom sempre visível, duração
 * contra a meta em destaque. Tema novo, claro ou escuro.
 */
export function RepertoireWorkspace({ selectedId, openNew = false }: { selectedId?: string; openNew?: boolean }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<RepertoireProject[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [currentId, setCurrentId] = useState<string | undefined>(selectedId);
  const [tab, setTab] = useState<Tab>('musicas');
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; editing: RepertoireProject | null }>({ open: false, editing: null });
  const [switcher, setSwitcher] = useState(false);
  // chegou por "Novo show" da Home: abre o formulário uma vez e limpa o ?novo da URL
  useEffect(() => {
    if (!openNew) return;
    setProjectDialog({ open: true, editing: null });
    navigate({ to: '/repertorio', search: {}, replace: true });
  }, [openNew, navigate]);
  const [confirmDelete, setConfirmDelete] = useState<RepertoireProject | null>(null);
  const [songDialog, setSongDialog] = useState<{ open: boolean; song: RepertoireSong | null; target?: SongTarget }>({ open: false, song: null });
  const [spotify, setSpotify] = useState<{ open: boolean; target?: SongTarget; label?: string; query?: string }>({ open: false });
  const [flashId, setFlashId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ songId?: string; blockId?: string; reserve?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setProjects(loadProjects());
      setLoadError(false);
    } catch (err) {
      console.error(err);
      setLoadError(true);
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

  const today = todayIso();
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
    setSwitcher(false);
    navigate({ to: '/repertorio/$projectId', params: { projectId: id }, replace: true });
  };

  const sequence = project ? showSequence(project) : [];
  const reserve = project ? reserveSongs(project) : [];
  const dur = durationOf(sequence.map((s) => s.song));

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
          setTab('musicas');
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
        if (created) flash((created as RepertoireSong).id);
      }
    }
  };

  const moveStep = (song: RepertoireSong, dir: -1 | 1) => {
    if (!project) return;
    if (project.reserveIds.includes(song.id)) {
      const i = project.reserveIds.indexOf(song.id);
      act(() => moveSong(project.id, song.id, { kind: 'reserve' }, i + dir));
    } else {
      const block = project.blocks.find((b) => b.songIds.includes(song.id))!;
      const i = block.songIds.indexOf(song.id);
      act(() => moveSong(project.id, song.id, { kind: 'block', blockId: block.id }, i + dir));
    }
    flash(song.id);
  };

  const newBlock = () => {
    if (!project) return;
    let b: RepertoireBlock | null = null;
    if (act(() => { b = addBlock(project.id, `Bloco ${project.blocks.length + 1}`); })) {
      if (b) setRenaming((b as RepertoireBlock).id);
    }
  };

  /* ---------- arrastar e soltar (desktop; no toque, o menu da linha faz o mesmo) ---------- */

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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4" role="status" aria-label="Carregando repertório">
        <div className="h-10 w-48 rounded-[12px]" style={{ background: 'var(--c-surface-blue)' }} />
        <div className="h-[180px] rounded-[20px]" style={{ background: 'var(--c-surface-blue)' }} />
        {[0, 1, 2].map((i) => <div key={i} className="h-[160px] rounded-[16px]" style={{ background: 'var(--c-surface-blue)' }} />)}
      </div>
    );
  }

  const rowProps = (song: RepertoireSong, position: number | null, place: SongTarget, list: string[]) => ({
    song,
    position,
    flash: flashId === song.id,
    dropBefore: dropHint?.songId === song.id,
    blocks: project!.blocks,
    inReserve: place.kind === 'reserve',
    canMoveUp: list.indexOf(song.id) > 0,
    canMoveDown: list.indexOf(song.id) < list.length - 1,
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

  const reservePanel = (compact: boolean) =>
    project && (
      <section
        aria-labelledby={compact ? 'reserva-lateral' : 'reserva'}
        onDragOver={overContainer({ reserve: true })}
        onDrop={dropOnContainer({ kind: 'reserve' })}
        className="rounded-[20px] border p-4"
        style={{ background: 'var(--c-surface)', borderColor: dropHint?.reserve ? 'var(--c-reserve-ink)' : 'var(--c-border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id={compact ? 'reserva-lateral' : 'reserva'} className="text-[18px] font-extrabold" style={{ color: 'var(--c-text)' }}>
              Músicas de reserva <span className="ml-1 text-[14px] font-bold tabular-nums" style={{ color: 'var(--c-reserve-ink)' }}>{reserve.length}</span>
            </h2>
            <p className="mt-0.5 text-[13px]" style={{ color: 'var(--c-text-2)' }}>Coringas para pedidos e mudanças no show. Não contam na duração.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSpotify({ open: true, target: { kind: 'reserve' }, label: 'Reserva' })}><Search /> Buscar</Button>
          <Button variant="ghost" size="sm" onClick={() => setSongDialog({ open: true, song: null, target: { kind: 'reserve' } })}><Plus /> Manual</Button>
        </div>
        {reserve.length === 0 ? (
          <p className="mt-3 rounded-[12px] border border-dashed px-4 py-4 text-[14px]" style={{ borderColor: 'var(--c-line-strong)', color: 'var(--c-text-2)' }}>
            Nenhuma reserva ainda. {compact ? 'Arraste músicas dos blocos para cá.' : 'Mova músicas pelo menu de cada uma.'}
          </p>
        ) : (
          <ul className="mt-2 rounded-[12px]" style={{ background: 'var(--c-reserve-bg)' }}>
            {reserve.map((s) => <SongRow key={s.id} compact={compact} {...rowProps(s, null, { kind: 'reserve' }, project.reserveIds)} />)}
          </ul>
        )}
      </section>
    );

  return (
    <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
      {/* ================= Cabeçalho ================= */}
      <header className="flex flex-wrap items-start justify-between gap-3 px-1 xl:col-span-2">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[36px]" style={{ color: 'var(--c-text)', lineHeight: 1.05 }}>Repertório</h1>
          <p className="mt-1 text-[15px] sm:text-[16px]" style={{ color: 'var(--c-text-2)' }}>Organize seus shows e monte sua apresentação.</p>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button variant="secondary" className="xl:hidden" onClick={() => setSwitcher(true)}>Trocar show</Button>
          )}
          <Button size="lg" className="hidden sm:inline-flex" onClick={() => setProjectDialog({ open: true, editing: null })}><Plus /> Novo projeto</Button>
          <ThemeToggle className="shrink-0 lg:hidden" />
        </div>
      </header>

      {loadError && (
        <p role="alert" className="rounded-[14px] px-4 py-3 text-[15px] font-semibold xl:col-span-2" style={{ background: 'var(--c-pending-bg)', color: 'var(--c-pending-ink)' }}>
          Não conseguimos ler seus repertórios neste aparelho. Recarregue a página; se continuar, os dados podem estar danificados.
        </p>
      )}

      {projects.length === 0 ? (
        <div className="xl:col-span-2">
          <EmptyState
            title="Monte seu primeiro show."
            text="Organize músicas, tons e blocos em um só lugar."
            action={<Button size="lg" onClick={() => setProjectDialog({ open: true, editing: null })}><Plus /> Criar repertório</Button>}
          />
        </div>
      ) : (
        project && (
          <>
            {/* ================= Área principal ================= */}
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
              <ProjectSummary
                project={project}
                isNext={project.id === nextShowId}
                seconds={dur.seconds}
                estimated={dur.estimatedCount}
                songCount={sequence.length}
                busy={busy}
                onEdit={() => setProjectDialog({ open: true, editing: project })}
                onDuplicate={() => duplicate(project)}
                onPdf={() => exportPdf(project)}
                onDelete={() => setConfirmDelete(project)}
                onStage={() => openStage(project)}
                onAddSearch={(target, label) => setSpotify({ open: true, target, label })}
                onAddManual={(target) => setSongDialog({ open: true, song: null, target })}
              />

              <div className="xl:hidden">
                <ProjectStrip projects={projects} currentId={project.id} onOpen={selectProject} />
              </div>

              {/* abas + blocos */}
              <section aria-label="Músicas do show" className="rounded-[20px] border" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 pt-2 sm:px-4" style={{ borderColor: 'var(--c-border)' }}>
                  <div role="tablist" aria-label="Seções do projeto" className="flex">
                    {([['musicas', 'Músicas do show'], ['notas', 'Anotações']] as [Tab, string][]).map(([id, label]) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className="c-focus min-h-[44px] rounded-t-[8px] border-b-2 px-3 text-[15px] font-bold transition-colors duration-150"
                        style={{ borderColor: tab === id ? 'var(--c-primary)' : 'transparent', color: tab === id ? 'var(--c-primary-ink)' : 'var(--c-text-2)' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {tab === 'musicas' && <Button variant="ghost" size="sm" onClick={newBlock}><Plus /> Adicionar bloco</Button>}
                </div>

                <div className="p-2 sm:p-3">
                  {tab === 'notas' ? (
                    <div className="p-2"><NotesEditor key={project.id} project={project} onSave={(notes) => act(() => updateProject(project.id, { notes }))} /></div>
                  ) : (
                    <>
                      {sequence.length === 0 && (
                        <div className="mb-3">
                          <EmptyState
                            title="Seu show ainda está vazio."
                            text="Adicione a primeira música para começar a montar os blocos."
                            action={
                              <>
                                <Button onClick={() => setSpotify({ open: true, target: { kind: 'block', blockId: project.blocks[0].id }, label: project.blocks[0].name })}><Search /> Buscar música</Button>
                                <Button variant="secondary" onClick={() => setSongDialog({ open: true, song: null, target: { kind: 'block', blockId: project.blocks[0].id } })}><Plus /> Adicionar manualmente</Button>
                              </>
                            }
                          />
                        </div>
                      )}
                      <ol className="flex flex-col gap-3">
                        {project.blocks.map((b, bi) => {
                          const songs = blockSongs(project, b);
                          const bd = durationOf(songs);
                          const open = !collapsed[b.id];
                          const startPos = sequence.findIndex((s) => s.block?.id === b.id) + 1;
                          const active = dropHint?.blockId === b.id;
                          return (
                            <li
                              key={b.id}
                              className="overflow-hidden rounded-[14px] border"
                              style={{ borderColor: active ? 'var(--c-primary)' : 'var(--c-border)' }}
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
                                className="flex min-h-[48px] items-center gap-2 px-2 sm:px-3"
                                style={{ background: BLOCK_TINTS[bi % BLOCK_TINTS.length] }}
                                draggable={renaming !== b.id}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/x-cantare-block', b.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                              >
                                <span className="hidden cursor-grab active:cursor-grabbing sm:block" aria-hidden style={{ color: 'var(--c-text-2)' }}><GripVertical size={16} /></span>
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
                                    onClick={() => setCollapsed((c) => ({ ...c, [b.id]: open }))}
                                    aria-expanded={open}
                                    className="c-focus flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[8px] text-left"
                                  >
                                    <ChevronDown size={18} aria-hidden className="shrink-0 transition-transform duration-150" style={{ transform: open ? undefined : 'rotate(-90deg)', color: 'var(--c-text-2)' }} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[16px] font-extrabold" style={{ color: 'var(--c-text)' }}>{bi + 1}. {b.name}</span>
                                      {b.description && <span className="block truncate text-[13px]" style={{ color: 'var(--c-text-2)' }}>{b.description}</span>}
                                    </span>
                                    <span className="shrink-0 text-[13px] font-semibold tabular-nums" style={{ color: 'var(--c-text-2)' }}>
                                      {songs.length} {songs.length === 1 ? 'música' : 'músicas'}{songs.length ? ` · ${formatDuration(bd.seconds, bd.estimatedCount > 0)}` : ''}
                                    </span>
                                  </button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" aria-label={`Ações do bloco ${b.name}`} className="c-focus flex h-10 w-9 shrink-0 items-center justify-center rounded-[8px]" style={{ color: 'var(--c-text-2)' }}>
                                      <MoreVertical size={18} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-60">
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
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 /> Excluir bloco
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {open && (
                                songs.length === 0 ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                                    <span className="text-[14px]" style={{ color: 'var(--c-text-2)' }}>Bloco vazio. Arraste músicas para cá ou adicione.</span>
                                    <span className="flex gap-2">
                                      <Button variant="secondary" size="sm" onClick={() => setSpotify({ open: true, target: { kind: 'block', blockId: b.id }, label: b.name })}><Search /> Buscar</Button>
                                      <Button variant="ghost" size="sm" onClick={() => setSongDialog({ open: true, song: null, target: { kind: 'block', blockId: b.id } })}><Plus /> Manual</Button>
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {/* cabeçalho das colunas (desktop) */}
                                    <div aria-hidden className="hidden grid-cols-[18px_26px_minmax(0,1.5fr)_minmax(0,1fr)_96px_44px_32px] gap-x-2 px-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.05em] sm:grid" style={{ color: 'var(--c-text-2)' }}>
                                      <span /><span className="text-right">#</span><span>Música</span><span>Artista</span><span className="text-center">Tom</span><span className="text-right">Dur.</span><span />
                                    </div>
                                    <ul>
                                      {songs.map((s, si) => <SongRow key={s.id} {...rowProps(s, startPos + si, { kind: 'block', blockId: b.id }, b.songIds)} />)}
                                    </ul>
                                  </>
                                )
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </>
                  )}
                </div>
              </section>

              {/* reserva no fim (celular, tablet, desktop estreito) */}
              <div className="xl:hidden">{reservePanel(false)}</div>

              <Button size="lg" variant="secondary" className="sm:hidden" onClick={() => setProjectDialog({ open: true, editing: null })}><Plus /> Novo projeto</Button>
            </div>

            {/* ================= Coluna lateral (desktop largo) ================= */}
            <aside className="hidden min-w-0 flex-col gap-5 xl:flex">
              <OtherProjects projects={projects} currentId={project.id} onOpen={selectProject} onAll={() => setSwitcher(true)} />
              {reservePanel(true)}
            </aside>
          </>
        )
      )}

      {/* ================= Diálogos ================= */}
      <ProjectFormDialog open={projectDialog.open} onOpenChange={(o) => setProjectDialog((d) => ({ ...d, open: o }))} initial={projectDialog.editing} onSubmit={submitProject} />
      <ProjectSwitcher
        open={switcher}
        onOpenChange={setSwitcher}
        projects={projects}
        currentId={project?.id}
        onOpen={selectProject}
        onNew={() => {
          setSwitcher(false);
          setProjectDialog({ open: true, editing: null });
        }}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-extrabold">Excluir “{confirmDelete?.name}”?</DialogTitle>
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
        .rep-flash { animation: rep-flash 900ms ease-out 1; }
        @keyframes rep-flash { 0% { background-color: var(--c-surface-blue) } 100% { background-color: transparent } }
      `}</style>
    </div>
  );
}
