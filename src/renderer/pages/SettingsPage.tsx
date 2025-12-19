import { useState, useEffect } from 'react';
import {
  FolderOpen,
  Palette,
  RotateCcw,
  Save,
  Moon,
  Sun,
  Check,
  Monitor
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';

interface Settings {
  musicFolder: string;
  theme: string;
  volume: number;
}

export default function SettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({
    musicFolder: '',
    theme: 'Default Dark',
    volume: 1,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { availableThemes, loadTheme, themeName } = useTheme();

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
          setSettings((prev) => ({ ...prev, musicFolder: folder }));
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(settings);

        // Scan music folder if set
        if (settings.musicFolder) {
          await window.electronAPI.scanMusicFolder(settings.musicFolder);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    setIsSaving(false);
  };

  const handleThemeChange = async (themeName: string) => {
    setSettings((prev) => ({ ...prev, theme: themeName }));
    await loadTheme(themeName);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-title font-bold text-text-primary">Configurações</h1>
          <p className="text-text-secondary">Personalize seu player</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
        </button>
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
            className="btn btn-secondary"
          >
            Selecionar
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
