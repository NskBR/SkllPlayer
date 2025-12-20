import { WebSocketServer, WebSocket } from 'ws';
import { ipcMain } from 'electron';

const PORT = 6463;

let wss: WebSocketServer | null = null;
let currentTrackData: TrackData | null = null;

interface TrackData {
  title: string;
  artist: string;
  album?: string;
  thumbnail: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

export function initWebSocketServer(): void {
  try {
    wss = new WebSocketServer({ port: PORT });

    console.log(`[WebSocket] SkllPlayer WebSocket server running on port ${PORT}`);

    wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Vencord plugin connected');

      // Send current track data immediately on connection
      if (currentTrackData) {
        console.log('[WebSocket] Sending current track to new connection:', currentTrackData.title);
        ws.send(JSON.stringify({
          type: 'track',
          data: currentTrackData
        }));
      } else {
        console.log('[WebSocket] No track playing, sending idle to new connection');
        ws.send(JSON.stringify({
          type: 'idle',
          data: null
        }));
      }

      ws.on('close', () => {
        console.log('[WebSocket] Vencord plugin disconnected');
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
      });
    });

    wss.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`[WebSocket] Port ${PORT} is already in use. WebSocket server not started.`);
      } else {
        console.error('[WebSocket] Server error:', error);
      }
    });

    // Listen for track updates from renderer
    ipcMain.on('ws-track-update', (_event, track: TrackData | null) => {
      console.log('[WebSocket] Received track update from renderer:', track ? track.title : 'null');
      currentTrackData = track;
      broadcastToClients(track);
    });

  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
  }
}

function broadcastToClients(track: TrackData | null): void {
  if (!wss) {
    console.log('[WebSocket] Cannot broadcast - server not initialized');
    return;
  }

  const message = JSON.stringify({
    type: track ? 'track' : 'idle',
    data: track
  });

  const clientCount = wss.clients.size;
  console.log(`[WebSocket] Broadcasting to ${clientCount} clients:`, track ? `${track.title} (playing: ${track.isPlaying})` : 'idle');

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function destroyWebSocketServer(): void {
  if (wss) {
    wss.clients.forEach((client: WebSocket) => {
      client.close();
    });
    wss.close();
    wss = null;
    console.log('WebSocket server closed');
  }
}
