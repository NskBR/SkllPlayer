import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export async function createSplashWindow(): Promise<BrowserWindow> {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splash.center();

  // Load icon as base64
  const iconPath = path.join(__dirname, '../../Public/Icon/symbol.png');
  let iconBase64 = '';
  try {
    const iconBuffer = fs.readFileSync(iconPath);
    iconBase64 = `data:image/png;base64,${iconBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to load splash icon:', error);
  }

  // Load splash HTML
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: transparent;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          overflow: hidden;
        }

        .splash-container {
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          border-radius: 20px;
          padding: 40px 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .logo {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
        }

        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @keyframes pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.8)); }
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }

        .version {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 20px;
        }

        .sound-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 4px;
          height: 24px;
        }

        .sound-bar {
          width: 4px;
          background: #8b5cf6;
          border-radius: 2px;
          animation: soundBar 0.8s ease-in-out infinite;
          transform-origin: bottom;
        }

        .sound-bar:nth-child(1) { height: 12px; animation-delay: 0s; }
        .sound-bar:nth-child(2) { height: 20px; animation-delay: 0.2s; }
        .sound-bar:nth-child(3) { height: 16px; animation-delay: 0.4s; }
        .sound-bar:nth-child(4) { height: 24px; animation-delay: 0.1s; }
        .sound-bar:nth-child(5) { height: 14px; animation-delay: 0.3s; }

        @keyframes soundBar {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      </style>
    </head>
    <body>
      <div class="splash-container">
        <div class="logo">
          <img src="${iconBase64}" alt="SkllPlayer" />
        </div>
        <div class="title">SkllPlayer</div>
        <div class="version">v0.2</div>
        <div class="sound-bars">
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Write HTML to temp file to avoid data URL length limits
  const tempDir = app.getPath('temp');
  const splashFile = path.join(tempDir, 'skllplayer-splash.html');
  fs.writeFileSync(splashFile, splashHTML, 'utf-8');

  await splash.loadFile(splashFile);
  splash.show();

  return splash;
}
