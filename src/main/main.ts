import { app, BrowserWindow, ipcMain, globalShortcut, protocol, Tray, Menu, dialog, nativeImage, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { setupIpcHandlers } from './ipc';
import { createSplashWindow } from './splash';
import { initDiscordRPC, destroyDiscordRPC } from './discord-rpc';
import { isUBlockInstalled, installUBlock, getUBlockPath } from './downloader';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Register custom protocol for serving local audio files
function registerMediaProtocol(): void {
  protocol.registerFileProtocol('media', (request, callback) => {
    // Extract file path from URL: media://C:/path/to/file.mp3
    let filePath = request.url.replace('media://', '');

    // Decode URI components (spaces, special chars)
    filePath = decodeURIComponent(filePath);

    // On Windows, remove leading slash if path starts with drive letter
    if (process.platform === 'win32' && filePath.match(/^\/[A-Za-z]:/)) {
      filePath = filePath.substring(1);
    }

    // Convert forward slashes to backslashes on Windows
    if (process.platform === 'win32') {
      filePath = filePath.replace(/\//g, '\\');
    }

    callback({ path: filePath });
  });
}

async function createMainWindow(): Promise<BrowserWindow> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Remove default frame for custom titlebar
    transparent: true, // Enable transparency for acrylic/mica effects
    backgroundColor: '#00000000', // Fully transparent background
    show: false, // Hidden initially, shown after splash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
  });

  // Set default background material (none = opaque)
  // Will be changed by theme if it specifies a windowEffect
  if (process.platform === 'win32') {
    mainWindow.setBackgroundMaterial('none');
  }

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools only when SKLLPLAYER_DEV env is set (start-dev.bat)
    if (process.env.SKLLPLAYER_DEV) {
      mainWindow.once('show', () => {
        mainWindow?.webContents.openDevTools();
      });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

function registerGlobalShortcuts(): void {
  // Media keys
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('media-key', 'play-pause');
  });

  globalShortcut.register('MediaNextTrack', () => {
    mainWindow?.webContents.send('media-key', 'next');
  });

  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow?.webContents.send('media-key', 'previous');
  });

  globalShortcut.register('MediaStop', () => {
    mainWindow?.webContents.send('media-key', 'stop');
  });

  // Volume control
  globalShortcut.register('VolumeUp', () => {
    mainWindow?.webContents.send('media-key', 'volume-up');
  });

  globalShortcut.register('VolumeDown', () => {
    mainWindow?.webContents.send('media-key', 'volume-down');
  });

  globalShortcut.register('VolumeMute', () => {
    mainWindow?.webContents.send('media-key', 'volume-mute');
  });

  // Note: F5 and F12 are handled locally in setupLocalShortcuts() to avoid
  // triggering when app is not focused
}

function setupLocalShortcuts(): void {
  if (!mainWindow) return;

  // Handle F5 (reload) and F12 (devtools) only when window is focused
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F5') {
        mainWindow?.webContents.reload();
        event.preventDefault();
      } else if (input.key === 'F12') {
        mainWindow?.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });
}

// Settings file path
function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

// Read close behavior from settings
function getCloseBehavior(): 'ask' | 'tray' | 'close' {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return settings.closeBehavior || 'ask';
    }
  } catch (error) {
    console.error('Error reading close behavior:', error);
  }
  return 'ask';
}

// Save close behavior to settings
function saveCloseBehavior(behavior: 'ask' | 'tray' | 'close'): void {
  try {
    const settingsPath = getSettingsPath();
    let settings: any = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    settings.closeBehavior = behavior;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving close behavior:', error);
  }
}

