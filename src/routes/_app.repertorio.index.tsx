import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileMusic, Trash2 } from 'lucide-react';
import type { RepertoireProject, RepertoireProjectType } from '@/lib/types';
import { createProject, deleteProject, loadProjects } from '@/lib/repertoire/store';
import { loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { RecommendationBanner } from '@/components/repertorio/RecommendationBanner';

const PROJECT_TYPES: RepertoireProjectType[] = [
  'Show Barzinho', 'Culto', 'Casamento', 'Gravação', 'Aula de Canto', 'Ensaio', 'Outro',
];

export const Route = createFileRoute('/_app/repertorio/')({
  component: RepertorioPage,
});

function RepertorioPage() {
  const [projects, setProjects] = useState<RepertoireProject[]>([]);
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<RepertoireProjectType>('Show Barzinho');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
    setProfile(loadVocalProfile());
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject(name, type);
    setProjects(loadProjects());
    setName('');
    setType('Show Barzinho');
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(loadProjects());
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-white">
          Meus projetos
        </h1>
      </header>

      <RecommendationBanner profile={profile} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 col-span-full">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border border-white/5">
              <FileMusic size={24} className="text-muted" strokeWidth={1} />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg">Sem projetos</h3>
              <p className="text-xs text-muted">Crie seu primeiro projeto de repertório.</p>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="relative group">
              <Link
                to="/repertorio/$projectId"
                params={{ projectId: project.id }}
                className="block"
              >
                <div className="premium-card p-6 flex flex-col gap-6 bg-[#111118]/60 backdrop-blur-md border border-white/5 hover:border-primary/20 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl font-serif group-hover:scale-105 transition-transform duration-500">
                      {project.name.charAt(0) || 'P'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-white truncate tracking-tight">{project.name}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#888899] font-light uppercase tracking-[0.1em] mt-1.5 opacity-60">
                      <span>{project.type}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{project.songs.length} músicas</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Acessar projeto</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="text-xl">→</span>
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); setConfirmDelete(project.id); }}
                className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
                aria-label="Excluir projeto"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Confirmação de exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card border-white/5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Excluir projeto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#8A8A95]">
            Esta ação não pode ser desfeita. Todas as músicas do projeto serão removidas.
          </p>
          <DialogFooter className="flex-col gap-2">
            <Button
              className="w-full h-12"
              style={{ background: 'linear-gradient(180deg, #b04040 0%, #7d2828 100%)' }}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Excluir
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Criar projeto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-24 md:bottom-12 right-6 md:right-12 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl transition-all hover:scale-110 active:scale-95 z-50 border-none"
            aria-label="Criar projeto"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-white/5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Novo projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted">Nome do projeto</Label>
              <Input
                className="bg-background border-white/5 focus-visible:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Noite de Jazz"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as RepertoireProjectType)}>
                <SelectTrigger className="bg-background border-white/5"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-white/5">
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button className="w-full font-bold h-12 bg-primary text-background" onClick={handleCreate}>
              Criar projeto
            </Button>
            <Button variant="ghost" className="w-full text-muted hover:text-foreground" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
