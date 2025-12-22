import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { spawn, ChildProcess, execSync } from 'child_process';

// yt-dlp binary info - use latest release
const YTDLP_LATEST_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';

// ffmpeg builds for yt-dlp
const FFMPEG_RELEASE_URL = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

interface YouTubeResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

interface DownloadOptions {
  format: string;
  outputDir: string;
  downloadId: string;
}

// Store active downloads for cancellation
const activeDownloads: Map<string, ChildProcess> = new Map();

// Get the path where yt-dlp binary should be stored
function getYtDlpDir(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'bin');
}

function getYtDlpPath(): string {
  const binDir = getYtDlpDir();
  const isWindows = process.platform === 'win32';
  return path.join(binDir, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
}

function getFfmpegDir(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'ffmpeg');
}

function getFfmpegPath(): string {
  const ffmpegDir = getFfmpegDir();
  // After extraction, ffmpeg is in a subdirectory
  const possiblePaths = [
    path.join(ffmpegDir, 'ffmpeg.exe'),
    path.join(ffmpegDir, 'bin', 'ffmpeg.exe'),
  ];

  // Check for extracted folder pattern
  if (fs.existsSync(ffmpegDir)) {
    const entries = fs.readdirSync(ffmpegDir);
    for (const entry of entries) {
      const binPath = path.join(ffmpegDir, entry, 'bin', 'ffmpeg.exe');
      if (fs.existsSync(binPath)) {
        return path.dirname(binPath);
      }
    }
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return path.dirname(p);
    }
  }

  return ffmpegDir;
}

// Check if ffmpeg is installed
export function isFfmpegInstalled(): boolean {
  const ffmpegDir = getFfmpegDir();

  if (!fs.existsSync(ffmpegDir)) {
    return false;
  }

  // Look for ffmpeg.exe in the directory or subdirectories
  const checkPaths = [
    path.join(ffmpegDir, 'ffmpeg.exe'),
    path.join(ffmpegDir, 'bin', 'ffmpeg.exe'),
  ];

  // Check for extracted folder pattern (ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe)
  const entries = fs.readdirSync(ffmpegDir);
  for (const entry of entries) {
    const binPath = path.join(ffmpegDir, entry, 'bin', 'ffmpeg.exe');
    if (fs.existsSync(binPath)) {
      return true;
    }
  }

  return checkPaths.some(p => fs.existsSync(p));
}

// Install ffmpeg
export async function installFfmpeg(): Promise<void> {
  if (process.platform !== 'win32') {
    console.log('FFmpeg auto-install only supported on Windows. Please install ffmpeg manually.');
    return;
  }

  const ffmpegDir = getFfmpegDir();
  const zipPath = path.join(ffmpegDir, 'ffmpeg.zip');

  // Create directory
  if (!fs.existsSync(ffmpegDir)) {
    fs.mkdirSync(ffmpegDir, { recursive: true });
  }

  console.log('Downloading ffmpeg...');

  // Download ffmpeg zip
  await downloadFile(FFMPEG_RELEASE_URL, zipPath);

  console.log('Extracting ffmpeg...');

  // Extract using PowerShell
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${ffmpegDir}' -Force"`, {
      windowsHide: true,
    });

    // Remove zip file
    fs.unlinkSync(zipPath);

    console.log('ffmpeg installed successfully');
  } catch (error) {
    console.error('Failed to extract ffmpeg:', error);
    throw new Error('Failed to extract ffmpeg');
  }
}

