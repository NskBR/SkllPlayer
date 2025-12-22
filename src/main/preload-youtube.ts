import { contextBridge, ipcRenderer } from 'electron';

// Expose window control methods for YouTube preview
contextBridge.exposeInMainWorld('youtubePreview', {
  minimize: () => ipcRenderer.send('youtube-preview-minimize'),
  maximize: () => ipcRenderer.send('youtube-preview-maximize'),
  close: () => ipcRenderer.send('youtube-preview-close'),
});
