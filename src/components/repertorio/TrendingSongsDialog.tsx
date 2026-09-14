import { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  Music,
  Heart,
  Disc,
  PartyPopper,
  Megaphone,
  Globe,
  ListPlus,
  Clock,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { searchSpotifyTracks, SpotifyTrack } from '@/lib/api/spotify';
import { toast } from 'sonner';
import type { RepertoireProject } from '@/lib/types';
import { addSongs, type SongTarget } from '@/lib/repertoire/store';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'sertanejo', name: 'Sertanejo', icon: Music },
  { id: 'gospel', name: 'Gospel', icon: Heart },
  { id: 'mpb', name: 'MPB', icon: Disc },
  { id: 'pagode', name: 'Pagode / Axé / Forró', icon: PartyPopper },
  { id: 'pop', name: 'Pop / Rock / Funk', icon: Megaphone },
  { id: 'internacional', name: 'Internacional', icon: Globe },
];

interface Subcategory {
  name: string;
  query: string;
}

// Categoria → subcategoria → query de GET /v1/search?type=track.
// Playlists (editoriais ou de usuários) não são acessíveis com Client Credentials.
const SEARCH_QUERIES: Record<string, Subcategory[]> = {
  sertanejo: [
    { name: 'Universitário', query: 'sertanejo universitário 2026' },
    { name: 'Modão', query: 'modão sertanejo' },
    { name: 'Sofrência', query: 'sofrência' },
    { name: 'Potpourri', query: 'sertanejo potpourri' },
  ],
  gospel: [
    { name: 'Louvor & Adoração', query: 'louvor e adoração' },
    { name: 'Gospel atual', query: 'gospel 2026' },
    { name: 'Hinos', query: 'hinos cristãos' },
  ],
  mpb: [
    { name: 'Clássicos', query: 'mpb clássicos' },
    { name: 'Nova MPB', query: 'nova mpb' },
    { name: 'Bossa Nova', query: 'bossa nova' },
  ],
  pagode: [
    { name: 'Pagode', query: 'pagode 2026' },
    { name: 'Axé', query: 'axé bahia' },
    { name: 'Forró', query: 'forró 2026' },
    { name: 'Piseiro', query: 'piseiro 2026' },
  ],
  pop: [
    { name: 'Pop Brasil', query: 'pop brasil 2026' },
    { name: 'Rock Nacional', query: 'rock nacional' },
    { name: 'Funk', query: 'funk 2026' },
  ],
  internacional: [
    { name: 'Pop', query: 'pop internacional' },
    { name: 'Latino', query: 'reggaeton 2026' },
    { name: 'Flashback', query: 'flashback internacional' },
  ],
};

const RECENT_KEY = 'cantare_recent_searches_v3';
const SEARCH_ERROR = 'Não conseguimos buscar músicas agora. Você ainda pode adicioná-las manualmente.';

