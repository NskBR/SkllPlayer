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
  ExternalLink
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
  title: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  error?: string;
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

export default function DownloaderPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [format, setFormat] = useState<AudioFormat>('mp3-320');
  const [downloadFolder, setDownloadFolder] = useState('');
  const [autoAddToLibrary, setAutoAddToLibrary] = useState(true);
  const [downloadThumbnail, setDownloadThumbnail] = useState(true);
  const [autoMetadata, setAutoMetadata] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [ytdlpStatus, setYtdlpStatus] = useState<YtDlpStatus | null>(null);
  const [isInstallingYtdlp, setIsInstallingYtdlp] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Check yt-dlp status on mount
  useEffect(() => {
    checkYtDlpStatus();
  }, []);

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
        setSearchError('yt-dlp não está instalado. Clique em "Instalar yt-dlp" para continuar.');
      } else {
        setSearchError(`Erro na busca: ${error.message || 'Erro desconhecido'}`);
      }
    }
    setIsSearching(false);
  };

  const handleDownload = async (result: SearchResult) => {
    const downloadId = `${result.id}-${Date.now()}`;

    // Add to downloads list
    setDownloads((prev) => [
      {
        id: downloadId,
        title: result.title,
        status: 'downloading',
        progress: 0,
        speed: '0 KB/s',
        eta: 'Calculando...',
      },
      ...prev,
    ]);

    try {
      if (window.electronAPI) {
        // Set up progress listener
        window.electronAPI.onDownloadProgress((progress) => {
          setDownloads((prev) =>
            prev.map((d) =>
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
        await window.electronAPI.downloadTrack(result.id, format);

        // Mark as completed
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? { ...d, status: 'completed', progress: 100 }
              : d
          )
        );
      } else {
        // Mock download for development
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === downloadId
                ? {
                    ...d,
                    progress: i,
                    speed: `${Math.random() * 5 + 1} MB/s`,
                    eta: `${Math.ceil((100 - i) / 10)}s`,
                  }
                : d
            )
          );
        }

        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? { ...d, status: 'completed', progress: 100 }
              : d
          )
        );
      }
    } catch (error) {
      setDownloads((prev) =>
        prev.map((d) =>
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
      setDownloads((prev) => prev.filter((d) => d.id !== id));
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
    setDownloads((prev) => prev.filter((d) => d.status === 'downloading'));
  };

  const handlePreview = (result: SearchResult) => {
    // Open YouTube video in default browser
    const url = `https://www.youtube.com/watch?v=${result.id}`;
    window.open(url, '_blank');
  };

  // Generate high quality thumbnail URL
  const getThumbnailUrl = (result: SearchResult): string => {
    // If we already have a thumbnail, use it
    if (result.thumbnail && result.thumbnail.length > 0) {
      return result.thumbnail;
    }
    // Fallback to YouTube thumbnail URL format
    return `https://i.ytimg.com/vi/${result.id}/mqdefault.jpg`;
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Download</h1>
          <p className="text-text-secondary">Baixe músicas do YouTube</p>
        </div>

        <div className="flex items-center gap-2">
          {/* yt-dlp & ffmpeg status */}
          {ytdlpStatus && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-tertiary rounded-lg">
              {/* yt-dlp status */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${ytdlpStatus.installed ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-text-secondary">
                  {ytdlpStatus.installed ? `yt-dlp` : 'yt-dlp'}
                </span>
              </div>

              {/* ffmpeg status */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${ytdlpStatus.ffmpegInstalled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-xs text-text-secondary">ffmpeg</span>
              </div>

              {(!ytdlpStatus.installed || !ytdlpStatus.ffmpegInstalled) && (
                <button
                  onClick={handleInstallYtDlp}
                  disabled={isInstallingYtdlp}
                  className="ml-1 px-2 py-0.5 text-xs bg-accent-primary hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
                >
                  {isInstallingYtdlp ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Instalar'
                  )}
                </button>
              )}
              <button
                onClick={checkYtDlpStatus}
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
              showSettings
                ? 'bg-accent-primary text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
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
            className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary overflow-hidden"
          >
            <h3 className="text-lg font-medium text-text-primary mb-4">
              Configurações de Download
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Format */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Formato
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as AudioFormat)}
                  className="input"
                >
                  {formatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Pasta de destino
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={downloadFolder}
                    readOnly
                    placeholder="Usar pasta padrão"
                    className="input flex-1"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="btn btn-secondary"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAddToLibrary}
                  onChange={(e) => setAutoAddToLibrary(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-text-muted checked:border-accent-primary checked:bg-accent-primary"
                />
                <span className="text-sm text-text-secondary">
                  Adicionar à biblioteca automaticamente
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadThumbnail}
                  onChange={(e) => setDownloadThumbnail(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-text-muted checked:border-accent-primary checked:bg-accent-primary"
                />
                <span className="text-sm text-text-secondary">
                  Baixar thumbnail como capa
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMetadata}
                  onChange={(e) => setAutoMetadata(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-text-muted checked:border-accent-primary checked:bg-accent-primary"
                />
                <span className="text-sm text-text-secondary">
                  Preencher metadados automaticamente
                </span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar música ou colar link do YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input w-full"
            />
          </div>
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

        {/* Search error */}
        {searchError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{searchError}</p>
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Resultados
            </h3>
            {searchResults.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-bg-tertiary hover:bg-accent-primary/10 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                  <img
                    src={getThumbnailUrl(result)}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // On error, try fallback URL
                      const target = e.target as HTMLImageElement;
                      const fallbackUrl = `https://i.ytimg.com/vi/${result.id}/hqdefault.jpg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      } else {
                        // If fallback also fails, hide image
                        target.style.display = 'none';
                      }
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {result.title}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {result.artist} • {result.duration}
                  </p>
                </div>

                {/* Preview button */}
                <button
                  onClick={() => handlePreview(result)}
                  className="p-2 rounded-lg bg-bg-primary hover:bg-accent-primary/20 text-text-secondary hover:text-accent-primary transition-colors"
                  title="Ouvir no YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* Download button */}
                <button
                  onClick={() => handleDownload(result)}
                  className="p-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Downloads */}
      {downloads.length > 0 && (
        <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Downloads</h3>
            <button
              onClick={clearCompleted}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Limpar concluídos
            </button>
          </div>

          <div className="space-y-3">
            {downloads.map((download) => (
              <motion.div
                key={download.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-lg bg-bg-tertiary"
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {download.status === 'downloading' && (
                      <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
                    )}
                    {download.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {download.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">
                      {download.title}
                    </h4>
                    {download.status === 'downloading' && (
                      <p className="text-xs text-text-secondary">
                        {download.speed} • Resta: {download.eta}
                      </p>
                    )}
                    {download.status === 'completed' && (
                      <p className="text-xs text-green-500">
                        Adicionado à biblioteca
                      </p>
                    )}
                    {download.status === 'error' && (
                      <p className="text-xs text-red-500">{download.error}</p>
                    )}
                  </div>

                  {/* Progress or cancel */}
                  {download.status === 'downloading' && (
                    <>
                      <span className="text-sm text-text-secondary">
                        {download.progress}%
                      </span>
                      <button
                        onClick={() => handleCancelDownload(download.id)}
                        className="p-1 rounded hover:bg-bg-primary transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4 text-text-secondary hover:text-red-500" />
                      </button>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {download.status === 'downloading' && (
                  <div className="mt-3 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${download.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {searchResults.length === 0 && downloads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Download className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Pronto para baixar
          </h3>
          <p className="text-text-secondary max-w-md">
            Busque uma música ou cole um link do YouTube para começar a baixar
          </p>
        </div>
      )}

      {/* Info notice */}
      <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-4">
        <p className="text-sm text-text-secondary">
          <strong className="text-accent-primary">Nota:</strong> O recurso de download
          utiliza o yt-dlp para baixar áudio do YouTube. Certifique-se de respeitar
          os direitos autorais e as leis locais.
        </p>
      </div>
    </div>
  );
}
