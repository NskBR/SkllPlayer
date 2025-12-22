import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, Trash2, Edit2, ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Playlist {
  id: number;
  name: string;
  createdAt: string;
  trackCount: number;
  coverImage: string | null;
  firstTrackThumbnail: string | null;
}

export default function PlaylistsPage(): JSX.Element {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.getPlaylists();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.createPlaylist(newPlaylistName.trim());
        setNewPlaylistName('');
        setIsCreating(false);
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.renamePlaylist(id, editName.trim());
        setEditingId(null);
        setEditName('');
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error renaming playlist:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.deletePlaylist(id);
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const startEditing = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setEditName(playlist.name);
  };

  const handleSelectCover = async (playlistId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (window.electronAPI) {
        await window.electronAPI.selectPlaylistCover(playlistId);
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error selecting cover:', error);
    }
  };

  const handleRemoveCover = async (playlistId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (window.electronAPI) {
        await window.electronAPI.setPlaylistCover(playlistId, null);
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error removing cover:', error);
    }
  };

  // Get display cover: custom cover > first track thumbnail > default gradient
  const getPlaylistCover = (playlist: Playlist) => {
    return playlist.coverImage || playlist.firstTrackThumbnail || null;
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Playlists</h1>
          <p className="text-text-secondary">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Playlist</span>
        </button>
      </div>

      {/* Create playlist modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4"
          >
            <h3 className="text-lg font-medium text-text-primary mb-4">
              Criar Nova Playlist
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Nome da playlist..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewPlaylistName('');
                }}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Music className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Nenhuma playlist ainda
          </h3>
          <p className="text-text-secondary max-w-md mb-4">
            Crie sua primeira playlist para organizar suas músicas favoritas
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 hover:border-accent-primary/30 transition-colors group cursor-pointer"
              onClick={() => editingId !== playlist.id && navigate(`/playlists/${playlist.id}`)}
            >
              {/* Playlist thumbnail */}
              <div className="aspect-square rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-active/20 flex items-center justify-center mb-4 overflow-hidden relative">
                {getPlaylistCover(playlist) ? (
                  <img
                    src={getPlaylistCover(playlist)!}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-16 h-16 text-accent-primary/60" />
                )}
                {/* Cover change button - bottom right corner */}
                <button
                  onClick={(e) => handleSelectCover(playlist.id, e)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-accent-primary text-white transition-all z-10 shadow-lg"
                  title="Alterar capa"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                {/* Remove cover button - only if has custom cover */}
                {playlist.coverImage && (
                  <button
                    onClick={(e) => handleRemoveCover(playlist.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-all z-10 shadow-lg"
                    title="Remover capa personalizada"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Info */}
              {editingId === playlist.id ? (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(playlist.id)}
                    className="input flex-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(playlist.id)}
                    className="px-2 py-1 text-xs bg-accent-primary text-white rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-text-primary truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {playlist.trackCount} música{playlist.trackCount !== 1 ? 's' : ''}
                  </p>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(playlist);
                  }}
                  className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                  title="Renomear"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(playlist.id);
                  }}
                  className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
