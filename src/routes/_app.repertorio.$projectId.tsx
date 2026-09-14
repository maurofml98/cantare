import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RepertoireProject, RepertoireProjectType, RepertoireSong } from '@/lib/types';
import {
  addSong, deleteProject, deleteSong, getProject, loadProjects, updateProject, updateSong,
} from '@/lib/repertoire/store';
import { computeRecommendation } from '@/lib/repertoire/keys';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { RecommendationBanner } from '@/components/repertorio/RecommendationBanner';
import { SongForm, type SongFormValues } from '@/components/repertorio/SongForm';
import { SongCard } from '@/components/repertorio/SongCard';
import { TrendingSongsDialog } from '@/components/repertorio/TrendingSongsDialog';

const PROJECT_TYPES: RepertoireProjectType[] = [
  'Show Barzinho', 'Culto', 'Casamento', 'Gravação', 'Aula de Canto', 'Ensaio', 'Outro',
];

export const Route = createFileRoute('/_app/repertorio/$projectId')({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<RepertoireProject | null>(null);
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<RepertoireSong | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const refresh = () => setProject(getProject(projectId));

  useEffect(() => {
    setProject(getProject(projectId));
    setProfile(loadVocalProfile());
  }, [projectId]);

  const songCount = useMemo(() => project?.songs.length ?? 0, [project]);

  if (!project) {
    return (
      <div className="p-8 text-center text-[#8A8A95]">
        Projeto não encontrado.{' '}
        <button onClick={() => navigate({ to: '/repertorio' })} className="underline">Voltar</button>
      </div>
    );
  }

  const saveName = () => {
    const name = nameDraft.trim();
    if (!name) { setEditingName(false); return; }
    updateProject(project.id, { name });
    setEditingName(false);
    refresh();
  };

  const changeType = (type: RepertoireProjectType) => {
    updateProject(project.id, { type });
    refresh();
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    toast.info('Projeto excluído.');
    navigate({ to: '/repertorio' });
  };

  const openNewSong = () => { setEditingSong(null); setSongDialogOpen(true); };
  const openEditSong = (s: RepertoireSong) => { setEditingSong(s); setSongDialogOpen(true); };

  const handleSubmitSong = (v: SongFormValues) => {
    const rec = computeRecommendation({ currentKey: v.currentKey, difficulty: v.difficulty }, profile);
    if (editingSong) {
      updateSong(project.id, editingSong.id, { ...v, ...rec });
      toast.success('Música atualizada.');
    } else {
      addSong(project.id, { ...v, ...rec });
      toast.success('Música adicionada.');
    }
    setSongDialogOpen(false);
    setEditingSong(null);
    refresh();
  };

  const handleDeleteSong = () => {
    if (!editingSong) return;
    deleteSong(project.id, editingSong.id);
    setSongDialogOpen(false);
    setEditingSong(null);
    toast.info('Música removida.');
    refresh();
  };

  const recomputeAll = () => {
    const fresh = getProject(project.id);
    if (!fresh) return;
    const p = loadVocalProfile();
    setProfile(p);
    fresh.songs.forEach((s) => {
      const rec = computeRecommendation({ currentKey: s.currentKey, difficulty: s.difficulty }, p);
      updateSong(fresh.id, s.id, rec);
    });
    toast.success(p ? 'Sugestões recalculadas.' : 'Sem perfil vocal — sugestões limpas.');
    refresh();
  };

  return (
    <div className="space-y-8 animate-in pb-[calc(120px+env(safe-area-inset-bottom))]">
      <header className="flex flex-col gap-4">
        <button
          onClick={() => navigate({ to: '/repertorio' })}
          className="text-[11px] uppercase text-[#8A8A95] hover:text-white transition-colors self-start"
          style={{ letterSpacing: '0.24em' }}
        >
          ← Projetos
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <Input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="bg-transparent border-none font-serif text-[34px] h-auto py-0 px-0 focus-visible:ring-0"
              />
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-[34px] font-serif font-light text-white tracking-tight truncate">
                  {project.name}
                </h1>
                <button
                  onClick={() => { setNameDraft(project.name); setEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 transition text-[#555566] hover:text-white"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Select value={project.type} onValueChange={(v) => changeType(v as RepertoireProjectType)}>
                <SelectTrigger className="w-auto h-8 bg-transparent border-white/5 text-[11px] uppercase tracking-[0.24em] text-[#8A8A95]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/5">
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-[11px] uppercase text-[#555566]" style={{ letterSpacing: '0.24em' }}>
                {songCount} {songCount === 1 ? 'música' : 'músicas'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[#8A8A95] hover:text-white" onClick={recomputeAll}>
              Recalcular sugestões
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8A8A95] hover:text-red-400"
              onClick={() => setConfirmDeleteProject(true)}
            >
              <Trash2 size={14} className="mr-1" /> Excluir projeto
            </Button>
          </div>
        </div>
      </header>

      <RecommendationBanner profile={profile} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Músicas ({songCount})
          </h2>
          <div className="flex items-center gap-1">
            <TrendingSongsDialog project={project} onSongsAdded={refresh} />
            <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 gap-2 h-8" onClick={openNewSong}>
              <Plus size={16} /> Adicionar música
            </Button>
          </div>
        </div>

        {songCount === 0 ? (
          <p className="py-12 text-center text-xs text-muted italic font-serif">
            Ainda sem músicas neste projeto.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {project.songs.map((s) => (
              <SongCard key={s.id} song={s} onClick={() => openEditSong(s)} />
            ))}
          </div>
        )}
      </section>

      <SongForm
        open={songDialogOpen}
        onOpenChange={(v) => { setSongDialogOpen(v); if (!v) setEditingSong(null); }}
        initial={editingSong}
        onSubmit={handleSubmitSong}
        onDelete={editingSong ? handleDeleteSong : undefined}
      />

      <Dialog open={confirmDeleteProject} onOpenChange={setConfirmDeleteProject}>
        <DialogContent className="sm:max-w-md bg-card border-white/5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Excluir projeto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#8A8A95]">
            Todas as músicas deste projeto serão removidas. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="flex-col gap-2">
            <Button
              className="w-full h-12 text-white"
              style={{ background: 'linear-gradient(180deg, #b04040 0%, #7d2828 100%)' }}
              onClick={handleDeleteProject}
            >
              Excluir
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDeleteProject(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

