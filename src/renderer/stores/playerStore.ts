import { create } from 'zustand';
import { Howl } from 'howler';
import { useEqualizerStore } from './equalizerStore';

export interface Track {
  id: number;
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  thumbnail: string | null;
  playCount: number;
  addedAt: string;
  lastPlayed: string | null;
  size: number;
  isFavorite: boolean;
}

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  // Current state
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isInitialized: boolean;

  // Howl instance
  howl: Howl | null;
  // MediaElementAudioSourceNode for equalizer
  mediaSource: MediaElementAudioSourceNode | null;

  // Actions
  loadTrack: (track: Track, autoPlay?: boolean) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playTrackFromQueue: (index: number) => void;
  restoreState: () => Promise<void>;
  saveState: () => void;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Debounce helper for saving state
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(fn: () => void, delay = 1000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(fn, delay);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  repeatMode: 'off',
  isShuffled: false,
  isInitialized: false,
  howl: null,
  mediaSource: null,

  loadTrack: (track: Track, autoPlay = true) => {
    const { howl: oldHowl, volume, isMuted, mediaSource: oldMediaSource } = get();

    // Disconnect old media source from equalizer
    if (oldMediaSource) {
      try {
        oldMediaSource.disconnect();
      } catch (e) {
        console.error('Error disconnecting old media source:', e);
      }
    }

    // Clean up old instance - stop it first, then unload
    if (oldHowl) {
      try {
        oldHowl.stop();
        oldHowl.unload();
      } catch (e) {
        console.error('Error unloading old howl:', e);
      }
    }

    // Clear howl from state immediately
    set({ howl: null, mediaSource: null });

    // Convert file path to media:// URL for Electron custom protocol
    // Handle Windows paths (D:\folder\file.mp3 -> media://D:/folder/file.mp3)
    let fileUrl = track.path;
    if (!fileUrl.startsWith('media://')) {
      // Replace backslashes with forward slashes
      fileUrl = 'media://' + track.path.replace(/\\/g, '/');
    }

    // Initialize equalizer audio context
    const equalizerStore = useEqualizerStore.getState();
    equalizerStore.initAudioContext();

    // Create new Howl instance
    const howl = new Howl({
      src: [fileUrl],
      html5: true, // Required for large files
      volume: isMuted ? 0 : volume,
      onload: () => {
        set({ duration: howl.duration() });

        // Connect audio to equalizer after load
        try {
          // Get the HTML5 audio element from Howler
          const sounds = (howl as any)._sounds;
          if (sounds && sounds.length > 0) {
            const audioElement = sounds[0]._node as HTMLAudioElement;

            if (audioElement) {
              // Use equalizerStore's connectMediaElement to handle connection
              const mediaSource = equalizerStore.connectMediaElement(audioElement);
              if (mediaSource) {
                set({ mediaSource });
                console.log('Audio connected to equalizer');
              }
            }
          }
        } catch (e) {
          console.error('Error connecting audio to equalizer:', e);
        }
      },
      onplay: () => {
        set({ isPlaying: true });
        // Start tracking time - only if this howl is still the current one
        const updateTime = () => {
          const currentHowl = get().howl;
          if (get().isPlaying && currentHowl === howl) {
            const time = howl.seek() as number;
            set({ currentTime: time });
            // Save state periodically while playing
            debouncedSave(() => get().saveState(), 5000);
            requestAnimationFrame(updateTime);
          }
        };
        requestAnimationFrame(updateTime);

        // Update play count only if autoPlay is true
        if (autoPlay && window.electronAPI) {
          window.electronAPI.incrementPlayCount(track.id);
        }
      },
      onpause: () => {
        set({ isPlaying: false });
        get().saveState();
      },
      onstop: () => {
        set({ isPlaying: false, currentTime: 0 });
      },
      onend: () => {
        const { repeatMode, next } = get();
        if (repeatMode === 'one') {
          howl.seek(0);
          howl.play();
        } else {
          next();
        }
      },
      onloaderror: (_id, error) => {
        console.error('Error loading track:', error);
        set({ isPlaying: false });
      },
    });

    set({ currentTrack: track, howl, currentTime: 0 });

    // Auto play if requested
    if (autoPlay) {
      // Small delay to ensure howl is ready
      setTimeout(() => {
        const currentHowl = get().howl;
        if (currentHowl === howl) {
          howl.play();
        }
      }, 100);
    }

    get().saveState();
  },

  play: () => {
    const { howl, currentTrack, queue, queueIndex, loadTrack } = get();

    if (howl) {
      howl.play();
    } else if (currentTrack) {
      loadTrack(currentTrack);
    } else if (queue.length > 0) {
      const index = queueIndex >= 0 ? queueIndex : 0;
      loadTrack(queue[index]);
      set({ queueIndex: index });
    }
  },

  pause: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
    }
  },

  stop: () => {
    const { howl } = get();
    if (howl) {
      howl.stop();
      set({ currentTime: 0 });
    }
  },

  next: () => {
    const { queue, queueIndex, repeatMode, isShuffled, loadTrack } = get();

    if (queue.length === 0) return;

    let nextIndex: number;

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({ queueIndex: nextIndex });
    loadTrack(queue[nextIndex]);
  },

  previous: () => {
    const { queue, queueIndex, currentTime, howl, loadTrack } = get();

    // If more than 3 seconds into the song, restart it
    if (currentTime > 3) {
      howl?.seek(0);
      set({ currentTime: 0 });
      return;
    }

    if (queue.length === 0) return;

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    set({ queueIndex: prevIndex });
    loadTrack(queue[prevIndex]);
  },

  seek: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
      set({ currentTime: time });
    }
  },

  setVolume: (volume: number) => {
    const { howl } = get();
    set({ volume, isMuted: false });
    if (howl) {
      howl.volume(volume);
    }
    debouncedSave(() => get().saveState(), 500);
  },

  toggleMute: () => {
    const { howl, isMuted, volume } = get();
    set({ isMuted: !isMuted });
    if (howl) {
      howl.volume(!isMuted ? 0 : volume);
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
    get().saveState();
  },

  toggleShuffle: () => {
    const { isShuffled, queue, currentTrack } = get();
    set({ isShuffled: !isShuffled });

    // If enabling shuffle, reshuffle the queue (keeping current track)
    if (!isShuffled && queue.length > 1 && currentTrack) {
      const otherTracks = queue.filter((t) => t.id !== currentTrack.id);
      const shuffled = [currentTrack, ...shuffleArray(otherTracks)];
      set({ queue: shuffled, queueIndex: 0 });
    }
    get().saveState();
  },

  setQueue: (tracks: Track[], startIndex = 0) => {
    const { loadTrack, isShuffled } = get();

    let queue = [...tracks];
    let index = startIndex;

    if (isShuffled) {
      const currentTrack = tracks[startIndex];
      const otherTracks = tracks.filter((_, i) => i !== startIndex);
      queue = [currentTrack, ...shuffleArray(otherTracks)];
      index = 0;
    }

    set({ queue, queueIndex: index });

    if (tracks.length > 0) {
      loadTrack(queue[index], true);
    }
  },

  addToQueue: (track: Track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
    get().saveState();
  },

  removeFromQueue: (index: number) => {
    const { queue, queueIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);

    let newIndex = queueIndex;
    if (index < queueIndex) {
      newIndex--;
    } else if (index === queueIndex && newIndex >= newQueue.length) {
      newIndex = newQueue.length - 1;
    }

    set({ queue: newQueue, queueIndex: newIndex });
    get().saveState();
  },

  clearQueue: () => {
    const { howl } = get();
    if (howl) {
      howl.unload();
    }
    set({
      queue: [],
      queueIndex: -1,
      currentTrack: null,
      howl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
    get().saveState();
  },

  playTrackFromQueue: (index: number) => {
    const { queue, loadTrack } = get();
    if (index >= 0 && index < queue.length) {
      set({ queueIndex: index });
      loadTrack(queue[index], true);
    }
  },

  saveState: () => {
    const { currentTrack, currentTime, volume, repeatMode, isShuffled, queue, queueIndex } = get();

    if (window.electronAPI) {
      window.electronAPI.savePlayerState({
        trackId: currentTrack?.id ?? null,
        currentTime,
        volume,
        repeatMode,
        isShuffled,
        queueIds: queue.map(t => t.id),
        queueIndex,
      });
    }
  },

  restoreState: async () => {
    if (!window.electronAPI) return;

    // Check if already initialized to prevent double restoration
    const { isInitialized, howl: existingHowl, mediaSource: existingMediaSource } = get();
    if (isInitialized) return;

    // Clean up any existing media source
    if (existingMediaSource) {
      try {
        existingMediaSource.disconnect();
      } catch (e) {
        console.error('Error disconnecting existing media source:', e);
      }
    }

    // Clean up any existing howl instance first
    if (existingHowl) {
      try {
        existingHowl.stop();
        existingHowl.unload();
      } catch (e) {
        console.error('Error cleaning up existing howl:', e);
      }
      set({ howl: null, mediaSource: null });
    }

    try {
      const savedState = await window.electronAPI.loadPlayerState();
      if (!savedState) {
        set({ isInitialized: true });
        return;
      }

      // Restore volume and settings
      set({
        volume: savedState.volume ?? 1,
        repeatMode: (savedState.repeatMode as RepeatMode) ?? 'off',
        isShuffled: savedState.isShuffled ?? false,
        isInitialized: true,
      });

      // If there was a track playing, restore the queue and track
      if (savedState.queueIds && savedState.queueIds.length > 0) {
        const allTracks = await window.electronAPI.getTracks();
        const trackMap = new Map(allTracks.map(t => [t.id, t]));

        // Restore queue
        const restoredQueue = savedState.queueIds
          .map((id: number) => trackMap.get(id))
          .filter((t: Track | undefined): t is Track => t !== undefined);

        if (restoredQueue.length > 0) {
          set({
            queue: restoredQueue,
            queueIndex: savedState.queueIndex ?? 0,
          });

          // Restore current track if it exists
          if (savedState.trackId !== null) {
            const track = trackMap.get(savedState.trackId);
            if (track) {
              // Load the track without auto-playing
              const { volume, isMuted } = get();

              let fileUrl = track.path;
              if (!fileUrl.startsWith('media://')) {
                fileUrl = 'media://' + track.path.replace(/\\/g, '/');
              }

              // Initialize equalizer audio context
              const equalizerStore = useEqualizerStore.getState();
              equalizerStore.initAudioContext();

              const howl = new Howl({
                src: [fileUrl],
                html5: true,
                volume: isMuted ? 0 : volume,
                onload: () => {
                  // Seek to saved position
                  if (savedState.currentTime > 0) {
                    howl.seek(savedState.currentTime);
                  }
                  set({
                    duration: howl.duration(),
                    currentTime: savedState.currentTime ?? 0,
                  });

                  // Connect audio to equalizer after load
                  try {
                    const sounds = (howl as any)._sounds;
                    if (sounds && sounds.length > 0) {
                      const audioElement = sounds[0]._node as HTMLAudioElement;

                      if (audioElement) {
                        const mediaSource = equalizerStore.connectMediaElement(audioElement);
                        if (mediaSource) {
                          set({ mediaSource });
                          console.log('Audio connected to equalizer (restored)');
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Error connecting audio to equalizer:', e);
                  }
                },
                onplay: () => {
                  set({ isPlaying: true });
                  const updateTime = () => {
                    if (get().isPlaying && get().howl === howl) {
                      const time = howl.seek() as number;
                      set({ currentTime: time });
                      debouncedSave(() => get().saveState(), 5000);
                      requestAnimationFrame(updateTime);
                    }
                  };
                  requestAnimationFrame(updateTime);
                },
                onpause: () => {
                  set({ isPlaying: false });
                  get().saveState();
                },
                onstop: () => {
                  set({ isPlaying: false, currentTime: 0 });
                },
                onend: () => {
                  const { repeatMode, next } = get();
                  if (repeatMode === 'one') {
                    howl.seek(0);
                    howl.play();
                  } else {
                    next();
                  }
                },
                onloaderror: (_id, error) => {
                  console.error('Error loading track:', error);
                  set({ isPlaying: false });
                },
              });

              set({ currentTrack: track, howl });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error restoring player state:', error);
      set({ isInitialized: true });
    }
  },
}));

// Listen for media keys from main process
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.onMediaKey((key: string) => {
    const store = usePlayerStore.getState();

    switch (key) {
      case 'play-pause':
        if (store.isPlaying) {
          store.pause();
        } else {
          store.play();
        }
        break;
      case 'next':
        store.next();
        break;
      case 'previous':
        store.previous();
        break;
      case 'stop':
        store.stop();
        break;
      case 'volume-up':
        store.setVolume(Math.min(1, store.volume + 0.1));
        break;
      case 'volume-down':
        store.setVolume(Math.max(0, store.volume - 0.1));
        break;
      case 'volume-mute':
        store.toggleMute();
        break;
    }
  });

  // Restore state on initialization
  usePlayerStore.getState().restoreState();
}
