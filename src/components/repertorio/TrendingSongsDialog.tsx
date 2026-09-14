import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Plus, 
  Loader2, 
  History, 
  Music, 
  Heart, 
  Disc, 
  PartyPopper, 
  Megaphone, 
  Globe,
  Check,
  ListPlus,
  Clock,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  searchSpotifyPlaylists, 
  getPlaylistTracks, 
  getSpotifyPlaylist,
  searchSpotifyTracks,
  SpotifyPlaylist, 
  SpotifyTrack 
} from '@/lib/api/spotify';
import { toast } from 'sonner';
import { Project, Song } from '@/lib/types';
import { store } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Categorias e Subcategorias conforme solicitado
const CATEGORIES = [
  { id: 'sertanejo', name: 'Sertanejo', icon: Music },
  { id: 'gospel', name: 'Gospel', icon: Heart },
  { id: 'mpb', name: 'MPB', icon: Disc },
  { id: 'pagode', name: 'Pagode / Axé / Forró', icon: PartyPopper },
  { id: 'pop', name: 'Pop / Rock / Funk', icon: Megaphone },
  { id: 'internacional', name: 'Internacional', icon: Globe },
];

const SUBCATEGORIES: Record<string, { name: string; query?: string; playlistId?: string }[]> = {
  sertanejo: [
    { name: 'Esquenta Sertanejo', playlistId: '37i9dQZF1DXdPec7WLTq9V' },
    { name: 'Sertanejo Universitário', playlistId: '37i9dQZF1DX1369u88Xp6H' },
    { name: 'Modão Sertanejo', playlistId: '37i9dQZF1DX7679zdCOu7C' },
    { name: 'Potpourrí/Medleys', query: 'sertanejo potpourrí medleys 2025' },
  ],
  gospel: [
    { name: 'Louvor & Adoração', playlistId: '37i9dQZF1DX3S6886RJa6X' },
    { name: 'Gospel Hits', playlistId: '37i9dQZF1DWZ793S9XpS3Y' },
    { name: 'Sucessos Gospel', playlistId: '37i9dQZF1DX6Xv6TjG9iH3' },
  ],
  mpb: [
    { name: 'MPB Essentials', playlistId: '37i9dQZF1DX2v97onT5vAm' },
    { name: 'Nova MPB', playlistId: '37i9dQZF1DX4m9p9689nUn' },
    { name: 'Bossa Nova', playlistId: '37i9dQZF1DX4u8vV2tM787' },
  ],
  pagode: [
    { name: 'Pagodeira', playlistId: '37i9dQZF1DX8SfyY99mZBY' },
    { name: 'Axé Bahia', playlistId: '37i9dQZF1DX96S663UfSIn' },
    { name: 'Forró de Favela', playlistId: '37i9dQZF1DX7S03qMOfLCH' },
    { name: 'Piseiro', playlistId: '37i9dQZF1DXdbvS78vH6p0' },
  ],
  pop: [
    { name: 'Pop Brasil', playlistId: '37i9dQZF1DX0TkS6u99999' },
    { name: 'Rock Nacional', playlistId: '37i9dQZF1DX6fDStf5R8jC' },
    { name: 'Funk Hits', playlistId: '37i9dQZF1DX486ovl2Z8vP' },
    { name: 'Viral Brasil', playlistId: '37i9dQZEVXbMOYI0GEp9Gv' },
  ],
  internacional: [
    { name: 'Today\'s Top Hits', playlistId: '37i9dQZF1DXcBWf9p9Q3uC' },
    { name: 'Global Viral 50', playlistId: '37i9dQZEVXbLiRSasKsNU9' },
    { name: '¡Viva Latino!', playlistId: '37i9dQZF1DX10z9ReadyS2' },
  ],
};

interface TrendingSongsDialogProps {
  project: Project;
  onSongAdded: (project: Project) => void;
  trigger?: React.ReactNode;
}

interface RecentSearch {
  categoryId: string;
  categoryName: string;
  subName: string;
  query: string;
}

