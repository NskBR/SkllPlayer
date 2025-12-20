import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Filter
} from 'lucide-react';
import { usePlayerStore, Track } from '../stores/playerStore';
import TrackList from '../components/TrackList';

type SortField = 'title' | 'artist' | 'album' | 'addedAt' | 'playCount' | 'duration';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export default function TracksPage(): JSX.Element {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { setQueue } = usePlayerStore();

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const tracksData = await window.electronAPI.getTracks();
        setTracks(tracksData);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        if (settings.musicFolder) {
          await window.electronAPI.scanMusicFolder(settings.musicFolder);
          await loadTracks();
        }
      }
    } catch (error) {
      console.error('Error refreshing tracks:', error);
    }
    setIsRefreshing(false);
  };

  // Update a single track in state without reloading all tracks
  const handleTrackUpdate = useCallback((trackId: number, updates: Partial<Track>) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    ));
  }, []);

  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
        case 'album':
          comparison = a.album.localeCompare(b.album);
          break;
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'playCount':
          comparison = a.playCount - b.playCount;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tracks, searchQuery, sortField, sortOrder]);

  const handlePlay = (_track: Track, index: number) => {
    setQueue(filteredAndSortedTracks, index);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Faixas</h1>
          <p className="text-text-secondary">
            {tracks.length} músicas na sua biblioteca
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px] relative">
          <input
            type="text"
            placeholder="Buscar músicas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="input w-auto pr-8 appearance-none cursor-pointer"
          >
            <option value="title">Título</option>
            <option value="artist">Artista</option>
            <option value="album">Álbum</option>
            <option value="addedAt">Data de Adição</option>
            <option value="playCount">Mais Tocadas</option>
            <option value="duration">Duração</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="p-2 bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-5 h-5" />
            ) : (
              <SortDesc className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* View mode */}
        <div className="flex items-center bg-bg-tertiary rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Grade"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary">Carregando músicas...</span>
          </div>
        </div>
      ) : filteredAndSortedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Filter className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {searchQuery ? 'Nenhuma música encontrada' : 'Biblioteca vazia'}
          </h3>
          <p className="text-text-secondary max-w-md">
            {searchQuery
              ? 'Tente buscar por outro termo'
              : 'Adicione músicas à sua biblioteca nas configurações ou baixe novas músicas'}
          </p>
        </div>
      ) : (
        <TrackList
          tracks={filteredAndSortedTracks}
          onPlay={handlePlay}
          viewMode={viewMode}
          showIndex
          onTrackUpdate={handleTrackUpdate}
        />
      )}
    </div>
  );
}
