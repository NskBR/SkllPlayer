import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Music, Loader2, CheckCircle, FolderX } from 'lucide-react';
import Logo from './Logo';

interface WelcomeModalProps {
  onComplete: () => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'analyzing' | 'scanning' | 'done' | 'empty'>('idle');
  const [folderInfo, setFolderInfo] = useState<{ audioFiles: number; totalSizeGB: string } | null>(null);
  const [tracksFound, setTracksFound] = useState(0);
  const [selectedEmptyFolder, setSelectedEmptyFolder] = useState<string | null>(null);

  // Check if library is empty on mount
  useEffect(() => {
    const checkLibrary = async () => {
      if (window.electronAPI) {
        try {
          const tracks = await window.electronAPI.getTracks();
          if (!tracks || tracks.length === 0) {
            setIsOpen(true);
          } else {
            // Library already has tracks, skip welcome
            onComplete();
          }
        } catch (err) {
          console.error('Error checking library:', err);
        }
      }
    };
    checkLibrary();
  }, [onComplete]);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;

    try {
      const folderPath = await window.electronAPI.selectMusicFolder();
      if (!folderPath) return;

      setIsScanning(true);
      setScanStatus('analyzing');

      // Analyze folder first
      const analysis = await window.electronAPI.analyzeFolder(folderPath);
      setFolderInfo({
        audioFiles: analysis.audioFiles,
        totalSizeGB: analysis.totalSizeGB
      });

      // If folder has audio files, proceed with scanning
      if (analysis.audioFiles > 0) {
        setScanStatus('scanning');
        const tracks = await window.electronAPI.scanMusicFolder(folderPath);
        setTracksFound(tracks.length);
        setScanStatus('done');

        // Close modal after a short delay
        setTimeout(() => {
          setIsOpen(false);
          onComplete();
        }, 1500);
      } else {
        // Empty folder - save path and show friendly message
        setSelectedEmptyFolder(folderPath);
        setScanStatus('empty');
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error scanning folder:', err);
      // On error, just reset to idle so user can try again
      setScanStatus('idle');
      setIsScanning(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleTryAgain = () => {
    setScanStatus('idle');
    setSelectedEmptyFolder(null);
  };

  const handleUseEmptyFolder = async () => {
    if (!window.electronAPI || !selectedEmptyFolder) return;

    try {
      // Save the empty folder as the music folder
      const currentSettings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({
        ...currentSettings,
        musicFolder: selectedEmptyFolder
      });

      setIsOpen(false);
      onComplete();
    } catch (err) {
      console.error('Error saving folder:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-bg-secondary rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-bg-tertiary"
        >
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-accent-primary/10 shadow-lg shadow-accent-primary/20"
            >
              <Logo size={80} />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Bem-vindo ao SkllPlayer
            </h1>
            <p className="text-text-secondary">
              Vamos configurar sua biblioteca de músicas
            </p>
          </div>

          {/* Status Content */}
          <div className="mb-6">
            {scanStatus === 'idle' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <Music className="w-8 h-8 text-accent-primary" />
                </div>
                <p className="text-text-secondary mb-4">
                  Selecione a pasta onde estão suas músicas para começar.
                </p>
              </div>
            )}

            {scanStatus === 'analyzing' && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-accent-primary animate-spin" />
                <p className="text-text-secondary">Analisando pasta...</p>
              </div>
            )}

            {scanStatus === 'scanning' && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-accent-primary animate-spin" />
                <p className="text-text-primary font-medium mb-1">
                  Escaneando {folderInfo?.audioFiles} arquivos...
                </p>
                <p className="text-text-secondary text-sm">
                  Isso pode levar alguns segundos
                </p>
              </div>
            )}

            {scanStatus === 'done' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                </motion.div>
                <p className="text-text-primary font-medium mb-1">
                  {tracksFound} músicas adicionadas!
                </p>
                <p className="text-text-secondary text-sm">
                  Sua biblioteca está pronta
                </p>
              </div>
            )}

            {scanStatus === 'empty' && (
              <div className="text-center">
                <FolderX className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-text-primary font-medium mb-1">
                  Pasta vazia
                </p>
                <p className="text-text-secondary text-sm mb-4">
                  A pasta selecionada não contém músicas ainda. Você pode usá-la mesmo assim e adicionar músicas depois, ou selecionar outra pasta.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {scanStatus === 'idle' && (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectFolder}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
                Selecionar Pasta de Músicas
              </motion.button>

              <button
                onClick={handleSkip}
                className="w-full px-6 py-3 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Pular por agora
              </button>
            </div>
          )}

          {scanStatus === 'empty' && (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUseEmptyFolder}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Usar Esta Pasta
              </motion.button>

              <button
                onClick={handleTryAgain}
                className="w-full px-6 py-3 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Selecionar Outra Pasta
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