// Check if yt-dlp is installed and valid
export function isYtDlpInstalled(): boolean {
  const ytdlpPath = getYtDlpPath();
  if (!fs.existsSync(ytdlpPath)) {
    return false;
  }

  // Check file size (yt-dlp.exe is usually > 5MB)
  try {
    const stats = fs.statSync(ytdlpPath);
    if (stats.size < 1000000) { // Less than 1MB is probably corrupted
      console.log('yt-dlp file seems corrupted (too small), removing...');
      fs.unlinkSync(ytdlpPath);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Download file helper with proper redirect handling
function downloadFile(url: string, dest: string, maxRedirects = 10): Promise<void> {
  return new Promise((resolve, reject) => {
    let redirectCount = 0;

    const doRequest = (urlToFetch: string) => {
      // Parse URL to determine http or https
      const urlObj = new URL(urlToFetch);
      const httpModule = urlObj.protocol === 'https:' ? https : require('http');

      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': 'SkllPlayer/1.0',
        },
      };

      httpModule.get(options, (response: any) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }

          let redirectUrl = response.headers.location;
          // Handle relative redirects
          if (redirectUrl.startsWith('/')) {
            redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
          }

          console.log(`Redirect ${redirectCount}: ${redirectUrl}`);
          doRequest(redirectUrl);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        // Ensure directory exists
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const file = fs.createWriteStream(dest);

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          // Verify file was written
          if (fs.existsSync(dest)) {
            const stats = fs.statSync(dest);
            console.log(`Downloaded ${stats.size} bytes to ${dest}`);
            if (stats.size < 1000) {
              reject(new Error('Downloaded file is too small, may be corrupted'));
              return;
            }
          }
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      }).on('error', (err: Error) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };

    doRequest(url);
  });
}

// Download and install yt-dlp
export async function installYtDlp(): Promise<void> {
  const binDir = getYtDlpDir();
  const ytdlpPath = getYtDlpPath();

  // Create bin directory if not exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Remove existing file if present (might be corrupted)
  if (fs.existsSync(ytdlpPath)) {
    try {
      fs.unlinkSync(ytdlpPath);
      console.log('Removed existing yt-dlp file');
    } catch (e) {
      console.error('Could not remove existing yt-dlp file:', e);
    }
  }

  // Determine the correct binary for the platform
  let binaryName: string;
  switch (process.platform) {
    case 'win32':
      binaryName = 'yt-dlp.exe';
      break;
    case 'darwin':
      binaryName = 'yt-dlp_macos';
      break;
    default:
      binaryName = 'yt-dlp_linux';
  }

  const downloadUrl = `${YTDLP_LATEST_URL}/${binaryName}`;

  console.log(`Downloading yt-dlp from ${downloadUrl}...`);

  await downloadFile(downloadUrl, ytdlpPath);

  // Make executable on Unix
  if (process.platform !== 'win32') {
    fs.chmodSync(ytdlpPath, '755');
  }

  console.log('yt-dlp installed successfully');

  // Also install ffmpeg if not present
  if (!isFfmpegInstalled()) {
    console.log('Installing ffmpeg...');
    await installFfmpeg();
  }
}

