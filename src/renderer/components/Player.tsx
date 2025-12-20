import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Heart,
  X,
  Music
} from 'lucide-react';
import { usePlayerStore, Track } from '../stores/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Player(): JSX.Element {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    queueIndex,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    playTrackFromQueue,
    removeFromQueue,
  } = usePlayerStore();

  // Progress bar state
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Volume slider state
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Queue panel state
  const [showQueue, setShowQueue] = useState(false);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(currentTrack?.isFavorite || false);

  // Update favorite state when track changes
  useEffect(() => {
    setIsFavorite(currentTrack?.isFavorite || false);
  }, [currentTrack]);

  // Update local volume when store volume changes
  useEffect(() => {
    if (!isDraggingVolume) {
      setLocalVolume(volume);
    }
  }, [volume, isDraggingVolume]);

  const progress = isDraggingProgress ? localProgress : (currentTime / duration) * 100 || 0;
  const displayVolume = isDraggingVolume ? localVolume : volume;

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  };

  // Handle progress bar drag start
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    e.preventDefault();
    setIsDraggingProgress(true);
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setLocalProgress(percent);
  };

  // Progress drag effect
  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setLocalProgress(percent);
    };

    const handleMouseUp = () => {
      if (duration) {
        seek((localProgress / 100) * duration);
      }
      setIsDraggingProgress(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, localProgress, duration, seek]);

  // Handle volume click
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  // Handle volume drag start
  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    e.preventDefault();
    setIsDraggingVolume(true);
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setLocalVolume(percent);
  };

  // Volume drag effect
  useEffect(() => {
    if (!isDraggingVolume) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!volumeRef.current) return;
      const rect = volumeRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setLocalVolume(percent);
      setVolume(percent);
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume, setVolume]);

  // Handle volume scroll
  const handleVolumeScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
  }, [volume, setVolume]);

  // Toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (currentTrack && window.electronAPI) {
      const newState = await window.electronAPI.toggleFavorite(currentTrack.id);
      setIsFavorite(newState);
    }
  }, [currentTrack]);

  // Volume icon based on level
  const VolumeIcon = isMuted || displayVolume === 0 ? VolumeX : displayVolume < 0.5 ? Volume1 : Volume2;

  // Repeat icon based on mode
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <>
      <div className="h-[var(--player-height)] bg-bg-secondary border-t border-bg-tertiary flex items-center px-4">
        {/* Track info - fixed width left section */}
        <div className="flex items-center gap-3 w-[280px] min-w-[200px] flex-shrink-0">
          {currentTrack ? (
            <>
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-bg-tertiary overflow-hidden flex-shrink-0">
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-6 h-6 text-text-muted" />
                  </div>
                )}
              </div>

              {/* Title and artist */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-text-primary truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-text-secondary truncate">
                  {currentTrack.artist || 'Artista desconhecido'}
                </p>
              </div>

              {/* Like button */}
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full hover:bg-bg-tertiary transition-colors ${
                  isFavorite ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-bg-tertiary flex items-center justify-center">
                <ListMusic className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Nenhuma música</p>
                <p className="text-xs text-text-muted">Selecione uma faixa</p>
              </div>
            </div>
          )}
        </div>

        {/* Player controls - centered section */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffled
                  ? 'text-accent-primary hover:text-accent-hover'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Aleatório"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={previous}
              className="p-2 rounded-full text-text-secondary hover:text-text-primary transition-colors"
              title="Anterior"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => (isPlaying ? pause() : play())}
              className="w-10 h-10 rounded-full bg-accent-primary hover:bg-accent-hover text-white flex items-center justify-center transition-colors"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>

            {/* Next */}
            <button
              onClick={next}
              className="p-2 rounded-full text-text-secondary hover:text-text-primary transition-colors"
              title="Próxima"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off'
                  ? 'text-accent-primary hover:text-accent-hover'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title={
                repeatMode === 'off'
                  ? 'Repetir desativado'
                  : repeatMode === 'all'
                  ? 'Repetir todas'
                  : 'Repetir uma'
              }
            >
              <RepeatIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-[600px] flex items-center gap-2">
            <span className="text-xs text-text-muted w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div
              ref={progressRef}
              className="flex-1 h-1.5 bg-player-progress-bg rounded-full cursor-pointer group relative"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              {/* Progress fill */}
              <div
                className="h-full bg-player-progress rounded-full"
                style={{ width: `${progress}%`, transition: isDraggingProgress ? 'none' : 'width 0.1s ease-out' }}
              />
              {/* Drag handle - positioned relative to full bar */}
              <div
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>

            <span className="text-xs text-text-muted w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume and other controls - fixed width right section */}
        <div className="flex items-center gap-3 w-[200px] justify-end flex-shrink-0">
          {/* Queue button */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 rounded-full transition-colors ${
              showQueue ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Fila de reprodução"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume control with scroll */}
          <div
            className="flex items-center gap-2 relative"
            onWheel={handleVolumeScroll}
          >
            <button
              onClick={toggleMute}
              className="p-2 rounded-full text-text-secondary hover:text-text-primary transition-colors"
              title={isMuted ? 'Ativar som' : 'Mudo'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <div
              ref={volumeRef}
              className="w-24 h-1.5 bg-player-progress-bg rounded-full cursor-pointer group relative"
              onClick={handleVolumeClick}
              onMouseDown={handleVolumeMouseDown}
            >
              {/* Volume fill */}
              <div
                className="h-full bg-player-progress rounded-full"
                style={{ width: `${isMuted ? 0 : displayVolume * 100}%`, transition: isDraggingVolume ? 'none' : 'width 0.1s ease-out' }}
              />
              {/* Drag handle - positioned relative to full bar */}
              <div
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${isMuted ? 0 : displayVolume * 100}%`, transform: 'translate(-50%, -50%)' }}
              />

              {/* Volume percentage tooltip - shows on hover and drag */}
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-bg-tertiary text-xs text-text-primary font-medium whitespace-nowrap transition-opacity ${
                  isDraggingVolume ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {Math.round((isMuted ? 0 : displayVolume) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && (
          <QueuePanel
            queue={queue}
            currentIndex={queueIndex}
            onClose={() => setShowQueue(false)}
            onPlayTrack={playTrackFromQueue}
            onRemoveTrack={removeFromQueue}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Queue Panel Component
interface QueuePanelProps {
  queue: Track[];
  currentIndex: number;
  onClose: () => void;
  onPlayTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
}

function QueuePanel({ queue, currentIndex, onClose, onPlayTrack, onRemoveTrack }: QueuePanelProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-[var(--header-height)] bottom-[var(--player-height)] w-80 bg-bg-secondary border-l border-bg-tertiary z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
        <h3 className="text-lg font-semibold text-text-primary">Fila de reprodução</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-bg-tertiary transition-colors"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <ListMusic className="w-12 h-12 mb-2" />
            <p>Fila vazia</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {queue.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group ${
                  index === currentIndex
                    ? 'bg-accent-primary/20 border border-accent-primary/30'
                    : 'hover:bg-bg-tertiary'
                }`}
                onClick={() => onPlayTrack(index)}
              >
                {/* Index or playing indicator */}
                <div className="w-6 text-center">
                  {index === currentIndex ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="w-0.5 h-2 bg-accent-primary rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-0.5 h-2 bg-accent-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">{index + 1}</span>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="w-10 h-10 rounded bg-bg-tertiary overflow-hidden flex-shrink-0">
                  {track.thumbnail ? (
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${index === currentIndex ? 'text-accent-primary' : 'text-text-primary'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-xs text-text-muted">{formatDuration(track.duration)}</span>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(index);
                  }}
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-bg-primary transition-all"
                  title="Remover da fila"
                >
                  <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-bg-tertiary text-center text-sm text-text-muted">
        {queue.length} {queue.length === 1 ? 'música' : 'músicas'} na fila
      </div>
    </motion.div>
  );
}
