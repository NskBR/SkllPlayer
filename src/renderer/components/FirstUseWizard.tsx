import { useState } from 'react';
import { FolderOpen, Music, Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface FirstUseWizardProps {
  onComplete: () => void;
}

export default function FirstUseWizard({ onComplete }: FirstUseWizardProps): JSX.Element {
  const [step, setStep] = useState<'welcome' | 'folder' | 'scanning' | 'done'>('welcome');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [trackCount, setTrackCount] = useState(0);

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI) {
        const folder = await window.electronAPI.selectMusicFolder();
        if (folder) {
          setSelectedFolder(folder);
          setStep('scanning');

          // Save settings with the new folder
          const settings = await window.electronAPI.getSettings();
          await window.electronAPI.saveSettings({
            ...settings,
            musicFolder: folder,
          });

          // Scan the folder
          await window.electronAPI.scanMusicFolder(folder);

          // Get track count
          const tracks = await window.electronAPI.getTracks();
          setTrackCount(tracks.length);

          setStep('done');
        }
      }
    } catch (error) {
      console.error('Error in first use wizard:', error);
      setStep('folder');
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bg-secondary rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-bg-tertiary animate-slideUp">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-accent-primary/30">
              <img
                src="/Icon/Icone.png"
                alt="SkllPlayer"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Bem-vindo ao SkllPlayer!
            </h1>

            <p className="text-text-secondary mb-8">
              Seu novo player de música pessoal. Vamos configurar tudo para você começar a ouvir suas músicas.
            </p>

            <button
              onClick={() => setStep('folder')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              <span>Começar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Folder Selection Step */}
        {step === 'folder' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-accent-primary" />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-2">
              Onde estão suas músicas?
            </h2>

            <p className="text-text-secondary mb-6">
              Selecione a pasta onde suas músicas estão armazenadas. O SkllPlayer vai escanear e organizar tudo para você.
            </p>

            {selectedFolder && (
              <div className="mb-4 p-3 bg-bg-tertiary rounded-lg text-left">
                <p className="text-xs text-text-muted mb-1">Pasta selecionada:</p>
                <p className="text-sm text-text-primary truncate">{selectedFolder}</p>
              </div>
            )}

            <button
              onClick={handleSelectFolder}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Selecionar Pasta</span>
            </button>

            <p className="text-xs text-text-muted mt-4">
              Formatos suportados: MP3, FLAC, WAV, OGG, M4A, AAC, OPUS
            </p>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-2">
              Escaneando suas músicas...
            </h2>

            <p className="text-text-secondary mb-4">
              Aguarde enquanto organizamos sua biblioteca musical.
            </p>

            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-sm text-text-primary truncate">{selectedFolder}</p>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-green-500" />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-2">
              Tudo pronto!
            </h2>

            <p className="text-text-secondary mb-6">
              Encontramos <span className="text-accent-primary font-semibold">{trackCount}</span> músicas na sua biblioteca.
            </p>

            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-bg-tertiary rounded-lg">
              <Music className="w-5 h-5 text-accent-primary" />
              <span className="text-text-primary">{trackCount} faixas prontas para tocar</span>
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              <span>Começar a Ouvir</span>
              <Music className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
