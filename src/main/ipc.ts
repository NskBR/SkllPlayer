import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import * as mm from 'music-metadata';
import {
  isYtDlpInstalled,
  installYtDlp,
  searchYouTube,
  downloadTrack,
  cancelDownload,
  getYtDlpStatus
} from './downloader';

const store = new Store();

// Types
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
  trackIds: number[];
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

// Default settings
const defaultSettings = {
  musicFolder: '',
  theme: 'Default Dark',
  volume: 1,
  crossfadeEnabled: false,
  crossfadeDuration: 3, // seconds
  normalizationEnabled: false,
  equalizer: {
    '60': 0,
    '230': 0,
    '910': 0,
    '3600': 0,
    '14000': 0,
    'bassBoost': 0,
    'virtualizer': 0,
    'reverb': 0,
    'balance': 0,
    'amplifier': 0,
  },
};

// Helper to get tracks from store
function getTracks(): Track[] {
  return store.get('tracks', []) as Track[];
}

// Helper to save tracks to store
function saveTracks(tracks: Track[]): void {
  store.set('tracks', tracks);
}

// Helper to get playlists from store
function getPlaylists(): Playlist[] {
  return store.get('playlists', []) as Playlist[];
}

// Helper to save playlists to store
function savePlaylists(playlists: Playlist[]): void {
  store.set('playlists', playlists);
}