// Run yt-dlp command and return output
function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getYtDlpPath();

    if (!fs.existsSync(ytdlpPath)) {
      reject(new Error('yt-dlp not installed'));
      return;
    }

    const proc = spawn(ytdlpPath, args, {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Search YouTube
export async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  if (!isYtDlpInstalled()) {
    throw new Error('yt-dlp not installed');
  }

  try {
    // Search for up to 10 results
    const args = [
      `ytsearch10:${query}`,
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      '--ignore-errors',
    ];

    const output = await runYtDlp(args);

    // Parse JSON lines
    const results: YouTubeResult[] = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);

        // Format duration
        let duration = '';
        if (data.duration) {
          const mins = Math.floor(data.duration / 60);
          const secs = data.duration % 60;
          duration = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Extract artist from title or channel
        let title = data.title || '';
        let artist = data.channel || data.uploader || 'Unknown';

        // Try to extract artist from title if it contains " - "
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        results.push({
          id: data.id || data.url,
          title: title,
          artist: artist,
          duration: duration,
          thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || '',
        });
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Download track
export async function downloadTrack(
  videoId: string,
  options: DownloadOptions,
  mainWindow: BrowserWindow | null
): Promise<string> {
  if (!isYtDlpInstalled()) {
    throw new Error('yt-dlp not installed');
  }

  // Auto-install ffmpeg if not present
  if (!isFfmpegInstalled()) {
    console.log('ffmpeg not found, installing...');
    await installFfmpeg();
  }

  const { format, outputDir, downloadId } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build output template
  const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');

  // Build format argument based on selected format
  let formatArg: string;
  let audioFormat: string;
  let audioBitrate: string | null = null;

  switch (format) {
    case 'mp3-320':
      formatArg = 'bestaudio/best';
      audioFormat = 'mp3';
      audioBitrate = '320';
      break;
    case 'mp3-192':
      formatArg = 'bestaudio/best';
      audioFormat = 'mp3';
      audioBitrate = '192';
      break;
    case 'mp3-128':
      formatArg = 'bestaudio/best';
      audioFormat = 'mp3';
      audioBitrate = '128';
      break;
    case 'flac':
      formatArg = 'bestaudio/best';
      audioFormat = 'flac';
      break;
    case 'm4a':
      formatArg = 'bestaudio[ext=m4a]/bestaudio/best';
      audioFormat = 'm4a';
      break;
    case 'ogg':
      formatArg = 'bestaudio/best';
      audioFormat = 'vorbis';
      break;
    default:
      formatArg = 'bestaudio/best';
      audioFormat = 'mp3';
      audioBitrate = '320';
  }

  // Build yt-dlp arguments
  const args = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '-f', formatArg,
    '-x', // Extract audio
    '--audio-format', audioFormat,
    '-o', outputTemplate,
    '--no-playlist',
    '--embed-thumbnail',
    '--convert-thumbnails', 'jpg', // Convert thumbnail to jpg for compatibility
    '--add-metadata',
    '--progress',
    '--newline',
  ];

  // Add ffmpeg location if installed
  if (isFfmpegInstalled()) {
    const ffmpegPath = getFfmpegPath();
    args.push('--ffmpeg-location', ffmpegPath);
  }

  // Add bitrate for mp3
  if (audioBitrate) {
    args.push('--audio-quality', `${audioBitrate}K`);
  }

  return new Promise((resolve, reject) => {
    const ytdlpPath = getYtDlpPath();

    const proc = spawn(ytdlpPath, args, {
      windowsHide: true,
    });

    // Store for cancellation
    activeDownloads.set(downloadId, proc);

    let outputFile = '';
    let lastProgress = 0;

    proc.stdout.on('data', (data) => {
      const output = data.toString();

      // Parse progress
      // Format: [download]  45.2% of   3.50MiB at  256.00KiB/s ETA 00:10
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%.*at\s+(\S+).*ETA\s+(\S+)/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        const speed = progressMatch[2];
        const eta = progressMatch[3];

        // Only send update if progress changed significantly
        if (percent - lastProgress >= 1 || percent === 100) {
          lastProgress = percent;
          mainWindow?.webContents.send('download-progress', {
            percent: Math.round(percent),
            speed: speed,
            eta: eta,
          });
        }
      }

      // Capture output filename
      // Format: [ExtractAudio] Destination: /path/to/file.mp3
      const destMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
      if (destMatch) {
        outputFile = destMatch[1].trim();
      }

      // Also check for merger destination
      const mergerMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
      if (mergerMatch) {
        outputFile = mergerMatch[1].trim();
      }

      // Check for already downloaded
      const alreadyMatch = output.match(/\[download\] (.+) has already been downloaded/);
      if (alreadyMatch) {
        outputFile = alreadyMatch[1].trim();
      }

      // Final output detection
      const ffmpegMatch = output.match(/Deleting original file (.+) \(pass -k to keep\)/);
      if (ffmpegMatch) {
        // The final file has a different extension
      }
    });

    let stderrOutput = '';
    proc.stderr.on('data', (data) => {
      const msg = data.toString();
      stderrOutput += msg;
      console.error('yt-dlp stderr:', msg);
    });

    proc.on('close', (code) => {
      activeDownloads.delete(downloadId);

      if (code === 0) {
        // Try to find the output file if not captured
        if (!outputFile) {
          // List files in output directory sorted by modification time
          try {
            const files = fs.readdirSync(outputDir)
              .map(f => ({
                name: f,
                time: fs.statSync(path.join(outputDir, f)).mtime.getTime()
              }))
              .sort((a, b) => b.time - a.time);

            if (files.length > 0) {
              outputFile = path.join(outputDir, files[0].name);
            }
          } catch (e) {
            // Ignore
          }
        }

        resolve(outputFile);
      } else {
        // Include stderr in error message for debugging
        const errorMsg = stderrOutput.trim() || `Download failed with code ${code}`;
        console.error('yt-dlp failed:', errorMsg);
        reject(new Error(errorMsg));
      }
    });

    proc.on('error', (err) => {
      activeDownloads.delete(downloadId);
      reject(err);
    });
  });
}

// Cancel download
export function cancelDownload(downloadId: string): boolean {
  const proc = activeDownloads.get(downloadId);
  if (proc) {
    proc.kill();
    activeDownloads.delete(downloadId);
    return true;
  }
  return false;
}

// Check yt-dlp status
export interface YtDlpStatus {
  installed: boolean;
  version: string | null;
  path: string;
  ffmpegInstalled: boolean;
  ffmpegPath: string;
}

export async function getYtDlpStatus(): Promise<YtDlpStatus> {
  const ytdlpPath = getYtDlpPath();
  const installed = fs.existsSync(ytdlpPath);
  const ffmpegInstalled = isFfmpegInstalled();
  const ffmpegPath = getFfmpegPath();

  let version: string | null = null;
  if (installed) {
    try {
      const output = await runYtDlp(['--version']);
      version = output.trim();
    } catch (e) {
      // Ignore
    }
  }

  return {
    installed,
    version,
    path: ytdlpPath,
    ffmpegInstalled,
    ffmpegPath,
  };
}

// =====================================================
// uBlock Origin Extension Download
// =====================================================

const UBLOCK_API_URL = 'https://api.github.com/repos/gorhill/uBlock/releases/latest';

// Get the path where uBlock extension should be stored
export function getUBlockDir(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'extensions', 'uBlock0');
}

