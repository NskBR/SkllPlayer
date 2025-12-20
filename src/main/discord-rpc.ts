import { Client } from 'discord-rpc';
import { ipcMain } from 'electron';

// Discord Application ID - You can create your own at https://discord.com/developers/applications
const CLIENT_ID = '1452007910518427671';

let rpcClient: Client | null = null;
let isConnected = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

interface TrackInfo {
  title: string;
  artist: string;
  thumbnail: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

export function initDiscordRPC(): void {
  rpcClient = new Client({ transport: 'ipc' });

  rpcClient.on('ready', () => {
    console.log('Discord RPC connected');
    isConnected = true;

    // Set initial presence
    setIdlePresence();
  });

  rpcClient.on('disconnected', () => {
    console.log('Discord RPC disconnected');
    isConnected = false;

    // Try to reconnect after 10 seconds
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
      connectRPC();
    }, 10000);
  });

  rpcClient.on('error', (error: Error) => {
    console.error('Discord RPC error:', error);
  });

  connectRPC();
  setupIpcHandlers();
}

function connectRPC(): void {
  if (!rpcClient) return;

  rpcClient.login({ clientId: CLIENT_ID }).catch((error: Error) => {
    console.log('Discord RPC connection failed (Discord may not be running):', error.message);
    isConnected = false;

    // Retry connection after 30 seconds
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
      connectRPC();
    }, 30000);
  });
}

function setIdlePresence(): void {
  if (!rpcClient || !isConnected) return;

  console.log('[Discord RPC] Setting idle presence');
  rpcClient.setActivity({
    details: 'Idle',
    state: 'Not playing anything',
    largeImageKey: 'logo',
    largeImageText: 'SkllPlayer',
    instance: false,
  }).catch((err) => console.error('[Discord RPC] Error setting idle:', err));
}

function setPlayingPresence(track: TrackInfo): void {
  if (!rpcClient || !isConnected) {
    console.log('[Discord RPC] Cannot set playing presence - not connected');
    return;
  }

  console.log('[Discord RPC] Setting playing presence:', track.title, 'isPlaying:', track.isPlaying);

  const startTimestamp = track.isPlaying
    ? Math.floor(Date.now() / 1000) - Math.floor(track.currentTime)
    : undefined;

  const endTimestamp = track.isPlaying && track.duration > 0
    ? startTimestamp! + Math.floor(track.duration)
    : undefined;

  const activity: any = {
    details: track.title || 'Unknown Track',
    state: `por ${track.artist || 'Artista Desconhecido'}`,
    largeImageKey: 'logo', // Use only registered asset, not external URLs
    largeImageText: 'SkllPlayer',
    smallImageKey: track.isPlaying ? 'play' : 'pause',
    smallImageText: track.isPlaying ? 'Reproduzindo' : 'Pausado',
    instance: false,
  };

  // Only add timestamps if playing
  if (track.isPlaying && startTimestamp && endTimestamp) {
    activity.startTimestamp = startTimestamp;
    activity.endTimestamp = endTimestamp;
  }

  console.log('[Discord RPC] Activity:', JSON.stringify(activity));
  rpcClient.setActivity(activity).catch((err) => console.error('[Discord RPC] Error setting activity:', err));
}

function setupIpcHandlers(): void {
  // Update Discord presence when track changes or playback state changes
  ipcMain.on('discord-rpc-update', (_event, track: TrackInfo | null) => {
    console.log('[Discord RPC] Received update from renderer:', track ? track.title : 'null');
    if (!track) {
      setIdlePresence();
    } else {
      setPlayingPresence(track);
    }
  });

  // Clear presence
  ipcMain.on('discord-rpc-clear', () => {
    console.log('[Discord RPC] Received clear command');
    setIdlePresence();
  });
}

export function destroyDiscordRPC(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (rpcClient) {
    rpcClient.clearActivity().catch(() => {});
    rpcClient.destroy().catch(() => {});
    rpcClient = null;
    isConnected = false;
  }
}
