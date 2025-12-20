import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Media keys listener
  onMediaKey: (callback: (key: string) => void) => {
    ipcRenderer.on('media-key', (_event, key) => callback(key));
  },

  // File system
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  scanMusicFolder: (folderPath: string) => ipcRenderer.invoke('scan-music-folder', folderPath),
  getMusicMetadata: (filePath: string) => ipcRenderer.invoke('get-music-metadata', filePath),

  // Database
  getTracks: () => ipcRenderer.invoke('db-get-tracks'),
  getTrack: (id: number) => ipcRenderer.invoke('db-get-track', id),
  updateTrack: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('db-update-track', id, data),
  incrementPlayCount: (id: number) => ipcRenderer.invoke('db-increment-play-count', id),
  toggleFavorite: (id: number) => ipcRenderer.invoke('db-toggle-favorite', id),
  getFavorites: () => ipcRenderer.invoke('db-get-favorites'),
  renameTrack: (id: number, newTitle: string) => ipcRenderer.invoke('db-rename-track', id, newTitle),

  // Playlists
  getPlaylists: () => ipcRenderer.invoke('db-get-playlists'),
  createPlaylist: (name: string) => ipcRenderer.invoke('db-create-playlist', name),
  deletePlaylist: (id: number) => ipcRenderer.invoke('db-delete-playlist', id),
  renamePlaylist: (id: number, name: string) => ipcRenderer.invoke('db-rename-playlist', id, name),
  addToPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('db-add-to-playlist', playlistId, trackId),
  removeFromPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('db-remove-from-playlist', playlistId, trackId),
  getPlaylistTracks: (playlistId: number) => ipcRenderer.invoke('db-get-playlist-tracks', playlistId),

  // Statistics
  getStats: () => ipcRenderer.invoke('db-get-stats'),
  getTopTracks: (limit: number) => ipcRenderer.invoke('db-get-top-tracks', limit),
  getNeverPlayedTracks: () => ipcRenderer.invoke('db-get-never-played'),
  getTotalListeningTime: () => ipcRenderer.invoke('db-get-listening-time'),
  addListeningTime: (seconds: number) => ipcRenderer.invoke('db-add-listening-time', seconds),
  resetStats: () => ipcRenderer.invoke('db-reset-stats'),

  // Theme
  getThemes: () => ipcRenderer.invoke('get-themes'),
  loadTheme: (themeName: string) => ipcRenderer.invoke('load-theme', themeName),
  saveCustomTheme: (theme: Record<string, unknown>) => ipcRenderer.invoke('save-custom-theme', theme),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('save-settings', settings),

  // Player state persistence
  savePlayerState: (state: {
    trackId: number | null;
    currentTime: number;
    volume: number;
    repeatMode: string;
    isShuffled: boolean;
    queueIds: number[];
    queueIndex: number;
  }) => ipcRenderer.invoke('save-player-state', state),
  loadPlayerState: () => ipcRenderer.invoke('load-player-state'),

  // Downloader
  searchYouTube: (query: string) => ipcRenderer.invoke('youtube-search', query),
  downloadTrack: (url: string, format: string, metadata?: { title: string; artist: string; thumbnail: string }) =>
    ipcRenderer.invoke('download-track', url, format, metadata),
  onDownloadProgress: (callback: (progress: { percent: number; speed: string; eta: string }) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
  },
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),
  getYtDlpStatus: () => ipcRenderer.invoke('get-ytdlp-status'),
  installYtDlp: () => ipcRenderer.invoke('install-ytdlp'),

  // Download history
  getDownloadHistory: () => ipcRenderer.invoke('get-download-history'),
  addToDownloadHistory: (item: {
    id: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string | null;
    format: string;
    downloadedAt: string;
    filePath: string;
  }) => ipcRenderer.invoke('add-to-download-history', item),
  clearDownloadHistory: () => ipcRenderer.invoke('clear-download-history'),
});

// Type definitions for the exposed API
export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  onMediaKey: (callback: (key: string) => void) => void;
  selectMusicFolder: () => Promise<string | null>;
  scanMusicFolder: (folderPath: string) => Promise<void>;
  getMusicMetadata: (filePath: string) => Promise<TrackMetadata>;
  getTracks: () => Promise<Track[]>;
  getTrack: (id: number) => Promise<Track>;
  updateTrack: (id: number, data: Partial<Track>) => Promise<void>;
  incrementPlayCount: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<boolean>;
  getFavorites: () => Promise<Track[]>;
  renameTrack: (id: number, newTitle: string) => Promise<boolean>;
  getPlaylists: () => Promise<Playlist[]>;
  createPlaylist: (name: string) => Promise<number>;
  deletePlaylist: (id: number) => Promise<void>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  addToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  removeFromPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  getStats: () => Promise<Stats>;
  getTopTracks: (limit: number) => Promise<Track[]>;
  getNeverPlayedTracks: () => Promise<Track[]>;
  getTotalListeningTime: () => Promise<number>;
  addListeningTime: (seconds: number) => Promise<void>;
  resetStats: () => Promise<void>;
  getThemes: () => Promise<ThemeInfo[]>;
  loadTheme: (themeName: string) => Promise<Theme>;
  saveCustomTheme: (theme: Theme) => Promise<void>;
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  savePlayerState: (state: PlayerState) => Promise<void>;
  loadPlayerState: () => Promise<PlayerState | null>;
  searchYouTube: (query: string) => Promise<YouTubeResult[]>;
  downloadTrack: (url: string, format: string, metadata?: { title: string; artist: string; thumbnail: string }) => Promise<string>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  cancelDownload: (id: string) => Promise<void>;
  getYtDlpStatus: () => Promise<YtDlpStatus>;
  installYtDlp: () => Promise<boolean>;
  getDownloadHistory: () => Promise<DownloadHistoryItem[]>;
  addToDownloadHistory: (item: DownloadHistoryItem) => Promise<DownloadHistoryItem[]>;
  clearDownloadHistory: () => Promise<DownloadHistoryItem[]>;
}

interface YtDlpStatus {
  installed: boolean;
  version: string | null;
  path: string;
  ffmpegInstalled: boolean;
  ffmpegPath: string;
}

interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  thumbnail: string | null;
}

interface Track {
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

interface Playlist {
  id: number;
  name: string;
  createdAt: string;
  trackCount: number;
}

interface Stats {
  totalTracks: number;
  totalListeningTime: number;
  playedTracks: number;
  neverPlayedTracks: number;
}

interface ThemeInfo {
  name: string;
  author: string;
  type: 'dark' | 'light';
  isCustom: boolean;
}

interface Theme {
  name: string;
  author: string;
  version: string;
  type: 'dark' | 'light';
  colors: Record<string, Record<string, string>>;
  fonts: Record<string, unknown>;
  layout: Record<string, unknown>;
  components: Record<string, unknown>;
  effects: Record<string, unknown>;
}

interface Settings {
  musicFolder: string;
  theme: string;
  volume: number;
  equalizer: Record<string, number>;
}

interface YouTubeResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

interface DownloadProgress {
  percent: number;
  speed: string;
  eta: string;
}

interface PlayerState {
  trackId: number | null;
  currentTime: number;
  volume: number;
  repeatMode: string;
  isShuffled: boolean;
  queueIds: number[];
  queueIndex: number;
}

interface DownloadHistoryItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string | null;
  format: string;
  downloadedAt: string;
  filePath: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