export function getUBlockPath(): string {
  return path.join(getUBlockDir(), 'uBlock0.chromium');
}

// Check if uBlock Origin is installed
export function isUBlockInstalled(): boolean {
  const uBlockPath = getUBlockPath();
  const manifestPath = path.join(uBlockPath, 'manifest.json');
  return fs.existsSync(manifestPath);
}

// Get latest uBlock Origin download URL from GitHub API
async function getUBlockDownloadUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/gorhill/uBlock/releases/latest',
      headers: {
        'User-Agent': 'SkllPlayer/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    https.get(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          const assets = release.assets || [];

          // Find the Chromium zip file
          const chromiumAsset = assets.find((a: any) =>
            a.name && a.name.includes('chromium') && a.name.endsWith('.zip')
          );

          if (chromiumAsset && chromiumAsset.browser_download_url) {
            resolve(chromiumAsset.browser_download_url);
          } else {
            reject(new Error('Could not find uBlock Origin Chromium download'));
          }
        } catch (e) {
          reject(new Error('Failed to parse GitHub API response'));
        }
      });
    }).on('error', reject);
  });
}

// Download and install uBlock Origin
export async function installUBlock(): Promise<string> {
  const uBlockDir = getUBlockDir();
  const uBlockPath = getUBlockPath();
  const zipPath = path.join(uBlockDir, 'ublock.zip');

  console.log('[SkllPlayer] Installing uBlock Origin...');

  // Create directory
  if (!fs.existsSync(uBlockDir)) {
    fs.mkdirSync(uBlockDir, { recursive: true });
  }

  // Get latest download URL
  console.log('[SkllPlayer] Fetching latest uBlock Origin release...');
  const downloadUrl = await getUBlockDownloadUrl();
  console.log('[SkllPlayer] Download URL:', downloadUrl);

  // Download the zip file
  console.log('[SkllPlayer] Downloading uBlock Origin...');
  await downloadFile(downloadUrl, zipPath);

  // Extract the zip
  console.log('[SkllPlayer] Extracting uBlock Origin...');
  try {
    // Remove old extension if exists
    if (fs.existsSync(uBlockPath)) {
      fs.rmSync(uBlockPath, { recursive: true, force: true });
    }

    // Extract using PowerShell
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${uBlockDir}' -Force"`, {
      windowsHide: true,
    });

    // Remove zip file
    fs.unlinkSync(zipPath);

    console.log('[SkllPlayer] uBlock Origin installed successfully at:', uBlockPath);
    return uBlockPath;
  } catch (error) {
    console.error('[SkllPlayer] Failed to extract uBlock Origin:', error);
    throw new Error('Failed to extract uBlock Origin');
  }
}

// Get uBlock status
export interface UBlockStatus {
  installed: boolean;
  path: string;
}

export function getUBlockStatus(): UBlockStatus {
  return {
    installed: isUBlockInstalled(),
    path: getUBlockPath(),
  };
}
