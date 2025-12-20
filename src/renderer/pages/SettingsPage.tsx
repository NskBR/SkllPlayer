import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderOpen,
  Palette,
  RotateCcw,
  Moon,
  Sun,
  Check,
  Loader2,
  AudioLines,
  Volume2,
  Layout,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Paintbrush,
  RefreshCcw,
  Sparkles,
  Wand2,
  X,
  MinusSquare,
  HelpCircle,
  Music,
  Settings,
  Info,
  Trash2
} from 'lucide-react';
import type { GradientConfig, ColorOverrides } from '../types/electron';
import { useTheme } from '../hooks/useTheme';
import { useEqualizerStore } from '../stores/equalizerStore';
import { motion } from 'framer-motion';

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate a full color palette from a single base color
function generateColorPalette(baseColor: string, accentColor: string): ColorOverrides {
  const base = hexToHsl(baseColor);
  const isDark = base.l < 50;

  const bgPrimary = hslToHex(base.h, base.s, base.l);
  const bgSecondary = hslToHex(base.h, base.s, isDark ? base.l + 5 : base.l - 5);
  const bgTertiary = hslToHex(base.h, base.s, isDark ? base.l + 10 : base.l - 10);

  const sidebarBg = hslToHex(base.h, base.s, isDark ? base.l - 3 : base.l + 3);
  const sidebarHover = hslToHex(base.h, base.s, isDark ? base.l + 8 : base.l - 8);

  const textPrimary = isDark ? '#ffffff' : '#1a1a1f';
  const textSecondary = isDark
    ? hslToHex(base.h, Math.min(base.s, 20), 70)
    : hslToHex(base.h, Math.min(base.s, 20), 35);
  const textMuted = isDark
    ? hslToHex(base.h, Math.min(base.s, 15), 45)
    : hslToHex(base.h, Math.min(base.s, 15), 60);

  const playerProgressBg = hslToHex(base.h, base.s, isDark ? base.l + 15 : base.l - 15);

  const accent = hexToHsl(accentColor);
  const accentHover = hslToHex(accent.h, accent.s, accent.l - 10);
  const accentActive = hslToHex(accent.h, accent.s, accent.l - 20);

  return {
    background: { primary: bgPrimary, secondary: bgSecondary, tertiary: bgTertiary },
    text: { primary: textPrimary, secondary: textSecondary, muted: textMuted },
    accent: { primary: accentColor, hover: accentHover, active: accentActive },
    player: { progress: accentColor, progressBackground: playerProgressBg, controls: textPrimary },
    sidebar: { background: sidebarBg, itemHover: sidebarHover, itemActive: accentColor },
  };
}

interface Settings {
  musicFolder: string;
  theme: string;
  volume: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  normalizationEnabled: boolean;
}

type SettingsCategory = 'biblioteca' | 'aparencia' | 'layout' | 'audio' | 'comportamento' | 'dados' | 'sobre';

const categories: { id: SettingsCategory; label: string; icon: typeof FolderOpen }[] = [
  { id: 'biblioteca', label: 'Biblioteca', icon: Music },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'audio', label: 'Áudio', icon: AudioLines },
  { id: 'comportamento', label: 'Comportamento', icon: Settings },
  { id: 'dados', label: 'Dados', icon: Trash2 },
  { id: 'sobre', label: 'Sobre', icon: Info },
];