export function TrendingSongsDialog({ project, onSongAdded, trigger }: TrendingSongsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<{ name: string; query?: string; playlistId?: string } | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleManualSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setTracks([]);
      setError(null);
      return;
    }

    setLoadingTracks(true);
    setError(null);
    setRetrying(false);
    setSelectedPlaylist(null); // Clear playlist when searching manually

    try {
      const results = await searchSpotifyTracks({ data: { query } });
      setTracks(results);
    } catch (err) {
      setError('Erro ao pesquisar músicas.');
    } finally {
      setLoadingTracks(false);
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        handleManualSearch(query);
      }, 500);
    } else {
      setIsSearching(false);
      setTracks([]);
      setError(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('cantare_recent_searches_v2');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (categoryId: string, categoryName: string, subName: string, query: string) => {
    const newSearch = { categoryId, categoryName, subName, query };
    const updated = [
      newSearch,
      ...recentSearches.filter(s => s.query !== query)
    ].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem('cantare_recent_searches_v2', JSON.stringify(updated));
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSub(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setTracks([]);
    setError(null);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleSubSelect = async (sub: { name: string; query?: string; playlistId?: string }) => {
    setSelectedSub(sub);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setTracks([]);
    setLoadingPlaylists(true);
    setError(null);
    setRetrying(false);
    
    try {
      if (sub.playlistId) {
        // If we have a direct playlist ID, fetch its details and tracks immediately
        const playlist = await getSpotifyPlaylist({ data: { playlistId: sub.playlistId } });
        setPlaylists([playlist]);
        handlePlaylistSelect(playlist);
      } else if (sub.query) {
        // Fallback to search if only query is provided
        const attemptSearch = async (attempt = 1): Promise<SpotifyPlaylist[]> => {
          try {
            return await searchSpotifyPlaylists({ data: { query: sub.query! } });
          } catch (err) {
            if (attempt < 3) {
              setRetrying(true);
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              return attemptSearch(attempt + 1);
            }
            throw err;
          }
        };

        const results = await attemptSearch();
        setPlaylists(results);
      }

      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat) {
        const queryToSave = sub.playlistId || sub.query || '';
        saveRecentSearch(cat.id, cat.name, sub.name, queryToSave);
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoadingPlaylists(false);
      setRetrying(false);
    }
  };

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setTracks([]);
    setSelectedTracks(new Set());
    setLoadingTracks(true);
    setError(null);
    setRetrying(false);

    try {
      const attemptFetch = async (attempt = 1): Promise<SpotifyTrack[]> => {
        try {
          return await getPlaylistTracks({ data: { playlistId: playlist.id } });
        } catch (err) {
          if (attempt < 3) {
            setRetrying(true);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            return attemptFetch(attempt + 1);
          }
          throw err;
        }
      };

      const results = await attemptFetch();
      setTracks(results);
    } catch (err) {
      setError('Erro ao carregar músicas da playlist.');
    } finally {
      setLoadingTracks(false);
      setRetrying(false);
    }
  };

  const toggleTrack = (trackId: string) => {
    const next = new Set(selectedTracks);
    if (next.has(trackId)) {
      next.delete(trackId);
    } else {
      next.add(trackId);
    }
    setSelectedTracks(next);
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

    const newSongs: Song[] = tracksToAdd.map(track => ({
      id: crypto.randomUUID(),
      title: track.name,
      artist: track.artist,
      style: selectedSub?.name || '',
      cover: track.albumImageUrl,
      key: ''
    }));

    const updatedProject = {
      ...project,
      songs: [...project.songs, ...newSongs]
    };

    store.updateProject(updatedProject);
    onSongAdded(updatedProject);
    toast.success(`${tracksToAdd.length} músicas adicionadas ao repertório!`);
    setIsOpen(false);
    resetModal();
  };

  const resetModal = () => {
    setSelectedCategory(null);
    setSelectedSub(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setTracks([]);
    setSelectedTracks(new Set());
    setSearchQuery('');
    setIsSearching(false);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const handleRecentClick = (search: RecentSearch) => {
    setSelectedCategory(search.categoryId);
    handleSubSelect({ name: search.subName, query: search.query });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <div className="premium-card p-6 flex items-center justify-between cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10 overflow-hidden relative group">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Music size={24} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground">Tendências</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest mt-0.5">Explore o que é viral no Spotify</p>
              </div>
            </div>
          </div>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-none w-full h-[100dvh] flex flex-col p-0 bg-background border-none rounded-none outline-none">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-50 bg-background">
          <h2 className="font-serif text-3xl text-white">Tendências</h2>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify" className="h-6 w-6" />
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center justify-between">
            <span className="text-red-400 text-xs">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => selectedSub && handleSubSelect(selectedSub)} className="text-red-400 hover:text-red-300 h-7 text-[10px] uppercase tracking-wider font-bold">
              Tentar novamente
            </Button>
          </div>
        )}

        {retrying && (
          <div className="bg-[#B8955A]/10 border-b border-[#B8955A]/20 px-6 py-2 flex items-center gap-3">
            <Loader2 className="w-3 h-3 text-[#B8955A] animate-spin" />
            <span className="text-[#B8955A] text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Reconectando ao Spotify...
            </span>
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

            {/* SEÇÃO 1 - CATEGORIAS */}
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

            {/* SEÇÃO 2 - SUBCATEGORIAS */}
            {!searchQuery && selectedCategory && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/5" />
                <h3 className="font-serif text-lg text-white/90">Refine seu estilo</h3>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2">
                    {SUBCATEGORIES[selectedCategory]?.map((sub) => {
                      const isActive = (sub.playlistId && selectedSub?.playlistId === sub.playlistId) || 
                                       (sub.query && selectedSub?.query === sub.query);
                      return (
                        <button
                          key={sub.playlistId || sub.query}
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

            {/* PLAYLISTS */}
            {!searchQuery && selectedSub && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/5" />
                <h3 className="font-serif text-lg text-white/90">Escolha uma playlist</h3>
                {loadingPlaylists ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="aspect-square bg-white/5 rounded-lg" />
                        <div className="h-2 bg-white/5 rounded w-2/3 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : playlists.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => handlePlaylistSelect(pl)}
                        className={cn(
                          "flex flex-col gap-2 group transition-all",
                          selectedPlaylist?.id === pl.id ? "scale-[0.98]" : "active:scale-95"
                        )}
                      >
                        <div className={cn(
                          "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          selectedPlaylist?.id === pl.id ? "border-[#B8955A]" : "border-transparent"
                        )}>
                          <img src={pl.images[0]?.url} alt={pl.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={cn(
                          "text-[9px] font-medium text-center truncate px-1",
                          selectedPlaylist?.id === pl.id ? "text-[#B8955A]" : "text-white/60"
                        )}>
                          {pl.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-white/40 text-sm py-10 font-serif italic">Nenhuma playlist encontrada para esta seleção.</p>
                )}
              </div>
            )}

            {/* SEÇÃO 3 - MÚSICAS */}
            {(selectedPlaylist || (searchQuery.length >= 3 && tracks.length > 0)) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base text-white/90">
                      {selectedPlaylist ? selectedPlaylist.name : `Resultados para "${searchQuery}"`}
                    </h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">{tracks.length} músicas encontradas</p>
                  </div>
                  {tracks.length > 0 && (
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
                          onCheckedChange={() => toggleTrack(track.id)}
                          className={cn(
                            "w-4 h-4 border-white/20 data-[state=checked]:bg-[#B8955A] data-[state=checked]:border-[#B8955A]",
                            selectedTracks.has(track.id) ? "opacity-100" : "opacity-40"
                          )}
                        />
                        <img 
                          src={track.albumImageUrl} 
                          alt={track.name} 
                          className="w-10 h-10 rounded-md object-cover shadow-lg" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-white truncate">{track.name}</h4>
                          <p className="text-[11px] text-white/40 truncate">{track.artist}</p>
                        </div>
                        <span className="text-[10px] text-white/20 font-mono">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-white/40 text-sm font-serif italic">Essa playlist não tem músicas disponíveis no Brasil.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {searchQuery.length >= 3 && tracks.length === 0 && !loadingTracks && (
              <div className="py-20 text-center animate-in fade-in duration-500">
                <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-white/40 text-sm font-serif italic">Nenhuma música encontrada para "{searchQuery}".</p>
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
