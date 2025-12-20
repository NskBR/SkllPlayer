import { app, BrowserWindow, ipcMain, globalShortcut, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { setupIpcHandlers } from './ipc';
import { createSplashWindow } from './splash';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

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
    transparent: false,
    backgroundColor: '#0a0a0f',
    show: false, // Hidden initially, shown after splash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools after window is shown
    mainWindow.once('show', () => {
      mainWindow?.webContents.openDevTools();
    });
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

  // DevTools shortcut
  globalShortcut.register('F12', () => {
    mainWindow?.webContents.toggleDevTools();
  });

  // Reload shortcut
  globalShortcut.register('F5', () => {
    mainWindow?.webContents.reload();
  });
}

async function initialize(): Promise<void> {
  // Register custom protocol for audio files
  registerMediaProtocol();

  // Get logo path for splash screen
  const logoPath = path.join(__dirname, '../../Public/Icon/Icone.png');

  // Create and show splash screen
  splashWindow = await createSplashWindow(logoPath);

  // Create main window (hidden)
  await createMainWindow();

  // Setup IPC handlers (after window is created so we can pass it for download progress)
  setupIpcHandlers(mainWindow);

  // Register global shortcuts
  registerGlobalShortcuts();

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

  // Show main window when ready (minimum 1.5s splash for smooth UX)
  let isReady = false;
  let minTimeElapsed = false;

  mainWindow?.webContents.once('did-finish-load', () => {
    isReady = true;
    if (minTimeElapsed) {
      showMainWindow();
    }
  });

  // Minimum splash time for smooth UX
  setTimeout(() => {
    minTimeElapsed = true;
    if (isReady) {
      showMainWindow();
    }
  }, 1500);

  // Fallback: show after 5s if something goes wrong
  setTimeout(() => {
    showMainWindow();
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