export function setupIpcHandlers(mainWindow: BrowserWindow | null = null): void {
  // File system handlers
  ipcMain.handle('select-music-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Selecionar pasta de músicas',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('scan-music-folder', async (_event, folderPath: string) => {
    const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.opus'];
    const files: string[] = [];

    function scanDir(dir: string): void {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scanDir(fullPath);
            } else if (audioExtensions.includes(path.extname(item).toLowerCase())) {
              files.push(fullPath);
            }
          } catch (e) {
            // Skip files we can't access
          }
        }
      } catch (e) {
        // Skip directories we can't access
      }
    }

    scanDir(folderPath);

    // Get existing tracks to preserve play counts
    const existingTracks = getTracks();
    const existingPaths = new Map(existingTracks.map(t => [t.path, t]));

    // Process each file and extract metadata
    const tracks: Track[] = [];
    let nextId = Math.max(0, ...existingTracks.map(t => t.id)) + 1;

    for (const filePath of files) {
      try {
        // Check if track already exists
        const existing = existingPaths.get(filePath);
        if (existing) {
          tracks.push(existing);
          continue;
        }

        // Get file stats
        const stat = fs.statSync(filePath);

        // Extract metadata
        const metadata = await mm.parseFile(filePath);
        const common = metadata.common;
        const format = metadata.format;

        // Extract thumbnail if available
        let thumbnail: string | null = null;
        if (common.picture && common.picture.length > 0) {
          const pic = common.picture[0];
          thumbnail = `data:${pic.format};base64,${pic.data.toString('base64')}`;
        }

        const track: Track = {
          id: nextId++,
          path: filePath,
          title: common.title || path.basename(filePath, path.extname(filePath)),
          artist: common.artist || 'Artista desconhecido',
          album: common.album || '',
          duration: format.duration || 0,
          thumbnail,
          playCount: 0,
          addedAt: new Date().toISOString(),
          lastPlayed: null,
          size: stat.size,
          isFavorite: false,
        };

        tracks.push(track);
      } catch (e) {
        // If metadata extraction fails, create basic track
        try {
          const stat = fs.statSync(filePath);
          const track: Track = {
            id: nextId++,
            path: filePath,
            title: path.basename(filePath, path.extname(filePath)),
            artist: 'Artista desconhecido',
            album: '',
            duration: 0,
            thumbnail: null,
            playCount: 0,
            addedAt: new Date().toISOString(),
            lastPlayed: null,
            size: stat.size,
            isFavorite: false,
          };
          tracks.push(track);
        } catch (err) {
          // Skip this file
        }
      }
    }

    // Save tracks
    saveTracks(tracks);

    return tracks;
  });

  // Track handlers
  ipcMain.handle('db-get-tracks', () => {
    return getTracks();
  });

  ipcMain.handle('db-get-track', (_event, id: number) => {
    const tracks = getTracks();
    return tracks.find(t => t.id === id) || null;
  });

  ipcMain.handle('db-update-track', (_event, id: number, data: Partial<Track>) => {
    const tracks = getTracks();
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      tracks[index] = { ...tracks[index], ...data };
      saveTracks(tracks);
    }
  });

  ipcMain.handle('db-increment-play-count', (_event, id: number) => {
    const tracks = getTracks();
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      tracks[index].playCount++;
      tracks[index].lastPlayed = new Date().toISOString();
      saveTracks(tracks);
    }
  });

  ipcMain.handle('db-toggle-favorite', (_event, id: number) => {
    const tracks = getTracks();
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      tracks[index].isFavorite = !tracks[index].isFavorite;
      saveTracks(tracks);
      return tracks[index].isFavorite;
    }
    return false;
  });

  ipcMain.handle('db-get-favorites', () => {
    const tracks = getTracks();
    return tracks.filter(t => t.isFavorite);
  });

  ipcMain.handle('db-rename-track', (_event, id: number, newTitle: string) => {
    const tracks = getTracks();
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      tracks[index].title = newTitle;
      saveTracks(tracks);
      return true;
    }
    return false;
  });

  // Playlist handlers
  ipcMain.handle('db-get-playlists', () => {
    const playlists = getPlaylists();
    return playlists.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      trackCount: p.trackIds.length,
    }));
  });

  ipcMain.handle('db-create-playlist', (_event, name: string) => {
    const playlists = getPlaylists();
    const newId = Math.max(0, ...playlists.map(p => p.id)) + 1;
    const newPlaylist: Playlist = {
      id: newId,
      name,
      createdAt: new Date().toISOString(),
      trackIds: [],
    };
    playlists.push(newPlaylist);
    savePlaylists(playlists);
    return newId;
  });

  ipcMain.handle('db-delete-playlist', (_event, id: number) => {
    const playlists = getPlaylists();
    const filtered = playlists.filter(p => p.id !== id);
    savePlaylists(filtered);
  });

  ipcMain.handle('db-rename-playlist', (_event, id: number, name: string) => {
    const playlists = getPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    if (index !== -1) {
      playlists[index].name = name;
      savePlaylists(playlists);
    }
  });

  ipcMain.handle('db-add-to-playlist', (_event, playlistId: number, trackId: number) => {
    const playlists = getPlaylists();
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index !== -1 && !playlists[index].trackIds.includes(trackId)) {
      playlists[index].trackIds.push(trackId);
      savePlaylists(playlists);
    }
  });

  ipcMain.handle('db-remove-from-playlist', (_event, playlistId: number, trackId: number) => {
    const playlists = getPlaylists();
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index !== -1) {
      playlists[index].trackIds = playlists[index].trackIds.filter(id => id !== trackId);
      savePlaylists(playlists);
    }
  });

  ipcMain.handle('db-get-playlist-tracks', (_event, playlistId: number) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return [];

    const tracks = getTracks();
    return playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);
  });

  // Statistics handlers
  ipcMain.handle('db-get-stats', () => {
    const tracks = getTracks();
    const stats = store.get('stats', { totalListeningTime: 0 }) as { totalListeningTime: number };

    return {
      totalTracks: tracks.length,
      totalListeningTime: stats.totalListeningTime,
      playedTracks: tracks.filter(t => t.playCount > 0).length,
      neverPlayedTracks: tracks.filter(t => t.playCount === 0).length,
    };
  });

  ipcMain.handle('db-get-top-tracks', (_event, limit: number) => {
    const tracks = getTracks();
    return tracks
      .filter(t => t.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  });

  ipcMain.handle('db-get-never-played', () => {
    const tracks = getTracks();
    return tracks.filter(t => t.playCount === 0);
  });

  ipcMain.handle('db-add-listening-time', (_event, seconds: number) => {
    const stats = store.get('stats', { totalListeningTime: 0 }) as { totalListeningTime: number };
    stats.totalListeningTime += seconds;
    store.set('stats', stats);
  });

  ipcMain.handle('db-get-listening-time', () => {
    const stats = store.get('stats', { totalListeningTime: 0 }) as { totalListeningTime: number };
    return stats.totalListeningTime;
  });

  ipcMain.handle('db-reset-stats', () => {
    store.set('stats', { totalListeningTime: 0 });
    // Reset play counts
    const tracks = getTracks();
    tracks.forEach(t => {
      t.playCount = 0;
      t.lastPlayed = null;
    });
    saveTracks(tracks);
  });

  // Theme handlers
  ipcMain.handle('get-themes', async () => {
    const themesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'themes')
      : path.join(__dirname, '../../themes');

    const themes: Array<{ name: string; author: string; type: string; isCustom: boolean }> = [];

    if (fs.existsSync(themesPath)) {
      const files = fs.readdirSync(themesPath);
      for (const file of files) {
        if (file.endsWith('.theme.json')) {
          try {
            const themePath = path.join(themesPath, file);
            const themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
            themes.push({
              name: themeData.name,
              author: themeData.author,
              type: themeData.type,
              isCustom: file.startsWith('custom-'),
            });
          } catch (e) {
            // Skip invalid theme files
          }
        }
      }
    }

    return themes;
  });

  ipcMain.handle('load-theme', async (_event, themeName: string) => {
    const themesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'themes')
      : path.join(__dirname, '../../themes');

    try {
      const files = fs.readdirSync(themesPath);
      for (const file of files) {
        if (file.endsWith('.theme.json')) {
          const themePath = path.join(themesPath, file);
          const themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
          if (themeData.name === themeName) {
            return themeData;
          }
        }
      }
    } catch (e) {
      // Fall through to default
    }

    // Return default theme if not found
    const defaultThemePath = path.join(themesPath, 'default-dark.theme.json');
    try {
      return JSON.parse(fs.readFileSync(defaultThemePath, 'utf-8'));
    } catch (e) {
      // Return inline default if file not found
      return {
        name: 'Default Dark',
        type: 'dark',
        colors: {
          background: { primary: '#0a0a0f', secondary: '#12121a', tertiary: '#1a1a25' },
          text: { primary: '#ffffff', secondary: '#a0a0b0', muted: '#606070' },
          accent: { primary: '#8b5cf6', hover: '#7c3aed', active: '#6d28d9' },
          player: { progress: '#8b5cf6', progressBackground: '#2a2a35', controls: '#ffffff' },
          sidebar: { background: '#08080c', itemHover: '#15151f', itemActive: '#8b5cf6' },
        },
        fonts: {
          primary: 'Inter, system-ui, sans-serif',
          secondary: 'monospace',
          sizes: { small: '12px', normal: '14px', medium: '16px', large: '20px', title: '28px' },
        },
        layout: {
          sidebar: { position: 'left', width: '240px', collapsedWidth: '70px' },
          player: { position: 'bottom', height: '90px' },
          header: { visible: true, height: '40px' },
        },
        components: { borderRadius: '8px' },
        effects: { blur: true, animations: true, transitionSpeed: '200ms', hoverScale: 1.02 },
      };
    }
  });

  ipcMain.handle('save-custom-theme', async (_event, theme: Record<string, unknown>) => {
    const themesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'themes')
      : path.join(__dirname, '../../themes');

    const fileName = `custom-${(theme.name as string).toLowerCase().replace(/\s+/g, '-')}.theme.json`;
    const themePath = path.join(themesPath, fileName);

    fs.writeFileSync(themePath, JSON.stringify(theme, null, 2));
  });

  // Settings handlers
  ipcMain.handle('get-settings', () => {
    return store.get('settings', defaultSettings);
  });

  ipcMain.handle('save-settings', (_event, settings: Record<string, unknown>) => {
    store.set('settings', settings);
  });

  // Player state persistence
  ipcMain.handle('save-player-state', (_event, state: {
    trackId: number | null;
    currentTime: number;
    volume: number;
    repeatMode: string;
    isShuffled: boolean;
    queueIds: number[];
    queueIndex: number;
  }) => {
    store.set('playerState', state);
  });

  ipcMain.handle('load-player-state', () => {
    return store.get('playerState', null);
  });

  // YouTube/Downloader handlers
  ipcMain.handle('youtube-search', async (_event, query: string) => {
    try {
      // Check if yt-dlp is installed, install if not
      if (!isYtDlpInstalled()) {
        console.log('yt-dlp not found, installing...');
        await installYtDlp();
      }

      return await searchYouTube(query);
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  });

  ipcMain.handle('download-track', async (_event, videoId: string, format: string, youtubeMetadata?: { title: string; artist: string; thumbnail: string }) => {
    try {
      // Check if yt-dlp is installed
      if (!isYtDlpInstalled()) {
        console.log('yt-dlp not found, installing...');
        await installYtDlp();
      }

      // Get download folder from settings or use default
      const settings = store.get('settings', defaultSettings) as typeof defaultSettings;
      let outputDir = settings.musicFolder;

      if (!outputDir) {
        outputDir = path.join(app.getPath('music'), 'SkllPlayer Downloads');
      }

      const downloadId = `${videoId}-${Date.now()}`;

      const outputFile = await downloadTrack(videoId, {
        format,
        outputDir,
        downloadId,
      }, mainWindow);

      // Add to library if downloaded successfully
      if (outputFile && fs.existsSync(outputFile)) {
        // Extract metadata and add to tracks
        try {
          const stat = fs.statSync(outputFile);

          // Try to extract metadata from the file
          let fileTitle: string | undefined;
          let fileArtist: string | undefined;
          let fileAlbum: string | undefined;
          let fileDuration: number | undefined;
          let fileThumbnail: string | null = null;

          try {
            const metadata = await mm.parseFile(outputFile);
            const common = metadata.common;
            const formatInfo = metadata.format;

            fileTitle = common.title;
            fileArtist = common.artist;
            fileAlbum = common.album;
            fileDuration = formatInfo.duration;

            // Extract thumbnail if available in file
            if (common.picture && common.picture.length > 0) {
              const pic = common.picture[0];
              fileThumbnail = `data:${pic.format};base64,${pic.data.toString('base64')}`;
            }
          } catch (metadataError) {
            console.log('Could not extract metadata from file, using YouTube metadata as fallback');
          }

          // Use YouTube metadata as fallback if file metadata is missing
          const finalTitle = fileTitle || youtubeMetadata?.title || path.basename(outputFile, path.extname(outputFile));
          const finalArtist = fileArtist || youtubeMetadata?.artist || 'Artista desconhecido';
          const finalThumbnail = fileThumbnail || (youtubeMetadata?.thumbnail ? youtubeMetadata.thumbnail : null);

          const tracks = getTracks();
          const nextId = Math.max(0, ...tracks.map(t => t.id)) + 1;

          const newTrack: Track = {
            id: nextId,
            path: outputFile,
            title: finalTitle,
            artist: finalArtist,
            album: fileAlbum || '',
            duration: fileDuration || 0,
            thumbnail: finalThumbnail,
            playCount: 0,
            addedAt: new Date().toISOString(),
            lastPlayed: null,
            size: stat.size,
            isFavorite: false,
          };

          tracks.push(newTrack);
          saveTracks(tracks);

          console.log('Track added to library:', newTrack.title, 'by', newTrack.artist);
        } catch (e) {
          console.error('Error adding track to library:', e);
        }
      }

      return outputFile;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  });

  ipcMain.handle('cancel-download', (_event, downloadId: string) => {
    return cancelDownload(downloadId);
  });

  ipcMain.handle('get-ytdlp-status', async () => {
    return await getYtDlpStatus();
  });

  ipcMain.handle('install-ytdlp', async () => {
    await installYtDlp();
    return true;
  });

  // Download history handlers
  ipcMain.handle('get-download-history', () => {
    return store.get('downloadHistory', []) as DownloadHistoryItem[];
  });

  ipcMain.handle('add-to-download-history', (_event, item: DownloadHistoryItem) => {
    const history = store.get('downloadHistory', []) as DownloadHistoryItem[];
    history.unshift(item); // Add to beginning
    // Keep only last 100 items
    if (history.length > 100) {
      history.pop();
    }
    store.set('downloadHistory', history);
    return history;
  });

  ipcMain.handle('clear-download-history', () => {
    store.set('downloadHistory', []);
    return [];
  });
}
