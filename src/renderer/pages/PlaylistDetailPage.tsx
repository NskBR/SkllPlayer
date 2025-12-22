import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Shuffle, ImagePlus, X, Music } from 'lucide-react';
import { usePlayerStore, Track } from '../stores/playerStore';
import TrackList from '../components/TrackList';
import { motion, AnimatePresence } from 'framer-motion';

interface Playlist {
  id: number;
  name: string;
  createdAt: string;
  trackCount: number;
  coverImage: string | null;
  firstTrackThumbnail: string | null;
}

export default function PlaylistDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTracks, setIsAddingTracks] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);

  const { setQueue } = usePlayerStore();

  useEffect(() => {
    loadPlaylistData();
  }, [id]);

  const loadPlaylistData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const [playlistsData, tracksData] = await Promise.all([
          window.electronAPI.getPlaylists(),
          window.electronAPI.getPlaylistTracks(parseInt(id)),
        ]);

        const currentPlaylist = playlistsData.find((p: Playlist) => p.id === parseInt(id));
        setPlaylist(currentPlaylist || null);
        setTracks(tracksData);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
    setIsLoading(false);
  };

  const loadAllTracks = async () => {
    try {
      if (window.electronAPI) {
        const allTracksData = await window.electronAPI.getTracks();
        setAllTracks(allTracksData);
        // Pre-select tracks already in playlist
        setSelectedTracks(tracks.map((t) => t.id));
      }
    } catch (error) {
      console.error('Error loading all tracks:', error);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
    }
  };

  const handleAddTracks = () => {
    loadAllTracks();
    setIsAddingTracks(true);
  };

  const handleToggleTrack = (trackId: number) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSaveSelection = async () => {
    if (!id) return;

    try {
      if (window.electronAPI) {
        const playlistId = parseInt(id);
        const currentTrackIds = tracks.map((t) => t.id);

        // Add new tracks
        for (const trackId of selectedTracks) {
          if (!currentTrackIds.includes(trackId)) {
            await window.electronAPI.addToPlaylist(playlistId, trackId);
          }
        }

        // Remove unselected tracks
        for (const trackId of currentTrackIds) {
          if (!selectedTracks.includes(trackId)) {
            await window.electronAPI.removeFromPlaylist(playlistId, trackId);
          }
        }

        setIsAddingTracks(false);
        await loadPlaylistData();
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handlePlay = (_track: Track, index: number) => {
    setQueue(tracks, index);
  };

  const handleSelectCover = async () => {
    if (!id) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.selectPlaylistCover(parseInt(id));
        await loadPlaylistData();
      }
    } catch (error) {
      console.error('Error selecting cover:', error);
    }
  };

  const handleRemoveCover = async () => {
    if (!id) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.setPlaylistCover(parseInt(id), null);
        await loadPlaylistData();
      }
    } catch (error) {
      console.error('Error removing cover:', error);
    }
  };

  // Get display cover: custom cover > first track thumbnail > null
  const getPlaylistCover = () => {
    if (!playlist) return null;
    return playlist.coverImage || playlist.firstTrackThumbnail || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Playlist não encontrada
        </h3>
        <button
          onClick={() => navigate('/playlists')}
          className="text-accent-primary hover:text-accent-hover"
        >
          Voltar para playlists
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-start gap-6">
        <button
          onClick={() => navigate('/playlists')}
          className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Playlist cover */}
        <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-active/20 flex-shrink-0 overflow-hidden relative group">
          {getPlaylistCover() ? (
            <img
              src={getPlaylistCover()!}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-12 h-12 text-accent-primary/60" />
            </div>
          )}
          {/* Cover change button - bottom right corner */}
          <button
            onClick={handleSelectCover}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-accent-primary text-white transition-all z-10 shadow-lg"
            title="Alterar capa"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          {/* Remove cover button - only if has custom cover */}
          {playlist.coverImage && (
            <button
              onClick={handleRemoveCover}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-all z-10 shadow-lg"
              title="Remover capa personalizada"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-theme-title font-bold text-text-primary">
            {playlist.name}
          </h1>
          <p className="text-text-secondary">
            {tracks.length} música{tracks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTracks}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-accent-primary/20 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>

          {tracks.length > 0 && (
            <>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-accent-primary/20 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>Aleatório</span>
              </button>

              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Reproduzir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add tracks modal */}
      <AnimatePresence>
        {isAddingTracks && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">
                Selecionar Músicas
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSelection}
                  className="btn btn-primary"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsAddingTracks(false)}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <TrackList
                tracks={allTracks}
                onPlay={handlePlay}
                selectable
                selectedIds={selectedTracks}
                onSelect={handleToggleTrack}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Playlist vazia
          </h3>
          <p className="text-text-secondary max-w-md mb-4">
            Adicione músicas a esta playlist
          </p>
          <button
            onClick={handleAddTracks}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Músicas</span>
          </button>
        </div>
      ) : (
        <TrackList tracks={tracks} onPlay={handlePlay} showIndex />
      )}
    </div>
  );
}
