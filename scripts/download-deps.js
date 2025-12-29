const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPS_DIR = path.join(__dirname, '..', 'deps');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const FFMPEG_URL = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

// Download file with redirect support
function downloadFile(url, dest, description) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${description}...`);
    console.log(`  URL: ${url}`);

    let redirectCount = 0;
    const maxRedirects = 10;

    const doRequest = (urlToFetch) => {
      const urlObj = new URL(urlToFetch);

      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': 'SkllPlayer-Build/1.0',
        },
      };

      https.get(options, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }

          let redirectUrl = response.headers.location;
          if (redirectUrl.startsWith('/')) {
            redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
          }

          console.log(`  Redirect ${redirectCount}: ${redirectUrl.substring(0, 80)}...`);
          doRequest(redirectUrl);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        let lastPercent = 0;

        const file = fs.createWriteStream(dest);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            if (percent >= lastPercent + 10) {
              lastPercent = percent;
              process.stdout.write(`  Progress: ${percent}%\r`);
            }
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`  Downloaded: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      }).on('error', reject);
    };

    doRequest(url);
  });
}

async function main() {
  console.log('=== Downloading SkllPlayer Dependencies ===\n');

  // Create deps directory
  if (!fs.existsSync(DEPS_DIR)) {
    fs.mkdirSync(DEPS_DIR, { recursive: true });
  }

  const binDir = path.join(DEPS_DIR, 'bin');
  const ffmpegDir = path.join(DEPS_DIR, 'ffmpeg');

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  if (!fs.existsSync(ffmpegDir)) {
    fs.mkdirSync(ffmpegDir, { recursive: true });
  }

  // Download yt-dlp
  const ytdlpPath = path.join(binDir, 'yt-dlp.exe');
  if (!fs.existsSync(ytdlpPath)) {
    try {
      await downloadFile(YTDLP_URL, ytdlpPath, 'yt-dlp');
      console.log('  yt-dlp downloaded successfully!\n');
    } catch (err) {
      console.error('  Failed to download yt-dlp:', err.message);
      process.exit(1);
    }
  } else {
    console.log('yt-dlp already exists, skipping...\n');
  }

  // Download ffmpeg
  const ffmpegZip = path.join(ffmpegDir, 'ffmpeg.zip');
  const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');

  // Check if ffmpeg is already extracted
  let ffmpegExists = fs.existsSync(ffmpegExe);
  if (!ffmpegExists && fs.existsSync(ffmpegDir)) {
    // Check in subdirectories
    const entries = fs.readdirSync(ffmpegDir);
    for (const entry of entries) {
      const binPath = path.join(ffmpegDir, entry, 'bin', 'ffmpeg.exe');
      if (fs.existsSync(binPath)) {
        ffmpegExists = true;
        break;
      }
    }
  }

  if (!ffmpegExists) {
    try {
      await downloadFile(FFMPEG_URL, ffmpegZip, 'ffmpeg');

      console.log('  Extracting ffmpeg...');
      execSync(`powershell -Command "Expand-Archive -Path '${ffmpegZip}' -DestinationPath '${ffmpegDir}' -Force"`, {
        windowsHide: true,
        stdio: 'inherit'
      });

      // Remove zip file
      fs.unlinkSync(ffmpegZip);
      console.log('  ffmpeg extracted successfully!\n');
    } catch (err) {
      console.error('  Failed to download/extract ffmpeg:', err.message);
      process.exit(1);
    }
  } else {
    console.log('ffmpeg already exists, skipping...\n');
  }

  console.log('=== All dependencies ready! ===\n');

  // List what we have
  console.log('Dependencies in', DEPS_DIR + ':');
  console.log('  - bin/yt-dlp.exe');

  const ffmpegEntries = fs.readdirSync(ffmpegDir);
  for (const entry of ffmpegEntries) {
    const stat = fs.statSync(path.join(ffmpegDir, entry));
    if (stat.isDirectory()) {
      console.log(`  - ffmpeg/${entry}/`);
    }
  }
}

main().catch(console.error);