// Create system tray
function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/icons/icon.png');
  let trayIcon: Electron.NativeImage;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for tray (16x16 or 32x32 depending on platform)
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (error) {
    console.error('Error loading tray icon:', error);
    return;
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('SkllPlayer');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir SkllPlayer',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Reproduzir/Pausar',
      click: () => {
        mainWindow?.webContents.send('media-key', 'play-pause');
      }
    },
    {
      label: 'Próxima',
      click: () => {
        mainWindow?.webContents.send('media-key', 'next');
      }
    },
    {
      label: 'Anterior',
      click: () => {
        mainWindow?.webContents.send('media-key', 'previous');
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click to open
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// Handle window close with dialog
async function handleWindowClose(): Promise<void> {
  const behavior = getCloseBehavior();

  if (behavior === 'tray') {
    mainWindow?.hide();
    return;
  }

  if (behavior === 'close') {
    isQuitting = true;
    app.quit();
    return;
  }

  // behavior === 'ask' - show dialog
  const result = await dialog.showMessageBox(mainWindow!, {
    type: 'question',
    buttons: ['Minimizar na bandeja', 'Fechar o aplicativo'],
    defaultId: 0,
    cancelId: 1,
    title: 'Fechar SkllPlayer',
    message: 'O que deseja fazer?',
    detail: 'Você pode alterar isso depois em Configurações.',
    checkboxLabel: 'Lembrar minha escolha',
    checkboxChecked: false
  });

  if (result.checkboxChecked) {
    // Save choice
    saveCloseBehavior(result.response === 0 ? 'tray' : 'close');
  }

  if (result.response === 0) {
    // Minimize to tray
    mainWindow?.hide();
  } else {
    // Close app
    isQuitting = true;
    app.quit();
  }
}

async function initialize(): Promise<void> {
  // Register custom protocol for audio files
  registerMediaProtocol();

  // Initialize Discord Rich Presence
  initDiscordRPC();

  
  // Create system tray
  createTray();

  // Create and show splash screen
  splashWindow = await createSplashWindow();

  // Create main window (hidden)
  await createMainWindow();

  // Intercept window close event
  mainWindow?.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      handleWindowClose();
    }
  });

  // Setup IPC handlers (after window is created so we can pass it for download progress)
  setupIpcHandlers(mainWindow);

  // Register global shortcuts (media keys)
  registerGlobalShortcuts();

  // Register local shortcuts (F5, F12 - only when focused)
  setupLocalShortcuts();

  // Function to close splash and show main window
  const showMainWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  // Track window state changes to adjust glass effect
  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isMaximized = mainWindow.isMaximized();
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.webContents.send('window-state-changed', { isMaximized, isFullScreen });
    }
  };

  mainWindow?.on('maximize', sendWindowState);
  mainWindow?.on('unmaximize', sendWindowState);
  mainWindow?.on('enter-full-screen', sendWindowState);
  mainWindow?.on('leave-full-screen', sendWindowState);
  mainWindow?.on('resize', sendWindowState);

  // Show main window when ready (minimum 1.5s splash for smooth UX)
  let isReady = false;
  let minTimeElapsed = false;
  let hasShownMainWindow = false;

  const safeShowMainWindow = () => {
    if (!hasShownMainWindow) {
      hasShownMainWindow = true;
      showMainWindow();

      // Fix: Re-apply window effect after showing window (Windows DWM bug workaround)
      // The acrylic/mica effect doesn't render correctly on initial window creation
      if (process.platform === 'win32' && mainWindow) {
        setTimeout(() => {
          // Request the renderer to re-apply the theme's window effect
          mainWindow?.webContents.send('reapply-window-effect');
        }, 100);
      }
    }
  };

  mainWindow?.webContents.once('did-finish-load', () => {
    isReady = true;
    if (minTimeElapsed) {
      safeShowMainWindow();
    }
  });

  // Minimum splash time for smooth UX
  setTimeout(() => {
    minTimeElapsed = true;
    if (isReady) {
      safeShowMainWindow();
    }
  }, 1500);

  // Fallback: show after 5s if something goes wrong
  setTimeout(() => {
    safeShowMainWindow();
  }, 5000);
}

