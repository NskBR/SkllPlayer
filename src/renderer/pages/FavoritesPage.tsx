import { useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { usePlayerStore, Track } from '../stores/playerStore';
import TrackList from '../components/TrackList';

export default function FavoritesPage(): JSX.Element {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setQueue } = usePlayerStore();

  const loadFavorites = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const favorites = await window.electronAPI.getFavorites();
        setTracks(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Handle optimistic track updates
  const handleTrackUpdate = useCallback((trackId: number, updates: Partial<Track>) => {
    if (updates.isFavorite === false) {
      // Remove from favorites list immediately
      setTracks(prev => prev.filter(track => track.id !== trackId));
    } else {
      // Just update the track
      setTracks(prev => prev.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      ));
    }
  }, []);

  const handlePlay = (_track: Track, index: number) => {
    setQueue(tracks, index);
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Heart className="w-8 h-8 text-white fill-current" />
        </div>
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Favoritas</h1>
          <p className="text-text-secondary">
            {tracks.length} {tracks.length === 1 ? 'música favorita' : 'músicas favoritas'}
          </p>
        </div>
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary">Carregando favoritas...</span>
          </div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Nenhuma música favorita
          </h3>
          <p className="text-text-secondary max-w-md">
            Clique no coração ao lado de uma música para adicioná-la aos favoritos
          </p>
        </div>
      ) : (
        <TrackList
          tracks={tracks}
          onPlay={handlePlay}
          showIndex
          onTrackUpdate={handleTrackUpdate}
        />
      )}
    </div>
  );
}
