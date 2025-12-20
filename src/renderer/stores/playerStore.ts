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
  loadTrack: (track: Track, autoPlay?: boolean, isCrossfadeTransition?: boolean) => void;
  preloadNextTrack: () => void;
  startCrossfade: () => void;
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

// Track listening time
let lastListeningTimeUpdate = 0;

// Throttle currentTime updates to avoid excessive re-renders
let lastTimeUpdate = 0;
const TIME_UPDATE_INTERVAL = 250; // Update UI every 250ms (4 times per second)
let accumulatedListeningTime = 0;
const LISTENING_TIME_UPDATE_INTERVAL = 10; // Update every 10 seconds

// Crossfade state
let crossfadeTimer: ReturnType<typeof setTimeout> | null = null;
let isCrossfading = false;
let fadingOutHowl: Howl | null = null;

// Gapless playback state
let preloadedHowl: Howl | null = null;
let preloadedTrack: Track | null = null;
let preloadedIndex: number = -1;

// Helper to get crossfade settings
async function getCrossfadeSettings(): Promise<{ enabled: boolean; duration: number }> {
  if (!window.electronAPI) return { enabled: false, duration: 3 };
  try {
    const settings = await window.electronAPI.getSettings();
    return {
      enabled: settings.crossfadeEnabled ?? false,
      duration: settings.crossfadeDuration ?? 3,
    };
  } catch {
    return { enabled: false, duration: 3 };
  }
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

  loadTrack: (track: Track, autoPlay = true, isCrossfadeTransition = false) => {
    const { howl: oldHowl, volume, isMuted, mediaSource: oldMediaSource } = get();

    // Clear any pending crossfade timer
    if (crossfadeTimer) {
      clearTimeout(crossfadeTimer);
      crossfadeTimer = null;
    }

    // Clear preloaded track since we're loading a new one
    if (preloadedHowl) {
      try {
        preloadedHowl.unload();
      } catch (e) {
        // Ignore cleanup errors
      }
      preloadedHowl = null;
      preloadedTrack = null;
      preloadedIndex = -1;
    }

    // If this is a crossfade transition, the old howl will be faded out separately
    if (!isCrossfadeTransition) {
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
    } else {
      // During crossfade, just clear the references but don't stop the old howl yet
      set({ howl: null, mediaSource: null });
    }

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

        // Preload next track for gapless playback
        get().preloadNextTrack();
      },
      onplay: () => {
        set({ isPlaying: true });
        // Reset listening time tracker when starting playback
        lastListeningTimeUpdate = Date.now();
        accumulatedListeningTime = 0;
        isCrossfading = false;

        // Setup crossfade timer if enabled
        const setupCrossfadeTimer = async () => {
          const { enabled, duration } = await getCrossfadeSettings();
          if (enabled && howl.duration() > duration + 1) {
            // Calculate when to start crossfade (duration seconds before end)
            const crossfadeStartTime = (howl.duration() - duration) * 1000;
            const currentTime = (howl.seek() as number) * 1000;
            const delay = crossfadeStartTime - currentTime;

            if (delay > 0) {
              if (crossfadeTimer) clearTimeout(crossfadeTimer);
              crossfadeTimer = setTimeout(() => {
                const { startCrossfade, repeatMode } = get();
                // Don't crossfade if repeat one is enabled
                if (repeatMode !== 'one' && !isCrossfading) {
                  startCrossfade();
                }
              }, delay);
            }
          }
        };
        setupCrossfadeTimer();

        // Start tracking time - only if this howl is still the current one
        // Throttled to reduce React re-renders
        const updateTime = () => {
          const currentHowl = get().howl;
          if (get().isPlaying && currentHowl === howl) {
            const now = Date.now();
            const time = howl.seek() as number;

            // Only update state if enough time has passed (throttle UI updates)
            if (now - lastTimeUpdate >= TIME_UPDATE_INTERVAL) {
              set({ currentTime: time });
              lastTimeUpdate = now;
            }

            // Track listening time (keep this accurate)
            const elapsed = (now - lastListeningTimeUpdate) / 1000; // Convert to seconds
            accumulatedListeningTime += elapsed;
            lastListeningTimeUpdate = now;

            // Save listening time every LISTENING_TIME_UPDATE_INTERVAL seconds
            if (accumulatedListeningTime >= LISTENING_TIME_UPDATE_INTERVAL) {
              if (window.electronAPI) {
                window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
              }
              accumulatedListeningTime = 0;
            }

            // Save state periodically while playing
            debouncedSave(() => get().saveState(), 5000);
            requestAnimationFrame(updateTime);
          }
        };
        lastTimeUpdate = Date.now();
        requestAnimationFrame(updateTime);

        // Update play count only if autoPlay is true
        if (autoPlay && window.electronAPI) {
          window.electronAPI.incrementPlayCount(track.id);
        }
      },
      onpause: () => {
        set({ isPlaying: false });
        // Save any accumulated listening time when pausing
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
        get().saveState();
      },
      onstop: () => {
        set({ isPlaying: false, currentTime: 0 });
        // Save any accumulated listening time when stopping
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
      },
      onend: () => {
        // Save any accumulated listening time when track ends
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }

        // If we're crossfading, the next track is already playing, so just clean up
        if (isCrossfading && fadingOutHowl === howl) {
          try {
            howl.unload();
          } catch (e) {
            // Ignore cleanup errors
          }
          fadingOutHowl = null;
          return;
        }

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
    const { queue, queueIndex, repeatMode, isShuffled, loadTrack, howl: oldHowl, volume, isMuted } = get();

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

    // Check if we have a preloaded track ready for gapless playback
    if (preloadedHowl && preloadedTrack && preloadedIndex === nextIndex) {
      console.log('Using preloaded track for gapless playback:', preloadedTrack.title);

      // Clean up old howl
      if (oldHowl) {
        try {
          oldHowl.stop();
          oldHowl.unload();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Use the preloaded howl
      const newHowl = preloadedHowl;
      const newTrack = preloadedTrack;

      // Clear preloaded state
      preloadedHowl = null;
      preloadedTrack = null;
      preloadedIndex = -1;

      // Set up the preloaded howl with proper event handlers
      const equalizerStore = useEqualizerStore.getState();

      // Connect to equalizer
      try {
        const sounds = (newHowl as any)._sounds;
        if (sounds && sounds.length > 0) {
          const audioElement = sounds[0]._node as HTMLAudioElement;
          if (audioElement) {
            const mediaSource = equalizerStore.connectMediaElement(audioElement);
            if (mediaSource) {
              set({ mediaSource });
            }
          }
        }
      } catch (e) {
        console.error('Error connecting preloaded audio to equalizer:', e);
      }

      // Update state
      set({
        currentTrack: newTrack,
        howl: newHowl,
        queueIndex: nextIndex,
        currentTime: 0,
        duration: newHowl.duration(),
      });

      // Set volume
      newHowl.volume(isMuted ? 0 : volume);

      // Play immediately
      newHowl.play();

      // Set up onplay handler for the preloaded track
      newHowl.on('play', () => {
        set({ isPlaying: true });
        lastListeningTimeUpdate = Date.now();
        accumulatedListeningTime = 0;

        // Update play count
        if (window.electronAPI) {
          window.electronAPI.incrementPlayCount(newTrack.id);
        }

        // Preload the next track
        get().preloadNextTrack();

        // Time update loop
        const updateTime = () => {
          const currentHowl = get().howl;
          if (get().isPlaying && currentHowl === newHowl) {
            const now = Date.now();
            const time = newHowl.seek() as number;

            if (now - lastTimeUpdate >= TIME_UPDATE_INTERVAL) {
              set({ currentTime: time });
              lastTimeUpdate = now;
            }

            const elapsed = (now - lastListeningTimeUpdate) / 1000;
            accumulatedListeningTime += elapsed;
            lastListeningTimeUpdate = now;

            if (accumulatedListeningTime >= LISTENING_TIME_UPDATE_INTERVAL) {
              if (window.electronAPI) {
                window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
              }
              accumulatedListeningTime = 0;
            }

            debouncedSave(() => get().saveState(), 5000);
            requestAnimationFrame(updateTime);
          }
        };
        lastTimeUpdate = Date.now();
        requestAnimationFrame(updateTime);
      });

      newHowl.on('pause', () => {
        set({ isPlaying: false });
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
        get().saveState();
      });

      newHowl.on('end', () => {
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
        const { repeatMode: rm, next: nextFn } = get();
        if (rm === 'one') {
          newHowl.seek(0);
          newHowl.play();
        } else {
          nextFn();
        }
      });

      get().saveState();
      return;
    }

    // Fallback to normal loading if no preloaded track
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
    // Clean up preloaded track
    if (preloadedHowl) {
      try {
        preloadedHowl.unload();
      } catch (e) {
        // Ignore
      }
      preloadedHowl = null;
      preloadedTrack = null;
      preloadedIndex = -1;
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

  preloadNextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffled, volume, isMuted } = get();

    if (queue.length === 0) return;

    // Calculate next index
    let nextIndex: number;
    if (isShuffled) {
      // For shuffle, we can't really preload since it's random
      // But we can preload a random track
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // No next track to preload
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;

    // Don't preload if already preloaded this track
    if (preloadedTrack?.id === nextTrack.id && preloadedHowl) return;

    // Clean up previous preloaded howl
    if (preloadedHowl) {
      try {
        preloadedHowl.unload();
      } catch (e) {
        // Ignore cleanup errors
      }
      preloadedHowl = null;
      preloadedTrack = null;
      preloadedIndex = -1;
    }

    // Preload the next track
    const nextFileUrl = 'media://' + nextTrack.path.replace(/\\/g, '/');

    preloadedHowl = new Howl({
      src: [nextFileUrl],
      html5: true,
      volume: isMuted ? 0 : volume,
      preload: true,
      onload: () => {
        console.log('Preloaded next track:', nextTrack.title);
        preloadedTrack = nextTrack;
        preloadedIndex = nextIndex;
      },
      onloaderror: (_id, error) => {
        console.error('Error preloading track:', error);
        preloadedHowl = null;
        preloadedTrack = null;
        preloadedIndex = -1;
      },
    });
  },

  startCrossfade: async () => {
    const { queue, queueIndex, repeatMode, isShuffled, howl, volume, isMuted, loadTrack } = get();

    if (queue.length === 0 || !howl || isCrossfading) return;

    // Calculate next index
    let nextIndex: number;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // No more tracks to play
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;

    // Get crossfade duration
    const { duration } = await getCrossfadeSettings();

    // Mark as crossfading
    isCrossfading = true;
    fadingOutHowl = howl;

    // Start fading out the current track
    const fadeSteps = 20;
    const stepDuration = (duration * 1000) / fadeSteps;
    const currentVolume = isMuted ? 0 : volume;
    let step = 0;

    const fadeOutInterval = setInterval(() => {
      step++;
      const newVolume = currentVolume * (1 - step / fadeSteps);
      if (fadingOutHowl) {
        fadingOutHowl.volume(Math.max(0, newVolume));
      }
      if (step >= fadeSteps) {
        clearInterval(fadeOutInterval);
        // Clean up the old howl
        if (fadingOutHowl) {
          try {
            fadingOutHowl.stop();
            fadingOutHowl.unload();
          } catch (e) {
            // Ignore cleanup errors
          }
          fadingOutHowl = null;
        }
        isCrossfading = false;
      }
    }, stepDuration);

    // Update queue index and load next track with crossfade flag
    set({ queueIndex: nextIndex });

    // Load and start the next track with fade in
    const nextFileUrl = 'media://' + nextTrack.path.replace(/\\/g, '/');
    const equalizerStore = useEqualizerStore.getState();
    equalizerStore.initAudioContext();

    const newHowl = new Howl({
      src: [nextFileUrl],
      html5: true,
      volume: 0, // Start silent for fade in
      onload: () => {
        set({ duration: newHowl.duration() });

        // Connect to equalizer
        try {
          const sounds = (newHowl as any)._sounds;
          if (sounds && sounds.length > 0) {
            const audioElement = sounds[0]._node as HTMLAudioElement;
            if (audioElement) {
              const mediaSource = equalizerStore.connectMediaElement(audioElement);
              if (mediaSource) {
                set({ mediaSource });
              }
            }
          }
        } catch (e) {
          console.error('Error connecting audio to equalizer:', e);
        }
      },
      onplay: () => {
        set({ isPlaying: true });
        lastListeningTimeUpdate = Date.now();
        accumulatedListeningTime = 0;

        // Fade in the new track
        let fadeInStep = 0;
        const targetVolume = isMuted ? 0 : volume;
        const fadeInInterval = setInterval(() => {
          fadeInStep++;
          const newVolume = targetVolume * (fadeInStep / fadeSteps);
          newHowl.volume(Math.min(targetVolume, newVolume));
          if (fadeInStep >= fadeSteps) {
            clearInterval(fadeInInterval);
            newHowl.volume(targetVolume);
          }
        }, stepDuration);

        // Setup crossfade timer for this new track
        const setupCrossfadeTimer = async () => {
          const { enabled, duration: cfDuration } = await getCrossfadeSettings();
          if (enabled && newHowl.duration() > cfDuration + 1) {
            const crossfadeStartTime = (newHowl.duration() - cfDuration) * 1000;
            if (crossfadeTimer) clearTimeout(crossfadeTimer);
            crossfadeTimer = setTimeout(() => {
              const { startCrossfade, repeatMode: rm } = get();
              if (rm !== 'one' && !isCrossfading) {
                startCrossfade();
              }
            }, crossfadeStartTime);
          }
        };
        setupCrossfadeTimer();

        // Time update loop
        const updateTime = () => {
          const currentHowl = get().howl;
          if (get().isPlaying && currentHowl === newHowl) {
            const now = Date.now();
            const time = newHowl.seek() as number;

            if (now - lastTimeUpdate >= TIME_UPDATE_INTERVAL) {
              set({ currentTime: time });
              lastTimeUpdate = now;
            }

            const elapsed = (now - lastListeningTimeUpdate) / 1000;
            accumulatedListeningTime += elapsed;
            lastListeningTimeUpdate = now;

            if (accumulatedListeningTime >= LISTENING_TIME_UPDATE_INTERVAL) {
              if (window.electronAPI) {
                window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
              }
              accumulatedListeningTime = 0;
            }

            debouncedSave(() => get().saveState(), 5000);
            requestAnimationFrame(updateTime);
          }
        };
        lastTimeUpdate = Date.now();
        requestAnimationFrame(updateTime);

        // Update play count
        if (window.electronAPI) {
          window.electronAPI.incrementPlayCount(nextTrack.id);
        }
      },
      onpause: () => {
        set({ isPlaying: false });
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
        get().saveState();
      },
      onstop: () => {
        set({ isPlaying: false, currentTime: 0 });
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }
      },
      onend: () => {
        if (accumulatedListeningTime > 0 && window.electronAPI) {
          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
          accumulatedListeningTime = 0;
        }

        if (isCrossfading && fadingOutHowl === newHowl) {
          try {
            newHowl.unload();
          } catch (e) {
            // Ignore
          }
          fadingOutHowl = null;
          return;
        }

        const { repeatMode: rm, next } = get();
        if (rm === 'one') {
          newHowl.seek(0);
          newHowl.play();
        } else {
          next();
        }
      },
      onloaderror: (_id, error) => {
        console.error('Error loading track:', error);
        set({ isPlaying: false });
        isCrossfading = false;
      },
    });

    set({ currentTrack: nextTrack, howl: newHowl, currentTime: 0 });

    // Start playing the new track
    setTimeout(() => {
      newHowl.play();
    }, 100);

    get().saveState();
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
                  // Reset listening time tracker when starting playback
                  lastListeningTimeUpdate = Date.now();
                  accumulatedListeningTime = 0;

                  // Throttled update loop to reduce React re-renders
                  const updateTime = () => {
                    if (get().isPlaying && get().howl === howl) {
                      const now = Date.now();
                      const time = howl.seek() as number;

                      // Only update state if enough time has passed
                      if (now - lastTimeUpdate >= TIME_UPDATE_INTERVAL) {
                        set({ currentTime: time });
                        lastTimeUpdate = now;
                      }

                      // Track listening time (keep this accurate)
                      const elapsed = (now - lastListeningTimeUpdate) / 1000;
                      accumulatedListeningTime += elapsed;
                      lastListeningTimeUpdate = now;

                      // Save listening time every LISTENING_TIME_UPDATE_INTERVAL seconds
                      if (accumulatedListeningTime >= LISTENING_TIME_UPDATE_INTERVAL) {
                        if (window.electronAPI) {
                          window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
                        }
                        accumulatedListeningTime = 0;
                      }

                      debouncedSave(() => get().saveState(), 5000);
                      requestAnimationFrame(updateTime);
                    }
                  };
                  lastTimeUpdate = Date.now();
                  requestAnimationFrame(updateTime);
                },
                onpause: () => {
                  set({ isPlaying: false });
                  // Save any accumulated listening time when pausing
                  if (accumulatedListeningTime > 0 && window.electronAPI) {
                    window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
                    accumulatedListeningTime = 0;
                  }
                  get().saveState();
                },
                onstop: () => {
                  set({ isPlaying: false, currentTime: 0 });
                  // Save any accumulated listening time when stopping
                  if (accumulatedListeningTime > 0 && window.electronAPI) {
                    window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
                    accumulatedListeningTime = 0;
                  }
                },
                onend: () => {
                  // Save any accumulated listening time when track ends
                  if (accumulatedListeningTime > 0 && window.electronAPI) {
                    window.electronAPI.addListeningTime(Math.floor(accumulatedListeningTime));
                    accumulatedListeningTime = 0;
                  }
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
