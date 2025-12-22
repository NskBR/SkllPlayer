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

export interface Playlist {
  id: number;
  name: string;
  createdAt: string;
  trackCount: number;
  coverImage: string | null; // Custom cover image (base64 or URL)
  firstTrackThumbnail: string | null; // First track's thumbnail as fallback
}

export interface Stats {
  totalTracks: number;
  totalListeningTime: number;
  playedTracks: number;
  neverPlayedTracks: number;
}

export interface ThemeInfo {
  name: string;
  author: string;
  type: 'dark' | 'light';
  category: 'official' | 'community';
  windowEffect?: WindowEffect;
  isCustom: boolean;
  readonly?: boolean;
}

export interface ThemeGradient {
  enabled: boolean;
  type: 'linear' | 'radial';
  angle: number;
  colors: string[];
  stops: number[];
}

export type WindowEffect = 'none' | 'mica' | 'acrylic' | 'tabbed';

export interface Theme {
  name: string;
  author: string;
  version: string;
  type: 'dark' | 'light';
  windowEffect?: WindowEffect;
  colors: {
    background: { primary: string; secondary: string; tertiary: string; gradient?: ThemeGradient };
    text: { primary: string; secondary: string; muted: string };
    accent: { primary: string; hover: string; active: string };
    player: { progress: string; progressBackground: string; controls: string };
    sidebar: { background: string; itemHover: string; itemActive: string; gradient?: ThemeGradient };
  };
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      small: string;
      normal: string;
      medium: string;
      large: string;
      title: string;
    };
  };
  layout: {
    sidebar: { position: 'left' | 'right' | 'top'; width: string; collapsedWidth: string };
    player: { position: 'bottom' | 'top'; height: string };
    header: { visible: boolean; height: string };
  };
  components: {
    borderRadius: string;
    trackItem: { height: string; thumbnailSize: string; showDuration: boolean; showArtist: boolean };
    buttons: { borderRadius: string; style: 'filled' | 'outlined' | 'ghost' };
    scrollbar: { width: string; thumbColor: string; trackColor: string };
  };
  effects: {
    blur: boolean;
    animations: boolean;
    transitionSpeed: string;
    hoverScale: number;
  };
}

export interface LayoutOverrides {
  sidebar?: {
    position?: 'left' | 'right' | 'top';
    width?: string;
    collapsedWidth?: string;
    visible?: boolean;
    collapsed?: boolean;
    autoCollapse?: boolean;
    autoExpand?: boolean;
  };
  player?: {
    position?: 'bottom' | 'top';
    height?: string;
  };
  header?: {
    visible?: boolean;
    height?: string;
  };
  library?: {
    view?: 'grid' | 'list' | 'columns';
  };
}

export interface GradientConfig {
  enabled?: boolean;
  type?: 'linear' | 'radial';
  angle?: number; // for linear gradients (0-360)
  colors?: string[]; // array of colors
  stops?: number[]; // array of stop positions (0-100)
}

export interface ColorOverrides {
  background?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    gradient?: GradientConfig;
  };
  text?: {
    primary?: string;
    secondary?: string;
    muted?: string;
  };
  accent?: {
    primary?: string;
    hover?: string;
    active?: string;
  };
  player?: {
    progress?: string;
    progressBackground?: string;
    controls?: string;
  };
  sidebar?: {
    background?: string;
    itemHover?: string;
    itemActive?: string;
    gradient?: GradientConfig;
  };
}

export interface FontOverrides {
  primary?: string;
  secondary?: string;
}

// Per-theme font settings
export interface ThemeFontSettings {
  [themeName: string]: FontOverrides;
}

// Per-theme color settings
export interface ThemeColorSettings {
  [themeName: string]: ColorOverrides;
}

export interface Settings {
  musicFolder: string;
  theme: string;
  volume: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  normalizationEnabled: boolean;
  layoutOverrides?: LayoutOverrides;
  themeFontSettings?: ThemeFontSettings;
  themeColorSettings?: ThemeColorSettings;
  equalizer: {
    '60': number;
    '230': number;
    '910': number;
    '3600': number;
    '14000': number;
    bassBoost: number;
    virtualizer: number;
    reverb: number;
    balance: number;
    amplifier: number;
  };
}