// App lifecycle
app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('quit', () => {
  // Destroy Discord RPC
  destroyDiscordRPC();

  
  // Destroy tray
  if (tray) {
    tray.destroy();
    tray = null;
  }
  // Force exit to close CMD/terminal window
  process.exit(0);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC for window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// Window effect (mica, acrylic, etc.) - Windows only
ipcMain.on('set-window-effect', (_event, effect: string) => {
  if (process.platform === 'win32' && mainWindow) {
    try {
      // Valid effects: 'none', 'mica', 'acrylic', 'tabbed', 'auto'
      const validEffects = ['none', 'mica', 'acrylic', 'tabbed', 'auto'];
      if (validEffects.includes(effect)) {
        mainWindow.setBackgroundMaterial(effect as 'none' | 'mica' | 'acrylic' | 'tabbed' | 'auto');
        console.log(`Window effect set to: ${effect}`);
      }
    } catch (error) {
      console.error('Error setting window effect:', error);
    }
  }
});

// Close behavior settings
ipcMain.handle('get-close-behavior', () => {
  return getCloseBehavior();
});

ipcMain.on('set-close-behavior', (_event, behavior: 'ask' | 'tray' | 'close') => {
  saveCloseBehavior(behavior);
});

// YouTube Preview Window
let youtubePreviewWindow: BrowserWindow | null = null;
let uBlockLoaded = false;

// Create a dedicated session for YouTube with uBlock
let youtubeSession: Electron.Session | null = null;

// Load uBlock Origin extension
async function loadUBlockExtension(): Promise<Electron.Session> {
  if (youtubeSession && uBlockLoaded) return youtubeSession;

  // Create a persistent session for YouTube
  youtubeSession = session.fromPartition('persist:youtube');

  try {
    // Check if uBlock is installed, if not download it
    if (!isUBlockInstalled()) {
      console.log('[SkllPlayer] uBlock Origin not found, downloading...');
      await installUBlock();
    }

    const uBlockPath = getUBlockPath();
    console.log('[SkllPlayer] Loading uBlock from:', uBlockPath);

    if (fs.existsSync(uBlockPath)) {
      const ext = await youtubeSession.loadExtension(uBlockPath, { allowFileAccess: true });
      uBlockLoaded = true;
      console.log('[SkllPlayer] uBlock Origin loaded successfully:', ext.name);
    } else {
      console.log('[SkllPlayer] uBlock Origin not found at:', uBlockPath);
    }
  } catch (error) {
    console.error('[SkllPlayer] Failed to load uBlock Origin:', error);
  }

  return youtubeSession;
}

ipcMain.on('open-youtube-preview', async (_event, videoId: string, title: string) => {
  // Close existing preview window if open
  if (youtubePreviewWindow && !youtubePreviewWindow.isDestroyed()) {
    youtubePreviewWindow.close();
  }

  // Load uBlock Origin and get the session
  const ytSession = await loadUBlockExtension();

  youtubePreviewWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    parent: mainWindow || undefined,
    modal: false,
    frame: true, // Native titlebar with close button
    resizable: true,
    title: `Preview: ${title}`,
    backgroundColor: '#0f0f0f',
    autoHideMenuBar: true, // Hide menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-youtube.js'),
      session: ytSession, // Use session with uBlock loaded
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
  });

  // Load YouTube directly - uBlock will block ads
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  youtubePreviewWindow.loadURL(youtubeUrl);

  // Inject CSS for dark theme and clean look
  youtubePreviewWindow.webContents.on('did-finish-load', () => {
    youtubePreviewWindow?.webContents.insertCSS(`
      /* Force dark theme */
      html, body, ytd-app {
        background-color: #0f0f0f !important;
      }

      /* Hide everything except video player */
      #secondary, #comments, #related, ytd-watch-metadata,
      #above-the-fold, #below, #masthead-container, ytd-masthead,
      ytd-mini-guide-renderer {
        display: none !important;
      }

      /* Make video player take full space */
      #columns { max-width: 100% !important; }
      ytd-watch-flexy[theater] #player-theater-container.ytd-watch-flexy {
        max-height: 100vh !important;
        min-height: 100vh !important;
      }
    `);

    // Enable theater mode
    setTimeout(() => {
      youtubePreviewWindow?.webContents.executeJavaScript(`
        (function() {
          var tb = document.querySelector('.ytp-size-button');
          if (tb && !document.querySelector('ytd-watch-flexy[theater]')) {
            tb.click();
          }
        })();
      `);
    }, 1500);
  });

  youtubePreviewWindow.on('closed', () => {
    youtubePreviewWindow = null;
  });
});

// YouTube preview window controls
ipcMain.on('youtube-preview-minimize', () => {
  youtubePreviewWindow?.minimize();
});

ipcMain.on('youtube-preview-maximize', () => {
  if (youtubePreviewWindow?.isMaximized()) {
    youtubePreviewWindow?.unmaximize();
  } else {
    youtubePreviewWindow?.maximize();
  }
});

ipcMain.on('youtube-preview-close', () => {
  youtubePreviewWindow?.close();
});
