import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Folder,
  RefreshCw,
  Play,
  Clock,
  FolderOpen,
  Trash2,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

interface DownloadItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
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

type AudioFormat = 'mp3-320' | 'mp3-192' | 'mp3-128' | 'flac' | 'm4a' | 'ogg';

const formatOptions: { value: AudioFormat; label: string }[] = [
  { value: 'mp3-320', label: 'MP3 320kbps' },
  { value: 'mp3-192', label: 'MP3 192kbps' },
  { value: 'mp3-128', label: 'MP3 128kbps' },
  { value: 'flac', label: 'FLAC (Lossless)' },
  { value: 'm4a', label: 'M4A (AAC)' },
  { value: 'ogg', label: 'OGG Vorbis' },
];

interface YtDlpStatus {
  installed: boolean;
  version: string | null;
  path: string;
  ffmpegInstalled: boolean;
  ffmpegPath: string;
}

interface UBlockStatus {
  installed: boolean;
  path: string;
}

// Format elapsed time
function formatElapsedTime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DownloaderPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [format, setFormat] = useState<AudioFormat>('mp3-320');
  const [downloadFolder, setDownloadFolder] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [ytdlpStatus, setYtdlpStatus] = useState<YtDlpStatus | null>(null);
  const [isInstallingYtdlp, setIsInstallingYtdlp] = useState(false);
  const [uBlockStatus, setUBlockStatus] = useState<UBlockStatus | null>(null);
  const [isInstallingUBlock, setIsInstallingUBlock] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [, setTick] = useState(0); // For elapsed time updates
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);

  // Check yt-dlp status and load settings on mount
  useEffect(() => {
    checkYtDlpStatus();
    checkUBlockStatus();
    loadSettings();
    loadDownloadHistory();
  }, []);

  const loadDownloadHistory = async () => {
    try {
      if (window.electronAPI?.getDownloadHistory) {
        const history = await window.electronAPI.getDownloadHistory();
        setDownloadHistory(history);
      }
    } catch (error) {
      console.error('Error loading download history:', error);
    }
  };

  // Update elapsed time every second for active downloads
  useEffect(() => {
    const hasActiveDownloads = downloads.some(d => d.status === 'downloading');
    if (!hasActiveDownloads) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [downloads]);

  const loadSettings = async () => {
    try {
      if (window.electronAPI?.getSettings) {
        const settings = await window.electronAPI.getSettings();
        if (settings.musicFolder) {
          setDownloadFolder(settings.musicFolder);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkYtDlpStatus = async () => {
    try {
      if (window.electronAPI?.getYtDlpStatus) {
        const status = await window.electronAPI.getYtDlpStatus();
        setYtdlpStatus(status);
      }
    } catch (error) {
      console.error('Error checking yt-dlp status:', error);
    }
  };

  const handleInstallYtDlp = async () => {
    setIsInstallingYtdlp(true);
    try {
      if (window.electronAPI?.installYtDlp) {
        await window.electronAPI.installYtDlp();
        await checkYtDlpStatus();
      }
    } catch (error) {
      console.error('Error installing yt-dlp:', error);
    }
    setIsInstallingYtdlp(false);
  };

  const checkUBlockStatus = async () => {
    try {
      if (window.electronAPI?.getUBlockStatus) {
        const status = await window.electronAPI.getUBlockStatus();
        setUBlockStatus(status);
      }
    } catch (error) {
      console.error('Error checking uBlock status:', error);
    }
  };

  const handleInstallUBlock = async () => {
    setIsInstallingUBlock(true);
    try {
      if (window.electronAPI?.installUBlock) {
        await window.electronAPI.installUBlock();
        await checkUBlockStatus();
      }
    } catch (error) {
      console.error('Error installing uBlock:', error);
    }
    setIsInstallingUBlock(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      if (window.electronAPI) {
        const results = await window.electronAPI.searchYouTube(searchQuery);
        setSearchResults(results);
        if (results.length === 0) {
          setSearchError('Nenhum resultado encontrado');
        }
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      if (error.message?.includes('yt-dlp not installed')) {
        setSearchError('yt-dlp não está instalado. Clique em "Instalar" para continuar.');
      } else {
        setSearchError(`Erro na busca: ${error.message || 'Erro desconhecido'}`);
      }
    }
    setIsSearching(false);
  };

  const isDownloading = (videoId: string) => {
    return downloads.some(d => d.videoId === videoId && d.status === 'downloading');
  };

  const handleDownload = async (result: SearchResult) => {
    if (isDownloading(result.id)) return;

    const downloadId = `${result.id}-${Date.now()}`;
    const thumbnailUrl = getThumbnailUrl(result);

    // Add to downloads list
    const newDownload: DownloadItem = {
      id: downloadId,
      videoId: result.id,
      title: result.title,
      artist: result.artist,
      thumbnail: thumbnailUrl,
      status: 'downloading',
      progress: 0,
      speed: '0 KB/s',
      eta: 'Calculando...',
      startedAt: Date.now(),
    };

    setDownloads(prev => [newDownload, ...prev]);

    try {
      if (window.electronAPI) {
        // Set up progress listener
        window.electronAPI.onDownloadProgress((progress) => {
          setDownloads(prev =>
            prev.map(d =>
              d.id === downloadId
                ? {
                    ...d,
                    progress: progress.percent,
                    speed: progress.speed,
                    eta: progress.eta,
                  }
                : d
            )
          );
        });

        // Start download
        const filePath = await window.electronAPI.downloadTrack(result.id, format, {
          title: result.title,
          artist: result.artist,
          thumbnail: thumbnailUrl,
        });

        // Mark as completed
        setDownloads(prev =>
          prev.map(d =>
            d.id === downloadId
              ? { ...d, status: 'completed', progress: 100, completedAt: Date.now() }
              : d
          )
        );

        // Add to download history
        if (filePath && window.electronAPI.addToDownloadHistory) {
          const historyItem: DownloadHistoryItem = {
            id: downloadId,
            videoId: result.id,
            title: result.title,
            artist: result.artist,
            thumbnail: thumbnailUrl,
            format: format,
            downloadedAt: new Date().toISOString(),
            filePath: filePath,
          };
          const updatedHistory = await window.electronAPI.addToDownloadHistory(historyItem);
          setDownloadHistory(updatedHistory);
        }
      }
    } catch (error) {
      setDownloads(prev =>
        prev.map(d =>
          d.id === downloadId
            ? {
                ...d,
                status: 'error',
                error: 'Falha no download. Tente novamente.',
              }
            : d
        )
      );
    }
  };

  const handleCancelDownload = async (id: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.cancelDownload(id);
      }
      setDownloads(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error canceling download:', error);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI) {
        const folder = await window.electronAPI.selectMusicFolder();
        if (folder) {
          setDownloadFolder(folder);
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const clearCompleted = () => {
    setDownloads(prev => prev.filter(d => d.status === 'downloading'));
  };

  const clearAll = () => {
    setDownloads(prev => prev.filter(d => d.status === 'downloading'));
  };

  const clearHistory = async () => {
    try {
      if (window.electronAPI?.clearDownloadHistory) {
        await window.electronAPI.clearDownloadHistory();
        setDownloadHistory([]);
      }
    } catch (error) {
      console.error('Error clearing download history:', error);
    }
  };

  const formatHistoryDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handlePreview = (result: SearchResult) => {
    if (window.electronAPI?.openYouTubePreview) {
      window.electronAPI.openYouTubePreview(result.id, result.title);
    }
  };

  const getThumbnailUrl = (result: SearchResult): string => {
    if (result.thumbnail && result.thumbnail.length > 0) {
      return result.thumbnail;
    }
    return `https://i.ytimg.com/vi/${result.id}/mqdefault.jpg`;
  };

  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const errorDownloads = downloads.filter(d => d.status === 'error');

  return (
    <div className="h-full flex flex-col gap-4 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Download</h1>
          <p className="text-text-secondary">Baixe músicas do YouTube</p>
        </div>

        <div className="flex items-center gap-2">
          {/* yt-dlp, ffmpeg & uBlock status */}
          {ytdlpStatus && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${ytdlpStatus.installed ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-text-secondary">yt-dlp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${ytdlpStatus.ffmpegInstalled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-xs text-text-secondary">ffmpeg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${uBlockStatus?.installed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-xs text-text-secondary">uBlock</span>
              </div>
              {(!ytdlpStatus.installed || !ytdlpStatus.ffmpegInstalled) && (
                <button
                  onClick={handleInstallYtDlp}
                  disabled={isInstallingYtdlp}
                  className="ml-1 px-2 py-0.5 text-xs bg-accent-primary hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
                  title="Instalar yt-dlp e ffmpeg"
                >
                  {isInstallingYtdlp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'yt-dlp'}
                </button>
              )}
              {uBlockStatus && !uBlockStatus.installed && (
                <button
                  onClick={handleInstallUBlock}
                  disabled={isInstallingUBlock}
                  className="px-2 py-0.5 text-xs bg-accent-primary hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
                  title="Instalar uBlock Origin (bloqueador de anúncios)"
                >
                  {isInstallingUBlock ? <Loader2 className="w-3 h-3 animate-spin" /> : 'uBlock'}
                </button>
              )}
              <button
                onClick={() => { checkYtDlpStatus(); checkUBlockStatus(); }}
                className="p-0.5 text-text-muted hover:text-text-secondary transition-colors"
                title="Verificar novamente"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-bg-secondary rounded-xl p-4 border border-bg-tertiary overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">Formato</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as AudioFormat)}
                  className="input w-full"
                >
                  {formatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary mb-1">Pasta de destino</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={downloadFolder}
                    readOnly
                    placeholder="Pasta padrão"
                    className="input flex-1 text-sm"
                  />
                  <button onClick={handleSelectFolder} className="btn btn-secondary">
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - 2 columns */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left column - Search */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search bar */}
          <div className="bg-bg-secondary rounded-xl p-4 border border-bg-tertiary flex-shrink-0">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Buscar música ou colar link do YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input flex-1"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Buscar</span>
                  </>
                )}
              </button>
            </div>

            {searchError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{searchError}</p>
              </div>
            )}
          </div>

          {/* Search results */}
          <div className="flex-1 mt-4 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => {
                  const downloading = isDownloading(result.id);
                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-4 p-3 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-accent-primary/30 transition-colors ${
                        downloading ? 'opacity-70' : ''
                      }`}
                    >
                      {/* Thumbnail with loading overlay */}
                      <div className="w-12 h-12 rounded bg-bg-tertiary flex-shrink-0 overflow-hidden relative">
                        <img
                          src={getThumbnailUrl(result)}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`;
                          }}
                        />
                        {downloading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-text-primary truncate">{result.title}</h4>
                        <p className="text-xs text-text-secondary">{result.artist} • {result.duration}</p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handlePreview(result)}
                        className="p-2 rounded-lg bg-bg-tertiary hover:bg-accent-primary/20 text-text-secondary hover:text-accent-primary transition-colors"
                        title="Pré-visualizar"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownload(result)}
                        disabled={downloading}
                        className="p-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                        title={downloading ? 'Baixando...' : 'Baixar'}
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Search className="w-12 h-12 text-text-muted mb-3" />
                <p className="text-text-secondary">Busque uma música para começar</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Download Manager */}
        <div className="w-80 flex-shrink-0 bg-bg-secondary rounded-xl border border-bg-tertiary flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-bg-tertiary">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-accent-primary" />
                <span className="text-sm font-medium text-text-primary">Downloads</span>
              </div>
              {downloadHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Download folder info */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="truncate">{downloadFolder || 'Pasta padrão'}</span>
            </div>
          </div>

          {/* Downloads list - unified view */}
          <div className="flex-1 overflow-y-auto p-2">
            {downloads.length === 0 && downloadHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Music className="w-10 h-10 text-text-muted mb-2" />
                <p className="text-xs text-text-muted">Nenhum download ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Active downloads */}
                {activeDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="p-3 rounded-lg bg-bg-tertiary"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-bg-primary flex-shrink-0 overflow-hidden">
                        <img
                          src={download.thumbnail}
                          alt={download.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-text-primary truncate">{download.title}</h4>
                        <p className="text-xs text-text-muted truncate">{download.artist}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-accent-primary">
                          <Clock className="w-3 h-3" />
                          <span>{formatElapsedTime(download.startedAt)}</span>
                          <span className="text-text-muted">•</span>
                          <span>{download.speed}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelDownload(download.id)}
                        className="p-1 rounded hover:bg-bg-primary transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4 text-text-muted hover:text-red-500" />
                      </button>
                    </div>
                    <div className="mt-2 h-1 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-primary"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-text-muted">
                      <span>{download.progress}%</span>
                      <span>ETA: {download.eta}</span>
                    </div>
                  </div>
                ))}

                {/* Completed downloads (session) */}
                {completedDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-text-primary truncate flex-1">{download.title}</span>
                  </div>
                ))}

                {/* Error downloads */}
                {errorDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-text-primary truncate flex-1">{download.title}</span>
                    <button
                      onClick={() => setDownloads(prev => prev.filter(d => d.id !== download.id))}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}

                {/* Divider between session and history */}
                {(downloads.length > 0 && downloadHistory.length > 0) && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-bg-tertiary" />
                    <span className="text-[10px] text-text-muted uppercase">Histórico</span>
                    <div className="flex-1 h-px bg-bg-tertiary" />
                  </div>
                )}

                {/* History items */}
                {downloadHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-bg-tertiary flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded bg-bg-primary flex-shrink-0 overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-text-primary truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        <span>{item.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatHistoryDate(item.downloadedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-3 border-t border-bg-tertiary text-xs text-text-muted text-center">
            {activeDownloads.length > 0 && (
              <span className="text-accent-primary">{activeDownloads.length} baixando</span>
            )}
            {activeDownloads.length > 0 && (completedDownloads.length > 0 || downloadHistory.length > 0) && ' • '}
            {completedDownloads.length > 0 && (
              <span className="text-green-500">{completedDownloads.length} concluídos</span>
            )}
            {completedDownloads.length > 0 && downloadHistory.length > 0 && ' • '}
            {downloadHistory.length > 0 && (
              <span>{downloadHistory.length} no histórico</span>
            )}
            {activeDownloads.length === 0 && completedDownloads.length === 0 && downloadHistory.length === 0 && 'Pronto para baixar'}
          </div>
        </div>
      </div>
    </div>
  );
}