export interface YouTubeResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

export interface DownloadProgress {
  percent: number;
  speed: string;
  eta: string;
}

export interface FolderAnalysis {
  totalFiles: number;
  audioFiles: number;
  totalSize: number;
  totalSizeGB: string;
}

export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  setWindowEffect: (effect: WindowEffect) => void;

  // Media keys
  onMediaKey: (callback: (key: string) => void) => void;

  // Window state
  onWindowStateChanged: (callback: (state: { isMaximized: boolean; isFullScreen: boolean }) => void) => void;

  // File system
  selectMusicFolder: () => Promise<string | null>;
  analyzeFolder: (folderPath: string) => Promise<FolderAnalysis>;
  scanMusicFolder: (folderPath: string) => Promise<string[]>;
  getMusicMetadata: (filePath: string) => Promise<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    thumbnail: string | null;
  }>;

  // Database - Tracks
  getTracks: () => Promise<Track[]>;
  getTrack: (id: number) => Promise<Track | null>;
  updateTrack: (id: number, data: Partial<Track>) => Promise<void>;
  incrementPlayCount: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<boolean>;
  getFavorites: () => Promise<Track[]>;
  renameTrack: (id: number, newTitle: string) => Promise<void>;

  // Player State
  savePlayerState: (state: {
    trackId: number | null;
    currentTime: number;
    volume: number;
    repeatMode: string;
    isShuffled: boolean;
    queueIds: number[];
    queueIndex: number;
  }) => Promise<void>;
  loadPlayerState: () => Promise<{
    trackId: number | null;
    currentTime: number;
    volume: number;
    repeatMode: string;
    isShuffled: boolean;
    queueIds: number[];
    queueIndex: number;
  } | null>;

  // Database - Playlists
  getPlaylists: () => Promise<Playlist[]>;
  createPlaylist: (name: string) => Promise<number>;
  deletePlaylist: (id: number) => Promise<void>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  addToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  removeFromPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  setPlaylistCover: (playlistId: number, coverImage: string | null) => Promise<void>;
  selectPlaylistCover: (playlistId: number) => Promise<string | null>;

  // Statistics
  getStats: () => Promise<Stats>;
  getTopTracks: (limit: number) => Promise<Track[]>;
  getNeverPlayedTracks: () => Promise<Track[]>;
  getTotalListeningTime: () => Promise<number>;
  addListeningTime: (seconds: number) => Promise<void>;
  resetStats: () => Promise<void>;

  // Theme
  getThemes: () => Promise<ThemeInfo[]>;
  loadTheme: (themeName: string) => Promise<Theme>;
  saveCustomTheme: (theme: Theme) => Promise<void>;
  updateTheme: (themeName: string, updates: Partial<Theme>) => Promise<Theme>;
  openThemesFolder: () => Promise<void>;

  // Settings
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;

  // Downloader
  searchYouTube: (query: string) => Promise<YouTubeResult[]>;
  downloadTrack: (url: string, format: string, metadata?: { title: string; artist: string; thumbnail: string }) => Promise<string>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  cancelDownload: (id: string) => Promise<void>;
  getYtDlpStatus: () => Promise<YtDlpStatus>;
  installYtDlp: () => Promise<boolean>;

  // uBlock Origin
  getUBlockStatus: () => Promise<UBlockStatus>;
  installUBlock: () => Promise<boolean>;

  // Close behavior
  getCloseBehavior: () => Promise<'ask' | 'tray' | 'close'>;
  setCloseBehavior: (behavior: 'ask' | 'tray' | 'close') => void;

  // Discord Rich Presence
  updateDiscordPresence: (track: {
    title: string;
    artist: string;
    thumbnail: string | null;
    duration: number;
    currentTime: number;
    isPlaying: boolean;
  } | null) => void;
  clearDiscordPresence: () => void;

  // YouTube Preview
  openYouTubePreview: (videoId: string, title: string) => void;

  // Window effect re-apply listener
  onReapplyWindowEffect: (callback: () => void) => void;
}

export interface YtDlpStatus {
  installed: boolean;
  version: string | null;
  path: string;
  ffmpegInstalled: boolean;
  ffmpegPath: string;
}

export interface UBlockStatus {
  installed: boolean;
  path: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
