import { useState, useCallback, useRef, memo, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play, MoreHorizontal, Music, Clock, Heart, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore, Track } from '../stores/playerStore';
import {
  TrackContextMenu,
  TrackInfoModal,
  RenameTrackModal,
  AddToPlaylistModal,
} from './TrackContextMenu';

// Default column widths
const DEFAULT_COLUMN_WIDTHS = {
  title: 45, // percentage
  album: 25, // percentage
};

interface ColumnWidths {
  title: number;
  album: number;
}

interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track, index: number) => void;
  viewMode?: 'list' | 'grid' | 'columns';
  showIndex?: boolean;
  showPlayCount?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number) => void;
  onRemoveFromPlaylist?: (trackId: number) => void;
  showRemoveFromPlaylist?: boolean;
  onTrackUpdate?: (trackId: number, updates: Partial<Track>) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const ITEM_HEIGHT = 56; // Height of each track item in pixels

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
  // Only subscribe to the specific values we need to minimize re-renders
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_COLUMN_WIDTHS);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidths = useRef<ColumnWidths>(DEFAULT_COLUMN_WIDTHS);

  // Load column widths from settings
  useEffect(() => {
    const loadColumnWidths = async () => {
      if (window.electronAPI?.getSettings) {
        const settings = await window.electronAPI.getSettings();
        if (settings.columnWidths) {
          setColumnWidths(settings.columnWidths);
        }
      }
    };
    loadColumnWidths();
  }, []);

  // Save column widths to settings
  const saveColumnWidths = useCallback(async (widths: ColumnWidths) => {
    if (window.electronAPI?.saveSettings) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({ ...settings, columnWidths: widths });
    }
  }, []);

  // Handle column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsResizing(column);
    resizeStartX.current = e.clientX;
    resizeStartWidths.current = { ...columnWidths };
  }, [columnWidths]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!headerRef.current) return;

      const headerWidth = headerRef.current.offsetWidth;
      const deltaX = e.clientX - resizeStartX.current;
      const deltaPercent = (deltaX / headerWidth) * 100;

      if (isResizing === 'title') {
        const newTitleWidth = Math.max(20, Math.min(60, resizeStartWidths.current.title + deltaPercent));
        const newAlbumWidth = Math.max(10, Math.min(40, resizeStartWidths.current.album - deltaPercent));
        setColumnWidths({ title: newTitleWidth, album: newAlbumWidth });
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        saveColumnWidths(columnWidths);
      }
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, columnWidths, saveColumnWidths]);

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
      const newFavoriteState = await window.electronAPI.toggleFavorite(contextMenuTrack.id);
      onTrackUpdate?.(contextMenuTrack.id, { isFavorite: newFavoriteState });
    }
  }, [contextMenuTrack, onTrackUpdate]);

  const handleRenameSubmit = useCallback(async (newTitle: string) => {
    if (renameTrack && window.electronAPI) {
      await window.electronAPI.renameTrack(renameTrack.id, newTitle);
      onTrackUpdate?.(renameTrack.id, { title: newTitle });
    }
  }, [renameTrack, onTrackUpdate]);

  const handleTrackToggleFavorite = useCallback(async (trackId: number, currentState: boolean) => {
    // Optimistic update - immediately update the UI
    onTrackUpdate?.(trackId, { isFavorite: !currentState });

    // Then make the API call
    if (window.electronAPI) {
      try {
        const newState = await window.electronAPI.toggleFavorite(trackId);
        // If the API returned a different state than expected, update again
        if (newState !== !currentState) {
          onTrackUpdate?.(trackId, { isFavorite: newState });
        }
      } catch (error) {
        // Revert on error
        console.error('Error toggling favorite:', error);
        onTrackUpdate?.(trackId, { isFavorite: currentState });
      }
    }
  }, [onTrackUpdate]);

  // Virtualizer for list view - reduced overscan for better performance
  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tracks.map((track, index) => (
            <TrackGridItem
              key={track.id}
              track={track}
              isActive={currentTrackId === track.id}
              isPlaying={currentTrackId === track.id && isPlaying}
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

  // Columns view - iTunes style table
  if (viewMode === 'columns') {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-bg-tertiary bg-bg-secondary/50 flex-shrink-0">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-4">Título</span>
            <span className="col-span-3">Artista</span>
            <span className="col-span-2">Álbum</span>
            <span className="col-span-1 text-center">
              <Clock className="w-4 h-4 inline" />
            </span>
            <span className="col-span-1" />
          </div>

          {/* Virtualized rows */}
          <div ref={parentRef} className="flex-1 overflow-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const track = tracks[virtualRow.index];
                const index = virtualRow.index;
                const isActive = currentTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`grid grid-cols-12 gap-2 px-4 items-center cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-accent-primary/20 text-accent-primary'
                        : 'hover:bg-bg-tertiary/50'
                    }`}
                    onClick={() => onPlay(track, index)}
                    onContextMenu={(e) => handleContextMenu(e, track, index)}
                  >
                    <span className="col-span-1 text-center text-sm text-text-muted">
                      {isActive && isPlaying ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <span className="w-0.5 h-3 bg-accent-primary rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <span className="w-0.5 h-3 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-bg-tertiary overflow-hidden flex-shrink-0">
                        {track.thumbnail ? (
                          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-4 h-4 text-text-muted" />
                          </div>
                        )}
                      </div>
                      <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>
                        {track.title}
                      </span>
                    </div>
                    <span className="col-span-3 truncate text-sm text-text-secondary">
                      {track.artist || 'Artista desconhecido'}
                    </span>
                    <span className="col-span-2 truncate text-sm text-text-muted">
                      {track.album || '-'}
                    </span>
                    <span className="col-span-1 text-center text-sm text-text-muted">
                      {formatDuration(track.duration)}
                    </span>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => handleContextMenu(e, track, index)}
                        className="p-1 rounded hover:bg-bg-tertiary opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          ref={headerRef}
          className={`flex items-center gap-2 px-4 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-bg-tertiary flex-shrink-0 select-none ${isResizing ? 'cursor-col-resize' : ''}`}
        >
          {showIndex && <span className="w-8 text-center flex-shrink-0">#</span>}
          {selectable && <span className="w-6 flex-shrink-0" />}
          <span className="w-5 flex-shrink-0" /> {/* Favorite icon space */}
          <span className="w-10 flex-shrink-0" /> {/* Thumbnail space */}

          {/* Title column - resizable */}
          <div className="flex items-center min-w-0" style={{ width: `${columnWidths.title}%` }}>
            <span className="flex-1 truncate">Título</span>
            {/* Resize handle */}
            <div
              className="w-4 h-full flex items-center justify-center cursor-col-resize group hover:bg-accent-primary/20 rounded mx-1"
              onMouseDown={(e) => handleResizeStart(e, 'title')}
              title="Arraste para redimensionar"
            >
              <div className={`w-0.5 h-4 rounded-full transition-colors ${isResizing === 'title' ? 'bg-accent-primary' : 'bg-text-muted/30 group-hover:bg-accent-primary/50'}`} />
            </div>
          </div>

          {/* Album column - resizable */}
          <div className="hidden md:flex items-center min-w-0" style={{ width: `${columnWidths.album}%` }}>
            <span className="flex-1 truncate">Álbum</span>
          </div>

          {showPlayCount && <span className="w-20 text-center hidden sm:block flex-shrink-0">Tocadas</span>}
          <span className="w-16 text-right flex-shrink-0">
            <Clock className="w-4 h-4 inline" />
          </span>
          <span className="w-10 flex-shrink-0" />
        </div>

        {/* Virtualized track list */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const track = tracks[virtualRow.index];
              const index = virtualRow.index;
              return (
                <div
                  key={track.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TrackListItem
                    track={track}
                    index={index}
                    isActive={currentTrackId === track.id}
                    isPlaying={currentTrackId === track.id && isPlaying}
                    showIndex={showIndex}
                    showPlayCount={showPlayCount}
                    selectable={selectable}
                    isSelected={selectedIds.includes(track.id)}
                    onSelect={onSelect}
                    onClick={onPlay}
                    onContextMenu={handleContextMenu}
                    onToggleFavorite={handleTrackToggleFavorite}
                    columnWidths={columnWidths}
                  />
                </div>
              );
            })}
          </div>
        </div>
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
  onSelect?: (id: number) => void;
  onClick: (track: Track, index: number) => void;
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void;
  onToggleFavorite: (trackId: number, currentState: boolean) => void;
  columnWidths: ColumnWidths;
}

const TrackListItem = memo(function TrackListItem({
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
  columnWidths,
}: TrackListItemProps): JSX.Element {
  const handleClick = useCallback(() => {
    if (selectable) {
      onSelect?.(track.id);
    } else {
      onClick(track, index);
    }
  }, [selectable, onSelect, onClick, track, index]);

  const handleDoubleClick = useCallback(() => {
    if (selectable) {
      onClick(track, index);
    }
  }, [selectable, onClick, track, index]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    onContextMenu(e, track, index);
  }, [onContextMenu, track, index]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(track.id, track.isFavorite);
  }, [onToggleFavorite, track.id, track.isFavorite]);

  return (
    <div
      className={`track-item flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer group h-full ${
        isActive
          ? 'bg-accent-primary/20 border border-accent-primary/30'
          : 'hover:bg-bg-tertiary'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Index or play indicator */}
      {showIndex && (
        <div className="w-8 text-center flex-shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-center justify-center gap-0.5">
              <span className="w-1 h-3 bg-accent-primary rounded-full playing-bar" />
              <span className="w-1 h-4 bg-accent-primary rounded-full playing-bar" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-2 bg-accent-primary rounded-full playing-bar" style={{ animationDelay: '0.4s' }} />
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
        <div className="w-6 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(track.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-2 border-text-muted checked:border-accent-primary checked:bg-accent-primary cursor-pointer"
          />
        </div>
      )}

      {/* Favorite button */}
      <motion.button
        onClick={handleToggleFavorite}
        whileTap={{ scale: 1.4 }}
        animate={track.isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors ${
          track.isFavorite
            ? 'text-accent-primary'
            : 'text-text-muted opacity-0 group-hover:opacity-100'
        }`}
        title={track.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart className={`w-4 h-4 transition-all duration-150 ${track.isFavorite ? 'fill-current' : ''}`} />
      </motion.button>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-text-muted" />
          </div>
        )}
      </div>

      {/* Title and artist - resizable */}
      <div className="min-w-0" style={{ width: `${columnWidths.title}%` }}>
        <h4 className={`text-sm font-medium truncate ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
          {track.title}
        </h4>
        <p className="text-xs text-text-secondary truncate">
          {track.artist || 'Artista desconhecido'}
        </p>
      </div>

      {/* Album - resizable */}
      <div className="hidden md:block min-w-0" style={{ width: `${columnWidths.album}%` }}>
        <p className="text-sm text-text-secondary truncate">
          {track.album || '-'}
        </p>
      </div>

      {/* Play count */}
      {showPlayCount && (
        <div className="w-20 text-center hidden sm:block flex-shrink-0">
          <span className="text-sm text-text-secondary">{track.playCount}</span>
        </div>
      )}

      {/* Duration */}
      <div className="w-16 text-right flex-shrink-0">
        <span className="text-sm text-text-secondary">
          {formatDuration(track.duration)}
        </span>
      </div>

      {/* More button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleContextMenu(e);
        }}
        className="w-10 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-5 h-5 text-text-secondary hover:text-text-primary" />
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.track.title === nextProps.track.title &&
    prevProps.track.isFavorite === nextProps.track.isFavorite &&
    prevProps.index === nextProps.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showIndex === nextProps.showIndex &&
    prevProps.showPlayCount === nextProps.showPlayCount &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.columnWidths.title === nextProps.columnWidths.title &&
    prevProps.columnWidths.album === nextProps.columnWidths.album
  );
});

interface TrackGridItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const TrackGridItem = memo(function TrackGridItem({
  track,
  isActive,
  isPlaying,
  onClick,
  onContextMenu,
}: TrackGridItemProps): JSX.Element {
  return (
    <div
      className={`p-3 rounded-xl cursor-pointer group relative transition-transform hover:scale-[1.02] active:scale-[0.98] ${
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
            loading="lazy"
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
            <span className="w-1 h-2 bg-white rounded-full playing-bar" />
            <span className="w-1 h-3 bg-white rounded-full playing-bar" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-2 bg-white rounded-full playing-bar" style={{ animationDelay: '0.4s' }} />
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
    </div>
  );
});
