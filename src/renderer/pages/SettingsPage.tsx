import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderOpen,
  Palette,
  RotateCcw,
  Moon,
  Sun,
  Check,
  Monitor,
  Loader2,
  AudioLines,
  Volume2
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useEqualizerStore } from '../stores/equalizerStore';
import { motion } from 'framer-motion';

interface Settings {
  musicFolder: string;
  theme: string;
  volume: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  normalizationEnabled: boolean;
}

export default function SettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({
    musicFolder: '',
    theme: 'Default Dark',
    volume: 1,
    crossfadeEnabled: false,
    crossfadeDuration: 3,
    normalizationEnabled: false,
  });
  const [isScanning, setIsScanning] = useState(false);
  const { availableThemes, loadTheme, themeName } = useTheme();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  const autoSave = useCallback(async (newSettings: Settings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.saveSettings(newSettings);
        }
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }, 500);
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.getSettings();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI) {
        const folder = await window.electronAPI.selectMusicFolder();
        if (folder) {
          const newSettings = { ...settings, musicFolder: folder };
          setSettings(newSettings);

          // Auto-save and scan
          await window.electronAPI.saveSettings(newSettings);
          setIsScanning(true);
          await window.electronAPI.scanMusicFolder(folder);
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setIsScanning(false);
    }
  };

  const handleThemeChange = async (newThemeName: string) => {
    const newSettings = { ...settings, theme: newThemeName };
    setSettings(newSettings);
    await loadTheme(newThemeName);
    autoSave(newSettings);
  };

  const handleResetStats = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      if (window.electronAPI) {
        await window.electronAPI.resetStats();
        alert('Estatísticas resetadas com sucesso!');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  };

  return (
    <div className="space-y-8 animate-slideUp max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-theme-title font-bold text-text-primary">Configurações</h1>
        <p className="text-text-secondary">Personalize seu player</p>
      </div>

      {/* Music folder */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Pasta de Músicas</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Selecione a pasta onde suas músicas estão armazenadas
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={settings.musicFolder}
            readOnly
            placeholder="Nenhuma pasta selecionada"
            className="input flex-1"
          />
          <button
            onClick={handleSelectFolder}
            disabled={isScanning}
            className="btn btn-secondary disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Escaneando...</span>
              </>
            ) : (
              'Selecionar'
            )}
          </button>
        </div>
      </section>

      {/* Theme */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Tema</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Escolha um tema para personalizar a aparência do player
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {availableThemes.map((theme) => (
            <motion.button
              key={theme.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeChange(theme.name)}
              className={`relative p-4 rounded-xl border-2 transition-colors ${
                themeName === theme.name
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-bg-tertiary hover:border-accent-primary/50'
              }`}
            >
              {/* Theme preview */}
              <div className="flex items-center gap-3 mb-2">
                {theme.type === 'dark' ? (
                  <Moon className="w-5 h-5 text-text-secondary" />
                ) : (
                  <Sun className="w-5 h-5 text-text-secondary" />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {theme.name}
                </span>
              </div>

              <p className="text-xs text-text-muted">
                por {theme.author}
              </p>

              {/* Selected indicator */}
              {themeName === theme.name && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <p className="text-text-muted text-xs mt-4">
          Você pode adicionar temas personalizados na pasta "themes" do aplicativo.
          Consulte o README.md para instruções.
        </p>
      </section>

      {/* Crossfade */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <AudioLines className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Crossfade</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Transição suave entre músicas, misturando o final de uma com o início da próxima
        </p>

        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-text-primary">Ativar crossfade</span>
            <button
              onClick={() => {
                const newSettings = { ...settings, crossfadeEnabled: !settings.crossfadeEnabled };
                setSettings(newSettings);
                autoSave(newSettings);
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.crossfadeEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.crossfadeEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Duration slider */}
          <div className={`space-y-2 ${!settings.crossfadeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Duração</span>
              <span className="text-accent-primary font-medium">{settings.crossfadeDuration}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.crossfadeDuration}
              onChange={(e) => {
                const newSettings = { ...settings, crossfadeDuration: parseInt(e.target.value) };
                setSettings(newSettings);
                autoSave(newSettings);
              }}
              className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>1s</span>
              <span>5s</span>
              <span>10s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Volume Normalization */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Normalização de Volume</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Equaliza o volume entre músicas diferentes, evitando que algumas toquem muito alto ou muito baixo
        </p>

        <div className="flex items-center justify-between">
          <span className="text-text-primary">Ativar normalização</span>
          <button
            onClick={() => {
              const newSettings = { ...settings, normalizationEnabled: !settings.normalizationEnabled };
              setSettings(newSettings);
              autoSave(newSettings);
              // Also update the equalizer store
              useEqualizerStore.getState().setNormalization(!settings.normalizationEnabled);
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.normalizationEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.normalizationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-text-muted text-xs mt-3">
          Usa compressão dinâmica para nivelar o volume. Pode afetar ligeiramente a dinâmica da música.
        </p>
      </section>

      {/* Interface customization */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Interface</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Personalize elementos da interface (em breve)
        </p>

        <div className="grid grid-cols-2 gap-4 opacity-50">
          <div className="p-4 rounded-lg bg-bg-tertiary">
            <h3 className="text-sm font-medium text-text-primary mb-2">Posição da Sidebar</h3>
            <p className="text-xs text-text-muted">Configurável via tema</p>
          </div>
          <div className="p-4 rounded-lg bg-bg-tertiary">
            <h3 className="text-sm font-medium text-text-primary mb-2">Posição do Player</h3>
            <p className="text-xs text-text-muted">Configurável via tema</p>
          </div>
        </div>
      </section>

      {/* Reset */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-text-primary">Resetar Dados</h2>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Reseta todas as estatísticas do aplicativo (músicas tocadas, tempo de escuta, etc.)
        </p>

        <button
          onClick={handleResetStats}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resetar Estatísticas</span>
        </button>
      </section>

      {/* About */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Sobre</h2>

        <div className="space-y-2 text-sm">
          <p className="text-text-secondary">
            <span className="text-text-primary font-medium">SkllPlayer</span> v0.1 Build Test
          </p>
          <p className="text-text-secondary">
            Criado por <span className="text-accent-primary">SkellBR</span>
          </p>
          <p className="text-text-muted">
            Inspirado no BlackPlayer para Android
          </p>
        </div>
      </section>
    </div>
  );
}
