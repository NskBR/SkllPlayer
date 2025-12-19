import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Info,
  Edit3,
  ListPlus,
  Play,
  Trash2,
  X,
  Music,
  HardDrive,
  Calendar,
  Clock,
  Hash,
  Folder
} from 'lucide-react';
import { Track } from '../stores/playerStore';

interface Position {
  x: number;
  y: number;
}

interface TrackContextMenuProps {
  track: Track | null;
  position: Position | null;
  onClose: () => void;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onShowInfo: () => void;
  onAddToPlaylist: () => void;
  onRemoveFromPlaylist?: () => void;
  showRemoveFromPlaylist?: boolean;
}

export function TrackContextMenu({
  track,
  position,
  onClose,
  onPlay,
  onToggleFavorite,
  onRename,
  onShowInfo,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  showRemoveFromPlaylist = false,
}: TrackContextMenuProps): JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!track || !position) return null;

  // Adjust position to keep menu in viewport
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined') {
    if (position.x + 200 > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - 210;
    }
    if (position.y + 300 > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - 310;
    }
  }

  const menuItems = [
    { icon: Play, label: 'Reproduzir', onClick: onPlay },
    { icon: Heart, label: track.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos', onClick: onToggleFavorite, highlight: track.isFavorite },
    { divider: true },
    { icon: ListPlus, label: 'Adicionar à playlist', onClick: onAddToPlaylist },
    ...(showRemoveFromPlaylist && onRemoveFromPlaylist ? [{ icon: Trash2, label: 'Remover da playlist', onClick: onRemoveFromPlaylist, danger: true }] : []),
    { divider: true },
    { icon: Edit3, label: 'Renomear', onClick: onRename },
    { icon: Info, label: 'Informações', onClick: onShowInfo },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl py-2 min-w-[200px]"
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      >
        {/* Track preview header */}
        <div className="flex items-center gap-3 px-3 pb-2 mb-2 border-b border-bg-tertiary">
          <div className="w-10 h-10 rounded bg-bg-tertiary overflow-hidden flex-shrink-0">
            {track.thumbnail ? (
              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-4 h-4 text-text-muted" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{track.title}</p>
            <p className="text-xs text-text-secondary truncate">{track.artist}</p>
          </div>
        </div>

        {/* Menu items */}
        {menuItems.map((item, index) => {
          if ('divider' in item && item.divider) {
            return <div key={index} className="h-px bg-bg-tertiary my-1" />;
          }

          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                'danger' in item && item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'highlight' in item && item.highlight
                  ? 'text-accent-primary hover:bg-accent-primary/10'
                  : 'text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

// Track Info Modal
interface TrackInfoModalProps {
  track: Track | null;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TrackInfoModal({ track, onClose }: TrackInfoModalProps): JSX.Element | null {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!track) return null;

  const infoItems = [
    { icon: Music, label: 'Título', value: track.title },
    { icon: Music, label: 'Artista', value: track.artist || 'Desconhecido' },
    { icon: Music, label: 'Álbum', value: track.album || 'Desconhecido' },
    { icon: Clock, label: 'Duração', value: formatDuration(track.duration) },
    { icon: HardDrive, label: 'Tamanho', value: formatFileSize(track.size) },
    { icon: Hash, label: 'Reproduções', value: track.playCount.toString() },
    { icon: Calendar, label: 'Adicionado em', value: formatDate(track.addedAt) },
    { icon: Calendar, label: 'Última reprodução', value: formatDate(track.lastPlayed) },
    { icon: Folder, label: 'Caminho', value: track.path },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl shadow-2xl w-full max-w-lg mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <h2 className="text-lg font-semibold text-text-primary">Informações da música</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Thumbnail and basic info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-24 h-24 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-text-muted" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-text-primary truncate">{track.title}</h3>
              <p className="text-text-secondary truncate">{track.artist || 'Artista desconhecido'}</p>
              {track.album && <p className="text-sm text-text-muted truncate">{track.album}</p>}
              {track.isFavorite && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary text-xs">
                  <Heart className="w-3 h-3 fill-current" /> Favorito
                </span>
              )}
            </div>
          </div>

          {/* Detailed info */}
          <div className="space-y-3">
            {infoItems.slice(3).map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted">{item.label}</p>
                    <p className="text-sm text-text-primary break-all">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-bg-tertiary">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Rename Track Modal
interface RenameTrackModalProps {
  track: Track | null;
  onClose: () => void;
  onRename: (newTitle: string) => void;
}

export function RenameTrackModal({ track, onClose, onRename }: RenameTrackModalProps): JSX.Element | null {
  const [title, setTitle] = useState(track?.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [track]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!track) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onRename(title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <h2 className="text-lg font-semibold text-text-primary">Renomear música</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm text-text-secondary mb-2">Novo título</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-bg-tertiary focus:border-accent-primary text-text-primary placeholder-text-muted outline-none transition-colors"
              placeholder="Digite o novo título..."
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.trim() === track.title}
              className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Renomear
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Add to Playlist Modal
interface AddToPlaylistModalProps {
  track: Track | null;
  onClose: () => void;
}

interface Playlist {
  id: number;
  name: string;
  trackCount: number;
}

export function AddToPlaylistModal({ track, onClose }: AddToPlaylistModalProps): JSX.Element | null {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);

  useEffect(() => {
    const loadPlaylists = async () => {
      if (window.electronAPI) {
        const data = await window.electronAPI.getPlaylists();
        setPlaylists(data);
        setLoading(false);
      }
    };
    loadPlaylists();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!track) return null;

  const handleAddToPlaylist = async (playlistId: number) => {
    if (window.electronAPI) {
      await window.electronAPI.addToPlaylist(playlistId, track.id);
      onClose();
    }
  };

  const handleCreatePlaylist = async () => {
    if (window.electronAPI && newPlaylistName.trim()) {
      const playlistId = await window.electronAPI.createPlaylist(newPlaylistName.trim());
      await window.electronAPI.addToPlaylist(playlistId, track.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <h2 className="text-lg font-semibold text-text-primary">Adicionar à playlist</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Track preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary mb-4">
            <div className="w-12 h-12 rounded bg-bg-primary overflow-hidden flex-shrink-0">
              {track.thumbnail ? (
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-text-muted" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{track.title}</p>
              <p className="text-xs text-text-secondary truncate">{track.artist}</p>
            </div>
          </div>

          {/* Playlists list */}
          {loading ? (
            <div className="text-center py-8 text-text-muted">Carregando...</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {playlists.length === 0 && !showNewPlaylist ? (
                <div className="text-center py-8 text-text-muted">
                  <p>Nenhuma playlist encontrada</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary transition-colors text-left"
                  >
                    <span className="text-text-primary">{playlist.name}</span>
                    <span className="text-xs text-text-muted">{playlist.trackCount} faixas</span>
                  </button>
                ))
              )}

              {/* New playlist form */}
              {showNewPlaylist ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Nome da playlist..."
                    className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-bg-tertiary focus:border-accent-primary text-text-primary placeholder-text-muted outline-none text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePlaylist();
                      if (e.key === 'Escape') setShowNewPlaylist(false);
                    }}
                  />
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                    className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-sm transition-colors disabled:opacity-50"
                  >
                    Criar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewPlaylist(true)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-bg-tertiary hover:border-accent-primary hover:bg-accent-primary/5 transition-colors text-text-secondary hover:text-accent-primary"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Criar nova playlist</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-bg-tertiary">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