export default function SettingsPage(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('biblioteca');
  const [settings, setSettings] = useState<Settings>({
    musicFolder: '',
    theme: 'Default Dark',
    volume: 1,
    crossfadeEnabled: false,
    crossfadeDuration: 3,
    normalizationEnabled: false,
  });
  const [isScanning, setIsScanning] = useState(false);
  const {
    availableThemes,
    loadTheme,
    refreshThemes,
    themeName,
    layout,
    colors,
    layoutOverrides,
    colorOverrides,
    updateLayoutOverride,
    updateColorOverride,
    resetLayoutOverrides,
    resetColorOverrides
  } = useTheme();
  const [isRefreshingThemes, setIsRefreshingThemes] = useState(false);
  const [colorMode, setColorMode] = useState<'manual' | 'auto'>('manual');
  const [autoBaseColor, setAutoBaseColor] = useState('#0a0a0f');
  const [autoAccentColor, setAutoAccentColor] = useState('#8b5cf6');
  const [closeBehavior, setCloseBehavior] = useState<'ask' | 'tray' | 'close'>('ask');
  const [discordRichPresence, setDiscordRichPresence] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setDiscordRichPresence(data.discordRichPresence ?? true);
        const behavior = await window.electronAPI.getCloseBehavior();
        setCloseBehavior(behavior);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleDiscordRichPresenceChange = (enabled: boolean) => {
    setDiscordRichPresence(enabled);
    const newSettings = { ...settings, discordRichPresence: enabled };
    setSettings(newSettings as any);
    autoSave(newSettings as any);
  };

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI) {
        const folder = await window.electronAPI.selectMusicFolder();
        if (folder) {
          const newSettings = { ...settings, musicFolder: folder };
          setSettings(newSettings);
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

  // Render content based on active category
  const renderContent = () => {
    switch (activeCategory) {
      case 'biblioteca':
        return <BibliotecaSection
          settings={settings}
          isScanning={isScanning}
          onSelectFolder={handleSelectFolder}
        />;
      case 'aparencia':
        return <AparenciaSection
          settings={settings}
          availableThemes={availableThemes}
          themeName={themeName}
          colors={colors}
          colorOverrides={colorOverrides}
          colorMode={colorMode}
          autoBaseColor={autoBaseColor}
          autoAccentColor={autoAccentColor}
          isRefreshingThemes={isRefreshingThemes}
          onThemeChange={handleThemeChange}
          onRefreshThemes={async () => {
            setIsRefreshingThemes(true);
            await refreshThemes();
            setIsRefreshingThemes(false);
          }}
          onColorModeChange={setColorMode}
          onAutoBaseColorChange={setAutoBaseColor}
          onAutoAccentColorChange={setAutoAccentColor}
          updateColorOverride={updateColorOverride}
          resetColorOverrides={() => {
            resetColorOverrides();
            setColorMode('manual');
          }}
        />;
      case 'layout':
        return <LayoutSection
          layout={layout}
          layoutOverrides={layoutOverrides}
          updateLayoutOverride={updateLayoutOverride}
          resetLayoutOverrides={resetLayoutOverrides}
        />;
      case 'audio':
        return <AudioSection
          settings={settings}
          setSettings={setSettings}
          autoSave={autoSave}
        />;
      case 'comportamento':
        return <ComportamentoSection
          closeBehavior={closeBehavior}
          setCloseBehavior={setCloseBehavior}
          discordRichPresence={discordRichPresence}
          setDiscordRichPresence={handleDiscordRichPresenceChange}
        />;
      case 'dados':
        return <DadosSection onResetStats={handleResetStats} />;
      case 'sobre':
        return <SobreSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full -m-6">
      {/* Sidebar Menu */}
      <div className="w-56 bg-bg-secondary border-r border-bg-tertiary flex flex-col">
        <div className="p-4 border-b border-bg-tertiary">
          <h1 className="text-lg font-bold text-text-primary">Configurações</h1>
        </div>
        <nav className="flex-1 p-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}

// ============ SECTION COMPONENTS ============

// Biblioteca Section
function BibliotecaSection({ settings, isScanning, onSelectFolder }: {
  settings: Settings;
  isScanning: boolean;
  onSelectFolder: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Biblioteca</h2>
        <p className="text-text-secondary text-sm">Gerencie sua biblioteca de músicas</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Pasta de Músicas</h3>
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
            onClick={onSelectFolder}
            disabled={isScanning}
            className="btn btn-primary disabled:opacity-50"
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
      </div>
    </div>
  );
}

// Aparencia Section
function AparenciaSection({
  settings,
  availableThemes,
  themeName,
  colors,
  colorOverrides,
  colorMode,
  autoBaseColor,
  autoAccentColor,
  isRefreshingThemes,
  onThemeChange,
  onRefreshThemes,
  onColorModeChange,
  onAutoBaseColorChange,
  onAutoAccentColorChange,
  updateColorOverride,
  resetColorOverrides,
}: {
  settings: Settings;
  availableThemes: any[];
  themeName: string;
  colors: any;
  colorOverrides: ColorOverrides;
  colorMode: 'manual' | 'auto';
  autoBaseColor: string;
  autoAccentColor: string;
  isRefreshingThemes: boolean;
  onThemeChange: (name: string) => void;
  onRefreshThemes: () => void;
  onColorModeChange: (mode: 'manual' | 'auto') => void;
  onAutoBaseColorChange: (color: string) => void;
  onAutoAccentColorChange: (color: string) => void;
  updateColorOverride: (overrides: ColorOverrides) => void;
  resetColorOverrides: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Aparência</h2>
        <p className="text-text-secondary text-sm">Personalize o visual do player</p>
      </div>

      {/* Themes */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Temas</h3>
        </div>

        {/* Official Themes */}
        {availableThemes.filter(t => t.category === 'official').length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Oficiais
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {availableThemes.filter(t => t.category === 'official').map((theme) => (
                <motion.button
                  key={theme.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onThemeChange(theme.name)}
                  className={`relative p-3 rounded-lg border-2 transition-colors text-left ${
                    themeName === theme.name
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-bg-tertiary hover:border-accent-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {theme.type === 'dark' ? (
                      <Moon className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <Sun className="w-4 h-4 text-text-secondary" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{theme.name}</span>
                  </div>
                  {themeName === theme.name && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Community Themes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Comunidade
            </h4>
            <button
              onClick={onRefreshThemes}
              disabled={isRefreshingThemes}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-3 h-3 ${isRefreshingThemes ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
          {availableThemes.filter(t => t.category === 'community').length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {availableThemes.filter(t => t.category === 'community').map((theme) => (
                <motion.button
                  key={theme.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onThemeChange(theme.name)}
                  className={`relative p-3 rounded-lg border-2 transition-colors text-left ${
                    themeName === theme.name
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-bg-tertiary hover:border-accent-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {theme.type === 'dark' ? (
                      <Moon className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <Sun className="w-4 h-4 text-text-secondary" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{theme.name}</span>
                  </div>
                  {themeName === theme.name && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm py-3 text-center border border-dashed border-bg-tertiary rounded-lg">
              Nenhum tema da comunidade
            </p>
          )}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Paintbrush className="w-5 h-5 text-accent-primary" />
            <h3 className="font-semibold text-text-primary">Cores Personalizadas</h3>
          </div>
          {(colorOverrides.accent || colorOverrides.background || colorOverrides.text) && (
            <button
              onClick={resetColorOverrides}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors"
            >
              <RefreshCcw className="w-3 h-3" />
              Resetar
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onColorModeChange('auto')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
              colorMode === 'auto'
                ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                : 'border-bg-tertiary text-text-secondary hover:border-accent-primary/50'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm font-medium">Auto</span>
          </button>
          <button
            onClick={() => onColorModeChange('manual')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
              colorMode === 'manual'
                ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                : 'border-bg-tertiary text-text-secondary hover:border-accent-primary/50'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span className="text-sm font-medium">Manual</span>
          </button>
        </div>

        {/* Auto Mode */}
        {colorMode === 'auto' && (
          <div className="space-y-4">
            <p className="text-text-muted text-sm">
              Escolha uma cor base e uma cor de destaque para gerar a paleta automaticamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-bg-tertiary/50">
                <span className="text-xs text-text-muted">Cor Base</span>
                <input
                  type="color"
                  value={autoBaseColor}
                  onChange={(e) => {
                    onAutoBaseColorChange(e.target.value);
                    const palette = generateColorPalette(e.target.value, autoAccentColor);
                    updateColorOverride(palette);
                  }}
                  className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                />
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-bg-tertiary/50">
                <span className="text-xs text-text-muted">Destaque</span>
                <input
                  type="color"
                  value={autoAccentColor}
                  onChange={(e) => {
                    onAutoAccentColorChange(e.target.value);
                    const palette = generateColorPalette(autoBaseColor, e.target.value);
                    updateColorOverride(palette);
                  }}
                  className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Manual Mode */}
        {colorMode === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-text-primary">Cor de Destaque</span>
                <p className="text-xs text-text-muted">Botões e elementos ativos</p>
              </div>
              <input
                type="color"
                value={colorOverrides.accent?.primary || colors?.accent.primary || '#8b5cf6'}
                onChange={(e) => {
                  const color = e.target.value;
                  updateColorOverride({
                    accent: {
                      primary: color,
                      hover: adjustColorBrightness(color, -15),
                      active: adjustColorBrightness(color, -30),
                    }
                  });
                }}
                className="w-10 h-10 rounded-lg border-2 border-bg-tertiary cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Gradients */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Gradientes</h3>
        </div>

        {/* Background Gradient Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50">
          <span className="text-sm text-text-primary">Gradiente de Fundo</span>
          <button
            onClick={() => {
              const current = colorOverrides.background?.gradient;
              const enabled = !(current?.enabled);
              updateColorOverride({
                background: {
                  gradient: {
                    enabled,
                    type: current?.type || 'linear',
                    angle: current?.angle || 180,
                    colors: current?.colors || ['#170005', '#000000'],
                    stops: current?.stops || [0, 100]
                  } as GradientConfig
                }
              });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              colorOverrides.background?.gradient?.enabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                colorOverrides.background?.gradient?.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {colorOverrides.background?.gradient?.enabled && (
          <div className="mt-4 space-y-3">
            <div
              className="h-12 rounded-lg border border-bg-tertiary"
              style={{
                background: `linear-gradient(${colorOverrides.background.gradient.angle || 180}deg, ${
                  (colorOverrides.background.gradient.colors || ['#170005', '#000000'])
                    .map((c, i) => `${c} ${(colorOverrides.background.gradient.stops || [0, 100])[i] || 0}%`)
                    .join(', ')
                })`
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(colorOverrides.background.gradient.colors || ['#170005', '#000000'])[0]}
                  onChange={(e) => {
                    const currentColors = colorOverrides.background.gradient?.colors || ['#170005', '#000000'];
                    updateColorOverride({
                      background: {
                        gradient: {
                          ...colorOverrides.background?.gradient,
                          colors: [e.target.value, currentColors[1]]
                        } as GradientConfig
                      }
                    });
                  }}
                  className="w-8 h-8 rounded border-2 border-bg-tertiary cursor-pointer"
                />
                <span className="text-xs text-text-muted">Cor 1</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(colorOverrides.background.gradient.colors || ['#170005', '#000000'])[1]}
                  onChange={(e) => {
                    const currentColors = colorOverrides.background.gradient?.colors || ['#170005', '#000000'];
                    updateColorOverride({
                      background: {
                        gradient: {
                          ...colorOverrides.background?.gradient,
                          colors: [currentColors[0], e.target.value]
                        } as GradientConfig
                      }
                    });
                  }}
                  className="w-8 h-8 rounded border-2 border-bg-tertiary cursor-pointer"
                />
                <span className="text-xs text-text-muted">Cor 2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Layout Section
function LayoutSection({
  layout,
  layoutOverrides,
  updateLayoutOverride,
  resetLayoutOverrides,
}: {
  layout: any;
  layoutOverrides: any;
  updateLayoutOverride: (overrides: any) => void;
  resetLayoutOverrides: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Layout</h2>
          <p className="text-text-secondary text-sm">Personalize a posição dos elementos</p>
        </div>
        {(layoutOverrides.sidebar || layoutOverrides.player || layoutOverrides.header) && (
          <button
            onClick={resetLayoutOverrides}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            Resetar
          </button>
        )}
      </div>

      {/* Sidebar Position */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Posição da Sidebar</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'left', label: 'Esquerda', icon: PanelLeft },
            { value: 'right', label: 'Direita', icon: PanelRight },
            { value: 'top', label: 'Topo', icon: PanelTop },
          ].map((option) => {
            const Icon = option.icon;
            const isActive = (layoutOverrides.sidebar?.position || layout?.sidebar.position) === option.value;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateLayoutOverride({ sidebar: { position: option.value as 'left' | 'right' | 'top' } })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-bg-tertiary hover:border-accent-primary/50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} />
                <span className={`text-sm ${isActive ? 'text-accent-primary font-medium' : 'text-text-secondary'}`}>
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Player Position */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Posição do Player</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'bottom', label: 'Inferior', icon: PanelBottom },
            { value: 'top', label: 'Superior', icon: PanelTop },
          ].map((option) => {
            const Icon = option.icon;
            const isActive = (layoutOverrides.player?.position || layout?.player.position) === option.value;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateLayoutOverride({ player: { position: option.value as 'bottom' | 'top' } })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-bg-tertiary hover:border-accent-primary/50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} />
                <span className={`text-sm ${isActive ? 'text-accent-primary font-medium' : 'text-text-secondary'}`}>
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Header Toggle */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Mostrar Titlebar</h3>
            <p className="text-xs text-text-muted mt-1">Barra de título com controles da janela</p>
          </div>
          <button
            onClick={() => {
              const currentVisible = layoutOverrides.header?.visible ?? layout?.header.visible ?? true;
              updateLayoutOverride({ header: { visible: !currentVisible } });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              (layoutOverrides.header?.visible ?? layout?.header.visible ?? true) ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (layoutOverrides.header?.visible ?? layout?.header.visible ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Audio Section
function AudioSection({
  settings,
  setSettings,
  autoSave,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  autoSave: (s: Settings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Áudio</h2>
        <p className="text-text-secondary text-sm">Configurações de reprodução</p>
      </div>

      {/* Crossfade */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <AudioLines className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Crossfade</h3>
        </div>

        <p className="text-text-muted text-sm mb-4">
          Transição suave entre músicas
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-text-primary text-sm">Ativar crossfade</span>
            <button
              onClick={() => {
                const newSettings = { ...settings, crossfadeEnabled: !settings.crossfadeEnabled };
                setSettings(newSettings);
                autoSave(newSettings);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.crossfadeEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.crossfadeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className={`space-y-2 ${!settings.crossfadeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Duração</span>
              <span className="text-accent-primary font-medium text-sm">{settings.crossfadeDuration}s</span>
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
          </div>
        </div>
      </div>

      {/* Volume Normalization */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Normalização de Volume</h3>
        </div>

        <p className="text-text-muted text-sm mb-4">
          Equaliza o volume entre músicas diferentes
        </p>

        <div className="flex items-center justify-between">
          <span className="text-text-primary text-sm">Ativar normalização</span>
          <button
            onClick={() => {
              const newSettings = { ...settings, normalizationEnabled: !settings.normalizationEnabled };
              setSettings(newSettings);
              autoSave(newSettings);
              useEqualizerStore.getState().setNormalization(!settings.normalizationEnabled);
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.normalizationEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.normalizationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Comportamento Section
function ComportamentoSection({
  closeBehavior,
  setCloseBehavior,
  discordRichPresence,
  setDiscordRichPresence,
}: {
  closeBehavior: 'ask' | 'tray' | 'close';
  setCloseBehavior: (b: 'ask' | 'tray' | 'close') => void;
  discordRichPresence: boolean;
  setDiscordRichPresence: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Comportamento</h2>
        <p className="text-text-secondary text-sm">Configure o comportamento do aplicativo</p>
      </div>

      {/* Discord Rich Presence */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <div>
              <h3 className="font-semibold text-text-primary">Discord Rich Presence</h3>
              <p className="text-xs text-text-muted mt-1">Mostra o que você está ouvindo no Discord</p>
            </div>
          </div>
          <button
            onClick={() => setDiscordRichPresence(!discordRichPresence)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              discordRichPresence ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                discordRichPresence ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {discordRichPresence && (
          <p className="text-text-muted text-xs mt-3 p-2 bg-bg-tertiary/50 rounded-lg">
            Requer o plugin SkllPlayer no Vencord para funcionar como "Listening to"
          </p>
        )}
      </div>

      {/* Close Behavior */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-4">
          <X className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Ao Fechar o App</h3>
        </div>

        <p className="text-text-muted text-sm mb-4">
          O que acontece quando você clica no botão X
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'ask', label: 'Perguntar', icon: HelpCircle, desc: 'Pergunta toda vez' },
            { value: 'tray', label: 'Bandeja', icon: MinusSquare, desc: 'Minimiza na bandeja' },
            { value: 'close', label: 'Fechar', icon: X, desc: 'Fecha o app' },
          ].map((option) => {
            const Icon = option.icon;
            const isActive = closeBehavior === option.value;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCloseBehavior(option.value as 'ask' | 'tray' | 'close');
                  window.electronAPI?.setCloseBehavior(option.value as 'ask' | 'tray' | 'close');
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-bg-tertiary hover:border-accent-primary/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} />
                <span className={`text-sm ${isActive ? 'text-accent-primary font-medium' : 'text-text-secondary'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-text-muted">{option.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Dados Section
function DadosSection({ onResetStats }: { onResetStats: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Dados</h2>
        <p className="text-text-secondary text-sm">Gerencie seus dados</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-5 border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-text-primary">Resetar Estatísticas</h3>
        </div>

        <p className="text-text-muted text-sm mb-4">
          Remove todas as estatísticas (músicas tocadas, tempo de escuta, etc.)
        </p>

        <button
          onClick={onResetStats}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resetar</span>
        </button>
      </div>
    </div>
  );
}

// Sobre Section
function SobreSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Sobre</h2>
        <p className="text-text-secondary text-sm">Informações do aplicativo</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-accent-primary/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-accent-primary" style={{ writingMode: 'vertical-rl' }}>₪</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">SkllPlayer</h3>
            <p className="text-text-secondary text-sm">v0.1 Build Test</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-text-secondary">
            Criado por <span className="text-accent-primary font-medium">SkellBR</span>
          </p>
          <p className="text-text-muted">
            Inspirado no BlackPlayer para Android
          </p>
        </div>
      </div>
    </div>
  );
}
