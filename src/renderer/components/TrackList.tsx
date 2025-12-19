import { useState, useCallback } from 'react';
import { Play, MoreHorizontal, Music, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore, Track } from '../stores/playerStore';
import {
  TrackContextMenu,
  TrackInfoModal,
  RenameTrackModal,
  AddToPlaylistModal,
} from './TrackContextMenu';

interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track, index: number) => void;
  viewMode?: 'list' | 'grid';
  showIndex?: boolean;
  showPlayCount?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number) => void;
  onRemoveFromPlaylist?: (trackId: number) => void;
  showRemoveFromPlaylist?: boolean;
  onTrackUpdate?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TrackList({
  tracks,
  onPlay,
  viewMode = 'list',
  showIndex = false,
  showPlayCount = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onRemoveFromPlaylist,
  showRemoveFromPlaylist = false,
  onTrackUpdate,
}: TrackListProps): JSX.Element {
  const { currentTrack, isPlaying } = usePlayerStore();

  // Context menu state
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIndex, setContextMenuIndex] = useState<number>(-1);

  // Modal states
  const [infoTrack, setInfoTrack] = useState<Track | null>(null);
  const [renameTrack, setRenameTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuTrack(track);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuIndex(index);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuTrack(null);
    setContextMenuPosition(null);
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (contextMenuTrack && window.electronAPI) {
      await window.electronAPI.toggleFavorite(contextMenuTrack.id);
      onTrackUpdate?.();
    }
  }, [contextMenuTrack, onTrackUpdate]);

  const handleRenameSubmit = useCallback(async (newTitle: string) => {
    if (renameTrack && window.electronAPI) {
      await window.electronAPI.renameTrack(renameTrack.id, newTitle);
      onTrackUpdate?.();
    }
  }, [renameTrack, onTrackUpdate]);

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tracks.map((track, index) => (
            <TrackGridItem
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              isPlaying={currentTrack?.id === track.id && isPlaying}
              onClick={() => onPlay(track, index)}
              onContextMenu={(e) => handleContextMenu(e, track, index)}
            />
          ))}
        </div>

        {/* Context Menu */}
        <TrackContextMenu
          track={contextMenuTrack}
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
          onPlay={() => contextMenuTrack && onPlay(contextMenuTrack, contextMenuIndex)}
          onToggleFavorite={handleToggleFavorite}
          onRename={() => setRenameTrack(contextMenuTrack)}
          onShowInfo={() => setInfoTrack(contextMenuTrack)}
          onAddToPlaylist={() => setAddToPlaylistTrack(contextMenuTrack)}
          onRemoveFromPlaylist={showRemoveFromPlaylist && contextMenuTrack ? () => onRemoveFromPlaylist?.(contextMenuTrack.id) : undefined}
          showRemoveFromPlaylist={showRemoveFromPlaylist}
        />

        {/* Modals */}
        {infoTrack && <TrackInfoModal track={infoTrack} onClose={() => setInfoTrack(null)} />}
        {renameTrack && <RenameTrackModal track={renameTrack} onClose={() => setRenameTrack(null)} onRename={handleRenameSubmit} />}
        {addToPlaylistTrack && <AddToPlaylistModal track={addToPlaylistTrack} onClose={() => setAddToPlaylistTrack(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-bg-tertiary">
          {showIndex && <span className="w-8 text-center">#</span>}
          {selectable && <span className="w-6" />}
          <span className="w-4" /> {/* Favorite icon space */}
          <span className="flex-1">Título</span>
          <span className="w-32 hidden md:block">Álbum</span>
          {showPlayCount && <span className="w-20 text-center hidden sm:block">Tocadas</span>}
          <span className="w-16 text-right">
            <Clock className="w-4 h-4 inline" />
          </span>
          <span className="w-10" />
        </div>

        {/* Track items */}
        {tracks.map((track, index) => (
          <TrackListItem
            key={track.id}
            track={track}
            index={index}
            isActive={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            showIndex={showIndex}
            showPlayCount={showPlayCount}
            selectable={selectable}
            isSelected={selectedIds.includes(track.id)}
            onSelect={() => onSelect?.(track.id)}
            onClick={() => onPlay(track, index)}
            onContextMenu={(e) => handleContextMenu(e, track, index)}
            onToggleFavorite={async () => {
              if (window.electronAPI) {
                await window.electronAPI.toggleFavorite(track.id);
                onTrackUpdate?.();
              }
            }}
          />
        ))}
      </div>

      {/* Context Menu */}
      <TrackContextMenu
        track={contextMenuTrack}
        position={contextMenuPosition}
        onClose={handleCloseContextMenu}
        onPlay={() => contextMenuTrack && onPlay(contextMenuTrack, contextMenuIndex)}
        onToggleFavorite={handleToggleFavorite}
        onRename={() => setRenameTrack(contextMenuTrack)}
        onShowInfo={() => setInfoTrack(contextMenuTrack)}
        onAddToPlaylist={() => setAddToPlaylistTrack(contextMenuTrack)}
        onRemoveFromPlaylist={showRemoveFromPlaylist && contextMenuTrack ? () => onRemoveFromPlaylist?.(contextMenuTrack.id) : undefined}
        showRemoveFromPlaylist={showRemoveFromPlaylist}
      />

      {/* Modals */}
      {infoTrack && <TrackInfoModal track={infoTrack} onClose={() => setInfoTrack(null)} />}
      {renameTrack && <RenameTrackModal track={renameTrack} onClose={() => setRenameTrack(null)} onRename={handleRenameSubmit} />}
      {addToPlaylistTrack && <AddToPlaylistModal track={addToPlaylistTrack} onClose={() => setAddToPlaylistTrack(null)} />}
    </>
  );
}

interface TrackListItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  showIndex: boolean;
  showPlayCount: boolean;
  selectable: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onToggleFavorite: () => void;
}

function TrackListItem({
  track,
  index,
  isActive,
  isPlaying,
  showIndex,
  showPlayCount,
  selectable,
  isSelected,
  onSelect,
  onClick,
  onContextMenu,
  onToggleFavorite,
}: TrackListItemProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`track-item flex items-center gap-4 px-4 py-2 rounded-lg cursor-pointer group ${
        isActive
          ? 'bg-accent-primary/20 border border-accent-primary/30'
          : 'hover:bg-bg-tertiary'
      }`}
      onClick={selectable ? onSelect : onClick}
      onDoubleClick={selectable ? onClick : undefined}
      onContextMenu={onContextMenu}
    >
      {/* Index or play indicator */}
      {showIndex && (
        <div className="w-8 text-center">
          {isActive && isPlaying ? (
            <div className="flex items-center justify-center gap-0.5">
              <span className="w-1 h-3 bg-accent-primary rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-2 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : (
            <span className="text-text-muted group-hover:hidden">{index + 1}</span>
          )}
          {!isPlaying && (
            <Play className="w-4 h-4 text-text-primary hidden group-hover:block mx-auto" />
          )}
        </div>
      )}

      {/* Checkbox for selection */}
      {selectable && (
        <div className="w-6">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-2 border-text-muted checked:border-accent-primary checked:bg-accent-primary cursor-pointer"
          />
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`w-4 h-4 transition-colors ${
          track.isFavorite
            ? 'text-accent-primary'
            : 'text-text-muted opacity-0 group-hover:opacity-100'
        }`}
        title={track.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-5 h-5 text-text-muted" />
          </div>
        )}
      </div>

      {/* Title and artist */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium truncate ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
          {track.title}
        </h4>
        <p className="text-xs text-text-secondary truncate">
          {track.artist || 'Artista desconhecido'}
        </p>
      </div>

      {/* Album */}
      <div className="w-32 hidden md:block">
        <p className="text-sm text-text-secondary truncate">
          {track.album || '-'}
        </p>
      </div>

      {/* Play count */}
      {showPlayCount && (
        <div className="w-20 text-center hidden sm:block">
          <span className="text-sm text-text-secondary">{track.playCount}</span>
        </div>
      )}

      {/* Duration */}
      <div className="w-16 text-right">
        <span className="text-sm text-text-secondary">
          {formatDuration(track.duration)}
        </span>
      </div>

      {/* More button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e);
        }}
        className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-5 h-5 text-text-secondary hover:text-text-primary" />
      </button>
    </motion.div>
  );
}

interface TrackGridItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function TrackGridItem({
  track,
  isActive,
  isPlaying,
  onClick,
  onContextMenu,
}: TrackGridItemProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-3 rounded-xl cursor-pointer group relative ${
        isActive ? 'bg-accent-primary/20' : 'bg-bg-secondary hover:bg-bg-tertiary'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Favorite indicator */}
      {track.isFavorite && (
        <div className="absolute top-2 right-2 z-10">
          <Heart className="w-4 h-4 text-accent-primary fill-current" />
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-square rounded-lg bg-bg-tertiary overflow-hidden mb-3">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-text-muted" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>

        {/* Playing indicator */}
        {isActive && isPlaying && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-accent-primary rounded-full px-2 py-1">
            <span className="w-1 h-2 bg-white rounded-full animate-pulse" />
            <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <h4 className={`text-sm font-medium truncate ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
        {track.title}
      </h4>
      <p className="text-xs text-text-secondary truncate">
        {track.artist || 'Artista desconhecido'}
      </p>
    </motion.div>
  );
}