interface TrendingSongsDialogProps {
  project: RepertoireProject;
  onSongsAdded: () => void;
  trigger?: React.ReactNode;
  /** Onde as músicas entram. Padrão: último bloco. */
  target?: SongTarget;
  targetLabel?: string;
  /** Modo controlado (ex.: abrir a partir de um campo de busca já preenchido). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialQuery?: string;
}

interface RecentSearch {
  categoryId: string;
  categoryName: string;
  subName: string;
  query: string;
}

export function TrendingSongsDialog({ project, onSongsAdded, trigger, target, targetLabel, open, onOpenChange, initialQuery }: TrendingSongsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (open === undefined) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const setIsOpen = setOpen;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subcategory | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Descarta respostas antigas quando o usuário troca de busca antes de terminar.
  const runSearch = async (query: string, errorMessage: string) => {
    const requestId = ++requestIdRef.current;
    setTracks([]);
    setSelectedTracks(new Set());
    setLoadingTracks(true);
    setError(null);
    try {
      const results = await searchSpotifyTracks({ data: { query } });
      if (requestId === requestIdRef.current) setTracks(results);
    } catch {
      if (requestId === requestIdRef.current) setError(errorMessage);
    } finally {
      if (requestId === requestIdRef.current) setLoadingTracks(false);
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        runSearch(query, SEARCH_ERROR);
      }, 500);
    } else {
      requestIdRef.current++;
      setTracks([]);
      setLoadingTracks(false);
      setError(null);
    }
  };

  // Aberto a partir de um campo de busca: já pesquisa o termo digitado.
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim().length >= 3) {
      setSearchQuery(initialQuery);
      runSearch(initialQuery.trim(), SEARCH_ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      // localStorage indisponível ou corrompido — segue sem buscas recentes
    }
  }, []);

  const saveRecentSearch = (categoryId: string, categoryName: string, subName: string, query: string) => {
    const updated = [
      { categoryId, categoryName, subName, query },
      ...recentSearches.filter(s => s.query !== query)
    ].slice(0, 3);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // ignora
    }
  };

  const handleCategorySelect = (catId: string) => {
    requestIdRef.current++;
    setSelectedCategory(catId);
    setSelectedSub(null);
    setTracks([]);
    setSelectedTracks(new Set());
    setLoadingTracks(false);
    setError(null);
  };

  const handleSubSelect = (sub: Subcategory, categoryId = selectedCategory) => {
    setSelectedSub(sub);
    runSearch(sub.query, SEARCH_ERROR);

    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (cat) saveRecentSearch(cat.id, cat.name, sub.name, sub.query);
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map(t => t.id)));
    }
  };

  const addSelectedSongs = () => {
    const tracksToAdd = tracks.filter(t => selectedTracks.has(t.id));
    if (tracksToAdd.length === 0) return;

    // O Spotify não informa o tom nem BPM confiável: o tom fica para o cantor definir.
    // A duração vem da própria faixa.
    try {
      addSongs(
        project.id,
        tracksToAdd.map((track) => ({
          title: track.name,
          artist: track.artist,
          originalKey: '',
          currentKey: '',
          difficulty: 'unknown' as const,
          status: 'to_study' as const,
          durationSec: track.duration_ms ? Math.round(track.duration_ms / 1000) : undefined,
          albumImageUrl: track.albumImageUrl || undefined,
        })),
        target,
      );
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível salvar as músicas. Tente novamente.');
      return;
    }

    onSongsAdded();
    toast.success(
      `${tracksToAdd.length} ${tracksToAdd.length === 1 ? 'música adicionada' : 'músicas adicionadas'}${targetLabel ? ` em ${targetLabel}` : ''}`,
      { description: 'Defina o tom de cada uma antes do show.' },
    );
    setOpen(false);
    resetModal();
  };

  const resetModal = () => {
    requestIdRef.current++;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSelectedCategory(null);
    setSelectedSub(null);
    setTracks([]);
    setSelectedTracks(new Set());
    setLoadingTracks(false);
    setError(null);
    setSearchQuery('');
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleRecentClick = (search: RecentSearch) => {
    setSelectedCategory(search.categoryId);
    handleSubSelect({ name: search.subName, query: search.query }, search.categoryId);
  };

  const retry = () => {
    if (searchQuery.length >= 3) runSearch(searchQuery, SEARCH_ERROR);
    else if (selectedSub) handleSubSelect(selectedSub);
  };

  const showTracks = searchQuery.length >= 3 || (!searchQuery && !!selectedSub);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      {open === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" variant="secondary">
              <Search /> Buscar músicas
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent hideClose className="max-w-none w-full h-[100dvh] flex flex-col p-0 bg-background border-none rounded-none outline-none">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-50 bg-background">
          <DialogTitle className="font-serif text-3xl text-white font-normal">Buscar músicas</DialogTitle>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify" className="h-6 w-6" />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar busca">
              <X />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center justify-between">
            <span className="text-red-400 text-xs">{error}</span>
            <Button variant="ghost" size="sm" onClick={retry} className="text-red-400 hover:text-red-300 h-7 text-[10px] uppercase tracking-wider font-bold">
              Tentar novamente
            </Button>
          </div>
        )}

        <div className="px-6 py-4 bg-background border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Pesquisar música ou artista no Spotify..."
              className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl text-white placeholder:text-white/20 focus:border-[#B8955A]/50 transition-all"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8 pb-[180px]">

            {/* BUSCAS RECENTES */}
            {!searchQuery && !selectedCategory && recentSearches.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/50 flex items-center gap-2">
                  <Clock size={12} /> Buscas recentes
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(s)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-muted hover:bg-white/10 hover:text-foreground transition-all border border-white/5 flex items-center gap-1.5"
                    >
                      {s.categoryName} · {s.subName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORIAS */}
            {!searchQuery && (
              <div className="space-y-4">
                <h3 className="font-serif text-lg text-white/90">Selecione uma categoria</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#1A1A1F] border border-white/5 transition-all duration-300",
                          isActive ? "border-[#B8955A] bg-[#B8955A]/5 shadow-[0_0_15px_rgba(201,168,76,0.1)]" : "hover:border-white/10"
                        )}
                      >
                        <Icon className={cn("w-6 h-6", isActive ? "text-[#B8955A]" : "text-white/40")} />
                        <span className={cn("text-[11px] font-medium text-center", isActive ? "text-white" : "text-white/60")}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBCATEGORIAS */}
            {!searchQuery && selectedCategory && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/5" />
                <h3 className="font-serif text-lg text-white/90">Refine seu estilo</h3>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2">
                    {SEARCH_QUERIES[selectedCategory]?.map((sub) => {
                      const isActive = selectedSub?.query === sub.query;
                      return (
                        <button
                          key={sub.query}
                          onClick={() => handleSubSelect(sub)}
                          className={cn(
                            "px-5 py-2.5 rounded-full text-[12px] font-medium transition-all duration-300 border",
                            isActive
                              ? "bg-[#B8955A]/10 text-[#B8955A] border-[#B8955A]"
                              : "bg-[#1E1E22] text-white/60 border-white/10 hover:border-white/20"
                          )}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              </div>
            )}

            {/* MÚSICAS */}
            {showTracks && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base text-white/90">
                      {searchQuery ? `Resultados para "${searchQuery}"` : selectedSub?.name}
                    </h3>
                    {!loadingTracks && (
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">{tracks.length} músicas encontradas</p>
                    )}
                  </div>
                  {tracks.length > 0 && !loadingTracks && (
                    <Button
                      variant="ghost"
                      onClick={toggleAll}
                      className="text-[#B8955A] hover:text-[#B8955A] hover:bg-[#B8955A]/10 gap-2 h-9 text-[11px] font-bold"
                    >
                      <ListPlus size={16} />
                      {selectedTracks.size === tracks.length ? 'Desmarcar tudo' : 'Selecionar todas'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {loadingTracks ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl border border-white/5 animate-pulse bg-white/[0.02]">
                          <div className="w-10 h-10 bg-white/5 rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 bg-white/5 rounded w-3/4" />
                            <div className="h-2 bg-white/5 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : tracks.length > 0 ? (
                    tracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => toggleTrack(track.id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg bg-[#1E1E22] border transition-all cursor-pointer group",
                          selectedTracks.has(track.id) ? "border-[#B8955A]/50 bg-[#B8955A]/5" : "border-white/5"
                        )}
                      >
                        <Checkbox
                          checked={selectedTracks.has(track.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleTrack(track.id)}
                          className={cn(
                            "w-4 h-4 border-white/20 data-[state=checked]:bg-[#B8955A] data-[state=checked]:border-[#B8955A]",
                            selectedTracks.has(track.id) ? "opacity-100" : "opacity-40"
                          )}
                        />
                        {track.albumImageUrl ? (
                          <img
                            src={track.albumImageUrl}
                            alt={track.name}
                            className="w-10 h-10 rounded-md object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-white/5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-white truncate">{track.name}</h4>
                          <p className="text-[11px] text-white/40 truncate">{track.artist}</p>
                        </div>
                        <span className="text-[10px] text-white/20 font-mono">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </div>
                    ))
                  ) : !error ? (
                    <div className="py-20 text-center">
                      <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                      <p className="text-white/40 text-sm font-serif italic">
                        Nenhuma música encontrada. Tente outra busca.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER FIXO */}
        <div className="p-6 pt-4 border-t border-white/5 bg-background absolute bottom-0 left-0 right-0 z-[60] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button
            disabled={selectedTracks.size === 0 || loadingTracks}
            onClick={addSelectedSongs}
            className={cn(
              "w-full h-14 rounded-2xl font-bold transition-all active:scale-[0.98]",
              selectedTracks.size > 0
                ? "bg-[#B8955A] text-[#07080A] hover:bg-[#B8955A]/90 shadow-xl shadow-[#B8955A]/10"
                : "bg-white/5 text-white/20 border border-white/5"
            )}
          >
            {selectedTracks.size === 0
              ? "Selecione músicas para adicionar"
              : `Adicionar ${selectedTracks.size} ${selectedTracks.size === 1 ? 'música' : 'músicas'} ao repertório`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
