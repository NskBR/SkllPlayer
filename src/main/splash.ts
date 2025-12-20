import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export async function createSplashWindow(logoPath?: string): Promise<BrowserWindow> {
  // Convert logo to base64 if it exists
  let logoDataUrl = '';
  if (logoPath && fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }

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
          padding: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .logo-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 30px;
        }

        .logo {
          width: 100%;
          height: 100%;
          border-radius: 24px;
          object-fit: contain;
          animation: pulse 2s ease-in-out infinite;
        }

        .logo-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(139, 92, 246, 0);
          }
        }

        .equalizer {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 30px;
        }

        .bar {
          width: 6px;
          background: linear-gradient(180deg, #a855f7 0%, #6366f1 100%);
          border-radius: 3px;
          animation: equalizer 0.8s ease-in-out infinite;
        }

        .bar:nth-child(1) { animation-delay: 0s; }
        .bar:nth-child(2) { animation-delay: 0.1s; }
        .bar:nth-child(3) { animation-delay: 0.2s; }
        .bar:nth-child(4) { animation-delay: 0.3s; }
        .bar:nth-child(5) { animation-delay: 0.4s; }

        @keyframes equalizer {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 25px;
          }
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          letter-spacing: 2px;
          margin-bottom: 10px;
          animation: slideUp 0.6s ease-out 0.3s backwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .version {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          animation: slideUp 0.6s ease-out 0.5s backwards;
        }

        .loading {
          margin-top: 25px;
          display: flex;
          gap: 6px;
          animation: slideUp 0.6s ease-out 0.7s backwards;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: loadingDot 1.4s ease-in-out infinite;
        }

        .loading-dot:nth-child(1) { animation-delay: 0s; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      </style>
    </head>
    <body>
      <div class="splash-container">
        <div class="logo-container">
          ${logoDataUrl
            ? `<img class="logo" src="${logoDataUrl}" alt="SkllPlayer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
            : ''}
          <div class="logo-fallback" style="display:${logoDataUrl ? 'none' : 'flex'};">S</div>
          <div class="equalizer">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
          </div>
        </div>
        <div class="title">SkllPlayer</div>
        <div class="version">v0.1 Build Test</div>
        <div class="loading">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
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
