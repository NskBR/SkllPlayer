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
  Trash2,
  Grid3X3,
  List,
  Columns,
  EyeOff,
  LayoutGrid,
  Minimize2,
  Maximize2,
  Square,
  Save
} from 'lucide-react';
import type { GradientConfig, ColorOverrides, FontOverrides } from '../types/electron';
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
    theme,
    availableThemes,
    loadTheme,
    refreshThemes,
    themeName,
    layout,
    colors,
    fonts,
    layoutOverrides,
    colorOverrides,
    fontOverrides,
    updateLayoutOverride,
    updateColorOverride,
    updateFontOverride,
    resetLayoutOverrides,
    resetColorOverrides,
    resetFontOverrides
  } = useTheme();
  const [isRefreshingThemes, setIsRefreshingThemes] = useState(false);
  const [colorMode, setColorMode] = useState<'manual' | 'auto'>('manual');
  const [autoBaseColor, setAutoBaseColor] = useState('#0a0a0f');
  const [autoAccentColor, setAutoAccentColor] = useState('#8b5cf6');
  const [closeBehavior, setCloseBehavior] = useState<'ask' | 'tray' | 'close'>('ask');
  const [discordRichPresence, setDiscordRichPresence] = useState(true);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
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

  const handleThemeChange = async (newThemeName: string) => {
    // Clear color overrides when switching themes to prevent settings from leaking
    resetColorOverrides();

    const newSettings = { ...settings, theme: newThemeName };
    setSettings(newSettings);
    await loadTheme(newThemeName);
    autoSave(newSettings);
  };

  const handleSaveThemeChanges = async () => {
    if (!window.electronAPI) return;

    console.log('[Save Theme] Starting save...');
    console.log('[Save Theme] themeName:', themeName);
    console.log('[Save Theme] colorOverrides:', colorOverrides);
    console.log('[Save Theme] fontOverrides:', fontOverrides);

    setIsSavingTheme(true);
    try {
      // Build the updates object from current overrides
      const updates: Record<string, unknown> = {};

      if (colorOverrides.background || colorOverrides.text || colorOverrides.accent || colorOverrides.player || colorOverrides.sidebar) {
        updates.colors = {
          ...(colorOverrides.background && { background: colorOverrides.background }),
          ...(colorOverrides.text && { text: colorOverrides.text }),
          ...(colorOverrides.accent && { accent: colorOverrides.accent }),
          ...(colorOverrides.player && { player: colorOverrides.player }),
          ...(colorOverrides.sidebar && { sidebar: colorOverrides.sidebar }),
        };
      }

      if (fontOverrides.primary || fontOverrides.secondary) {
        updates.fonts = {
          ...(fontOverrides.primary && { primary: fontOverrides.primary }),
          ...(fontOverrides.secondary && { secondary: fontOverrides.secondary }),
        };
      }

      console.log('[Save Theme] updates:', updates);

      if (Object.keys(updates).length === 0) {
        alert('Nenhuma alteração para salvar.');
        setIsSavingTheme(false);
        return;
      }

      // Save to theme JSON file
      await window.electronAPI.updateTheme(themeName, updates);

      // Clear overrides since they're now saved in the theme
      resetColorOverrides();
      resetFontOverrides();

      // Reload the theme to get the saved values
      await loadTheme(themeName);

      // Show success notification
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    } catch (error) {
      console.error('[Save Theme] Error:', error);
      // Show error notification
      alert('Erro ao salvar: ' + (error as Error).message);
    } finally {
      setIsSavingTheme(false);
    }
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
          setIsScanning={setIsScanning}
          setSettings={setSettings}
        />;
      case 'aparencia':
        return <AparenciaSection
          settings={settings}
          availableThemes={availableThemes}
          themeName={themeName}
          theme={theme}
          colors={colors}
          fonts={fonts}
          colorOverrides={colorOverrides}
          fontOverrides={fontOverrides}
          colorMode={colorMode}
          autoBaseColor={autoBaseColor}
          autoAccentColor={autoAccentColor}
          isRefreshingThemes={isRefreshingThemes}
          isSavingTheme={isSavingTheme}
          themeSaved={themeSaved}
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
          updateFontOverride={updateFontOverride}
          resetColorOverrides={() => {
            resetColorOverrides();
            setColorMode('manual');
          }}
          resetFontOverrides={resetFontOverrides}
          onSaveTheme={handleSaveThemeChanges}
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
function BibliotecaSection({ settings, isScanning, setIsScanning, setSettings }: {
  settings: Settings;
  isScanning: boolean;
  setIsScanning: (v: boolean) => void;
  setSettings: (s: Settings) => void;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [folderAnalysis, setFolderAnalysis] = useState<{
    path: string;
    totalFiles: number;
    audioFiles: number;
    totalSizeGB: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI) {
        const folder = await window.electronAPI.selectMusicFolder();
        if (folder) {
          // Analyze folder first
          setIsAnalyzing(true);
          const analysis = await window.electronAPI.analyzeFolder(folder);
          setIsAnalyzing(false);

          // Check if folder is large (more than 5000 files or more than 10GB)
          const isLarge = analysis.totalFiles > 5000 || parseFloat(analysis.totalSizeGB) > 10;

          if (isLarge) {
            setFolderAnalysis({ path: folder, ...analysis });
            setShowConfirmDialog(true);
          } else {
            // Proceed directly
            await scanFolder(folder);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setIsAnalyzing(false);
      setIsScanning(false);
    }
  };

  const scanFolder = async (folder: string) => {
    if (!window.electronAPI) return;

    const newSettings = { ...settings, musicFolder: folder };
    setSettings(newSettings);
    await window.electronAPI.saveSettings(newSettings);
    setIsScanning(true);
    await window.electronAPI.scanMusicFolder(folder);
    setIsScanning(false);
  };

  const handleConfirmScan = async () => {
    setShowConfirmDialog(false);
    if (folderAnalysis) {
      await scanFolder(folderAnalysis.path);
    }
    setFolderAnalysis(null);
  };

  const handleCancelScan = () => {
    setShowConfirmDialog(false);
    setFolderAnalysis(null);
  };

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
            onClick={handleSelectFolder}
            disabled={isScanning || isAnalyzing}
            className="btn btn-primary disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando...</span>
              </>
            ) : isScanning ? (
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

      {/* Confirmation Dialog for Large Folders */}
      {showConfirmDialog && folderAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-secondary rounded-xl p-6 max-w-md w-full mx-4 border border-bg-tertiary shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Pasta Grande Detectada</h3>
            </div>

            <p className="text-text-secondary mb-4">
              A pasta selecionada contém muito conteúdo. Escanear pode demorar e consumir muitos recursos.
            </p>

            <div className="bg-bg-tertiary rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total de arquivos:</span>
                <span className="text-text-primary font-medium">{folderAnalysis.totalFiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Arquivos de áudio:</span>
                <span className="text-accent-primary font-medium">{folderAnalysis.audioFiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Tamanho total:</span>
                <span className="text-text-primary font-medium">{folderAnalysis.totalSizeGB} GB</span>
              </div>
            </div>

            <p className="text-text-primary font-medium mb-4">
              Tem certeza que deseja escanear esta pasta?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelScan}
                className="flex-1 px-4 py-2.5 rounded-lg bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/80 transition-colors"
              >
                Não
              </button>
              <button
                onClick={handleConfirmScan}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent-primary text-white hover:bg-accent-hover transition-colors"
              >
                Sim, Escanear
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Common font options
const FONT_OPTIONS = [
  { label: 'Padrão do Tema', value: '' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Segoe UI', value: 'Segoe UI, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Open Sans', value: 'Open Sans, system-ui, sans-serif' },
  { label: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { label: 'Fira Code', value: 'Fira Code, monospace' },
  { label: 'Cascadia Code', value: 'Cascadia Code, monospace' },
];

// Aparencia Section
function AparenciaSection({
  settings,
  availableThemes,
  themeName,
  theme,
  colors,
  fonts,
  colorOverrides,
  fontOverrides,
  colorMode,
  autoBaseColor,
  autoAccentColor,
  isRefreshingThemes,
  isSavingTheme,
  themeSaved,
  onThemeChange,
  onRefreshThemes,
  onColorModeChange,
  onAutoBaseColorChange,
  onAutoAccentColorChange,
  updateColorOverride,
  updateFontOverride,
  resetColorOverrides,
  resetFontOverrides,
  onSaveTheme,
}: {
  settings: Settings;
  availableThemes: any[];
  themeName: string;
  theme: any;
  colors: any;
  fonts: any;
  colorOverrides: ColorOverrides;
  fontOverrides: FontOverrides;
  colorMode: 'manual' | 'auto';
  autoBaseColor: string;
  autoAccentColor: string;
  isRefreshingThemes: boolean;
  isSavingTheme: boolean;
  themeSaved: boolean;
  onThemeChange: (name: string) => void;
  onRefreshThemes: () => void;
  onColorModeChange: (mode: 'manual' | 'auto') => void;
  onAutoBaseColorChange: (color: string) => void;
  onAutoAccentColorChange: (color: string) => void;
  updateColorOverride: (overrides: ColorOverrides) => void;
  updateFontOverride: (overrides: FontOverrides) => void;
  resetColorOverrides: () => void;
  resetFontOverrides: () => void;
  onSaveTheme: () => void;
}) {

  // Check if current theme is official
  const currentTheme = availableThemes.find(t => t.name === themeName);
  const isOfficialTheme = currentTheme?.category === 'official';
  const isGlassTheme = (name: string) => name.toLowerCase().includes('glass');
  const currentIsGlassTheme = isGlassTheme(themeName);
  const isGlassLightTheme = themeName === 'Glass Light';
  const isGlassDarkTheme = currentIsGlassTheme && !isGlassLightTheme;
  const isCommunityTheme = currentTheme?.category === 'community';
  const isDefaultTheme = isOfficialTheme && !currentIsGlassTheme;

  // Get current glass opacity from colorOverrides OR theme colors
  const getGlassOpacity = (): number => {
    // First check overrides
    const overrideBg = colorOverrides.background?.primary;
    if (overrideBg && overrideBg.startsWith('rgba')) {
      const match = overrideBg.match(/rgba\([\d.]+,\s*[\d.]+,\s*[\d.]+,\s*([\d.]+)\)/);
      if (match) return parseFloat(match[1]);
    }
    // Then check theme colors
    const themeBg = colors?.background?.primary;
    if (themeBg && themeBg.startsWith('rgba')) {
      const match = themeBg.match(/rgba\([\d.]+,\s*[\d.]+,\s*[\d.]+,\s*([\d.]+)\)/);
      if (match) return parseFloat(match[1]);
    }
    return themeName === 'Glass Mica' ? 0.80 : 0.65;
  };

  // Helper to parse RGBA color string
  const parseRgba = (color: string): { r: number; g: number; b: number; a: number } | null => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }
    return null;
  };

  // Get the ORIGINAL theme base colors (not overridden) - uses theme?.colors directly
  const getThemeBaseColors = () => {
    // Use original theme colors, not the merged ones with overrides
    const originalColors = theme?.colors;
    const themeBg = originalColors?.background?.primary;
    const themeBgSec = originalColors?.background?.secondary;
    const themeBgTer = originalColors?.background?.tertiary;
    const themeSidebar = originalColors?.sidebar?.background;

    return {
      primary: parseRgba(themeBg || '') || { r: 20, g: 20, b: 30, a: 0.65 },
      secondary: parseRgba(themeBgSec || '') || { r: 25, g: 25, b: 35, a: 0.70 },
      tertiary: parseRgba(themeBgTer || '') || { r: 30, g: 30, b: 40, a: 0.75 },
      sidebar: parseRgba(themeSidebar || '') || { r: 15, g: 15, b: 25, a: 0.75 },
    };
  };

  // Get current glass darkness slider value (0-60 range)
  const getGlassDarkness = (): number => {
    // Calculate based on the multiplier we're using
    const base = getThemeBaseColors();
    const overrideBg = colorOverrides.background?.primary;

    if (overrideBg && overrideBg.startsWith('rgba')) {
      const parsed = parseRgba(overrideBg);
      if (parsed && base.primary.r > 0) {
        // Reverse calculate the multiplier from current color
        const multiplier = parsed.r / base.primary.r;
        // Convert multiplier (0.1 to 3.0) back to slider (0 to 60)
        return Math.round(((multiplier - 0.1) / 2.9) * 60);
      }
    }
    // Default is multiplier 1.0, which corresponds to slider value ~20
    return Math.round(((1.0 - 0.1) / 2.9) * 60);
  };

  // Apply glass effect preserving theme color ratios
  const applyGlassEffect = (opacity: number, darknessMultiplier: number) => {
    const base = getThemeBaseColors();

    // Scale colors by darkness multiplier while preserving ratios
    const scaleColor = (color: { r: number; g: number; b: number; a: number }, alphaOffset: number = 0) => {
      return `rgba(${Math.round(color.r * darknessMultiplier)}, ${Math.round(color.g * darknessMultiplier)}, ${Math.round(color.b * darknessMultiplier)}, ${Math.min(1, opacity + alphaOffset)})`;
    };

    updateColorOverride({
      background: {
        primary: scaleColor(base.primary, 0),
        secondary: scaleColor(base.secondary, 0.05),
        tertiary: scaleColor(base.tertiary, 0.10),
      },
      sidebar: {
        background: scaleColor(base.sidebar, 0.10),
      },
    });
  };

  // Apply glass effect for LIGHT themes
  const applyGlassLightEffect = (opacity: number) => {
    const base = 250;
    const bgColor = `rgba(${base}, ${base}, 255, ${opacity})`;
    const sidebarColor = `rgba(${base - 10}, ${base - 5}, ${base}, ${Math.min(1, opacity + 0.07)})`;
    const secondaryColor = `rgba(${base - 10}, ${base - 8}, ${base}, ${Math.min(1, opacity + 0.05)})`;
    const tertiaryColor = `rgba(${base - 25}, ${base - 22}, ${base - 10}, ${Math.min(1, opacity + 0.10)})`;

    updateColorOverride({
      background: {
        primary: bgColor,
        secondary: secondaryColor,
        tertiary: tertiaryColor,
      },
      sidebar: {
        background: sidebarColor,
      },
    });
  };

  // Get current darkness multiplier (1.0 = original, 0.5 = darker, 2.0 = lighter)
  const getDarknessMultiplier = (): number => {
    const base = getThemeBaseColors();
    const overrideBg = colorOverrides.background?.primary;
    if (overrideBg) {
      const parsed = parseRgba(overrideBg);
      if (parsed && base.primary.r > 0) {
        return parsed.r / base.primary.r;
      }
    }
    return 1.0;
  };

  // Real-time glass opacity change
  const handleGlassOpacityChange = (opacity: number) => {
    if (isGlassLightTheme) {
      applyGlassLightEffect(opacity);
    } else {
      applyGlassEffect(opacity, getDarknessMultiplier());
    }
  };

  // Real-time glass darkness change (only for dark themes)
  const handleGlassDarknessChange = (darkness: number) => {
    // Convert darkness (0-60) to multiplier (0.1 to 3.0)
    const multiplier = 0.1 + (darkness / 60) * 2.9;
    applyGlassEffect(getGlassOpacity(), multiplier);
  };

  // Real-time accent color change (for glass and community themes)
  const handleAccentColorChange = (color: string) => {
    updateColorOverride({
      accent: {
        primary: color,
        hover: adjustColorBrightness(color, -15),
        active: adjustColorBrightness(color, -30),
      },
      sidebar: {
        itemActive: color,
      },
      player: {
        progress: color,
      },
    });
  };

  // Real-time font change
  const handleFontChange = (font: string) => {
    if (font) {
      updateFontOverride({ primary: font });
    } else {
      resetFontOverrides();
    }
  };

  // Get current accent color
  const getCurrentAccentColor = (): string => {
    return colorOverrides.accent?.primary || colors?.accent?.primary || '#8b5cf6';
  };

  // Get current font
  const getCurrentFont = (): string => {
    return fontOverrides.primary || '';
  };

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
                  className={`w-full relative p-3 rounded-lg border-2 transition-colors text-left ${
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
                    {isGlassTheme(theme.name) && (
                      <Sparkles className="w-3 h-3 text-accent-primary ml-auto" />
                    )}
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
                  className={`w-full relative p-3 rounded-lg border-2 transition-colors text-left ${
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

          {/* Open Themes Folder Button */}
          <div className="mt-4 pt-4 border-t border-bg-tertiary">
            <button
              onClick={() => window.electronAPI.openThemesFolder()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Abrir pasta de temas
            </button>
          </div>
        </div>
      </div>

      {/* Glass Theme Editor - Inline */}
      {currentIsGlassTheme && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-bg-secondary rounded-xl p-5 border border-accent-primary"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent-primary" />
              <div>
                <h3 className="font-semibold text-text-primary">Personalizar {themeName}</h3>
                <p className="text-xs text-text-muted">Alterações aplicadas em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {themeSaved && (
                <span className="flex items-center gap-1 text-xs text-green-500 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  Salvo!
                </span>
              )}
              <button
                onClick={onSaveTheme}
                disabled={isSavingTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {isSavingTheme ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Salvar
              </button>
              <button
                onClick={() => {
                  resetColorOverrides();
                  resetFontOverrides();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Colors */}
            <div className="space-y-4">
              {/* Accent Color */}
              <div>
                <span className="text-sm font-medium text-text-primary mb-2 block">Cor de Destaque</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={getCurrentAccentColor()}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                  />
                  <div
                    className="flex-1 h-10 rounded-lg"
                    style={{ backgroundColor: getCurrentAccentColor() }}
                  />
                </div>
              </div>

              {/* Font */}
              <div>
                <span className="text-sm font-medium text-text-primary mb-2 block">Fonte</span>
                <select
                  value={getCurrentFont()}
                  onChange={(e) => handleFontChange(e.target.value)}
                  className="w-full h-10 px-3 bg-bg-tertiary text-text-primary rounded-lg border border-bg-tertiary focus:border-accent-primary outline-none"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Sliders */}
            <div className="space-y-4">
              {/* Transparency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Transparência</span>
                  <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-tertiary rounded">
                    {Math.round((1 - getGlassOpacity()) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={getGlassOpacity()}
                  onChange={(e) => handleGlassOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* Darkness - Only for dark glass themes */}
              {isGlassDarkTheme && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Escuridão</span>
                    <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-tertiary rounded">
                      {getGlassDarkness()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={getGlassDarkness()}
                    onChange={(e) => handleGlassDarknessChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Community Theme Editor - Inline (only for non-glass community themes) */}
      {isCommunityTheme && !currentIsGlassTheme && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-bg-secondary rounded-xl p-5 border border-accent-primary"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Paintbrush className="w-5 h-5 text-accent-primary" />
              <div>
                <h3 className="font-semibold text-text-primary">Personalizar {themeName}</h3>
                <p className="text-xs text-text-muted">Alterações aplicadas em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {themeSaved && (
                <span className="flex items-center gap-1 text-xs text-green-500 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  Salvo!
                </span>
              )}
              <button
                onClick={onSaveTheme}
                disabled={isSavingTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {isSavingTheme ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Salvar
              </button>
              <button
                onClick={() => {
                  resetColorOverrides();
                  resetFontOverrides();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Accent Color */}
            <div>
              <span className="text-sm font-medium text-text-primary mb-2 block">Cor de Destaque</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={getCurrentAccentColor()}
                  onChange={(e) => handleAccentColorChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                />
                <div
                  className="flex-1 h-10 rounded-lg"
                  style={{ backgroundColor: getCurrentAccentColor() }}
                />
              </div>
            </div>

            {/* Font */}
            <div>
              <span className="text-sm font-medium text-text-primary mb-2 block">Fonte</span>
              <select
                value={getCurrentFont()}
                onChange={(e) => handleFontChange(e.target.value)}
                className="w-full h-10 px-3 bg-bg-tertiary text-text-primary rounded-lg border border-bg-tertiary focus:border-accent-primary outline-none"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Colors - Only for Official Non-Glass Themes */}
      {isDefaultTheme && (
        <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Paintbrush className="w-5 h-5 text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Personalizar Cores</h3>
            </div>
            <div className="flex items-center gap-3">
              {themeSaved && (
                <span className="flex items-center gap-1 text-xs text-green-500 animate-fadeIn">
                  <Check className="w-3 h-3" />
                  Salvo!
                </span>
              )}
              {(colorOverrides.accent || colorOverrides.background || colorOverrides.text) && (
                <>
                  <button
                    onClick={onSaveTheme}
                    disabled={isSavingTheme}
                    className="flex items-center gap-1 text-xs bg-accent-primary text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {isSavingTheme ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Salvar no Tema
                  </button>
                  <button
                    onClick={resetColorOverrides}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Resetar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Lateral Color Picker Layout */}
          <div className="flex gap-6">
            {/* Left side - Mode selection */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onColorModeChange('manual')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  colorMode === 'manual'
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-bg-tertiary text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <Paintbrush className="w-5 h-5" />
                <span className="text-sm font-medium">Destaque</span>
              </button>
              <button
                onClick={() => onColorModeChange('auto')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  colorMode === 'auto'
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-bg-tertiary text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <Wand2 className="w-5 h-5" />
                <span className="text-sm font-medium">Paleta</span>
              </button>
            </div>

            {/* Right side - Color pickers */}
            <div className="flex-1 p-4 rounded-lg bg-bg-tertiary/30">
              {colorMode === 'manual' ? (
                <div className="space-y-4">
                  {/* Accent Color */}
                  <div className="flex items-center gap-4">
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
                      className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">Destaque</span>
                      <p className="text-xs text-text-muted">Botões e elementos ativos</p>
                    </div>
                  </div>

                  {/* Background Colors */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={colorOverrides.background?.primary || colors?.background.primary || '#0a0a0f'}
                      onChange={(e) => {
                        updateColorOverride({
                          background: {
                            primary: e.target.value,
                          }
                        });
                      }}
                      className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">Fundo Principal</span>
                      <p className="text-xs text-text-muted">Cor de fundo do app</p>
                    </div>
                  </div>

                  {/* Sidebar Background */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={colorOverrides.sidebar?.background || colors?.sidebar.background || '#08080c'}
                      onChange={(e) => {
                        updateColorOverride({
                          sidebar: {
                            background: e.target.value,
                          }
                        });
                      }}
                      className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">Fundo da Sidebar</span>
                      <p className="text-xs text-text-muted">Cor de fundo do menu lateral</p>
                    </div>
                  </div>

                  {/* Text Primary */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={colorOverrides.text?.primary || colors?.text.primary || '#ffffff'}
                      onChange={(e) => {
                        updateColorOverride({
                          text: {
                            primary: e.target.value,
                          }
                        });
                      }}
                      className="w-12 h-12 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">Texto Principal</span>
                      <p className="text-xs text-text-muted">Cor dos títulos e textos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-text-muted mb-3">
                    Gera uma paleta completa automaticamente
                  </p>
                  <div className="flex gap-4">
                    <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
                      <input
                        type="color"
                        value={autoBaseColor}
                        onChange={(e) => {
                          onAutoBaseColorChange(e.target.value);
                          const palette = generateColorPalette(e.target.value, autoAccentColor);
                          updateColorOverride(palette);
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-medium text-text-primary">Base</span>
                        <p className="text-xs text-text-muted">Fundo</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
                      <input
                        type="color"
                        value={autoAccentColor}
                        onChange={(e) => {
                          onAutoAccentColorChange(e.target.value);
                          const palette = generateColorPalette(autoBaseColor, e.target.value);
                          updateColorOverride(palette);
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-bg-tertiary cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-medium text-text-primary">Destaque</span>
                        <p className="text-xs text-text-muted">Ações</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gradients - Only for Official Non-Glass Themes */}
      {isDefaultTheme && (
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
            <div className="mt-4 flex gap-4">
              <div
                className="w-24 h-24 rounded-lg border border-bg-tertiary flex-shrink-0"
                style={{
                  background: `linear-gradient(${colorOverrides.background.gradient.angle || 180}deg, ${
                    (colorOverrides.background.gradient.colors || ['#170005', '#000000'])
                      .map((c, i) => `${c} ${(colorOverrides.background.gradient.stops || [0, 100])[i] || 0}%`)
                      .join(', ')
                  })`
                }}
              />
              <div className="flex-1 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
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
                  <span className="text-sm text-text-secondary">Cor Superior</span>
                </div>
                <div className="flex items-center gap-3">
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
                  <span className="text-sm text-text-secondary">Cor Inferior</span>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Gradient Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50 mt-4">
            <span className="text-sm text-text-primary">Gradiente da Sidebar</span>
            <button
              onClick={() => {
                const current = colorOverrides.sidebar?.gradient;
                const enabled = !(current?.enabled);
                updateColorOverride({
                  sidebar: {
                    gradient: {
                      enabled,
                      type: current?.type || 'linear',
                      angle: current?.angle || 180,
                      colors: current?.colors || ['#1a0010', '#08080c'],
                      stops: current?.stops || [0, 100]
                    } as GradientConfig
                  }
                });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                colorOverrides.sidebar?.gradient?.enabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  colorOverrides.sidebar?.gradient?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {colorOverrides.sidebar?.gradient?.enabled && (
            <div className="mt-4 flex gap-4">
              <div
                className="w-24 h-24 rounded-lg border border-bg-tertiary flex-shrink-0"
                style={{
                  background: `linear-gradient(${colorOverrides.sidebar.gradient.angle || 180}deg, ${
                    (colorOverrides.sidebar.gradient.colors || ['#1a0010', '#08080c'])
                      .map((c, i) => `${c} ${(colorOverrides.sidebar.gradient.stops || [0, 100])[i] || 0}%`)
                      .join(', ')
                  })`
                }}
              />
              <div className="flex-1 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(colorOverrides.sidebar.gradient.colors || ['#1a0010', '#08080c'])[0]}
                    onChange={(e) => {
                      const currentColors = colorOverrides.sidebar.gradient?.colors || ['#1a0010', '#08080c'];
                      updateColorOverride({
                        sidebar: {
                          gradient: {
                            ...colorOverrides.sidebar?.gradient,
                            colors: [e.target.value, currentColors[1]]
                          } as GradientConfig
                        }
                      });
                    }}
                    className="w-8 h-8 rounded border-2 border-bg-tertiary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">Cor Superior</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(colorOverrides.sidebar.gradient.colors || ['#1a0010', '#08080c'])[1]}
                    onChange={(e) => {
                      const currentColors = colorOverrides.sidebar.gradient?.colors || ['#1a0010', '#08080c'];
                      updateColorOverride({
                        sidebar: {
                          gradient: {
                            ...colorOverrides.sidebar?.gradient,
                            colors: [currentColors[0], e.target.value]
                          } as GradientConfig
                        }
                      });
                    }}
                    className="w-8 h-8 rounded border-2 border-bg-tertiary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">Cor Inferior</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Layout presets
const LAYOUT_PRESETS = [
  {
    id: 'default',
    name: 'Padrão',
    icon: LayoutGrid,
    description: 'Layout clássico com sidebar à esquerda',
    config: {
      sidebar: { position: 'left', visible: true },
      player: { position: 'bottom' },
      header: { visible: true },
      library: { view: 'grid' },
    },
  },
  {
    id: 'compact',
    name: 'Compacto',
    icon: Minimize2,
    description: 'Sidebar recolhida, player compacto',
    config: {
      sidebar: { position: 'left', visible: true, collapsed: true },
      player: { position: 'bottom' },
      header: { visible: false },
      library: { view: 'list' },
    },
  },
  {
    id: 'expanded',
    name: 'Expandido',
    icon: Maximize2,
    description: 'Mais espaço para a biblioteca',
    config: {
      sidebar: { position: 'top', visible: true },
      player: { position: 'bottom' },
      header: { visible: true },
      library: { view: 'grid' },
    },
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    icon: Square,
    description: 'Apenas o essencial',
    config: {
      sidebar: { position: 'left', visible: false },
      player: { position: 'bottom' },
      header: { visible: false },
      library: { view: 'list' },
    },
  },
];

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
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Detect current preset based on settings
  useEffect(() => {
    const currentConfig = {
      sidebarPosition: layoutOverrides.sidebar?.position || layout?.sidebar?.position || 'left',
      sidebarVisible: layoutOverrides.sidebar?.visible ?? layout?.sidebar?.visible ?? true,
      playerPosition: layoutOverrides.player?.position || layout?.player?.position || 'bottom',
      headerVisible: layoutOverrides.header?.visible ?? layout?.header?.visible ?? true,
      libraryView: layoutOverrides.library?.view || layout?.library?.view || 'grid',
    };

    const matchedPreset = LAYOUT_PRESETS.find((preset) => {
      return (
        preset.config.sidebar.position === currentConfig.sidebarPosition &&
        preset.config.sidebar.visible === currentConfig.sidebarVisible &&
        preset.config.player.position === currentConfig.playerPosition &&
        preset.config.header.visible === currentConfig.headerVisible &&
        preset.config.library.view === currentConfig.libraryView
      );
    });

    setActivePreset(matchedPreset?.id || null);
  }, [layout, layoutOverrides]);

  const applyPreset = (preset: typeof LAYOUT_PRESETS[0]) => {
    updateLayoutOverride({
      sidebar: preset.config.sidebar,
      player: preset.config.player,
      header: preset.config.header,
      library: preset.config.library,
    });
    setActivePreset(preset.id);
  };

  const hasOverrides = layoutOverrides.sidebar || layoutOverrides.player || layoutOverrides.header || layoutOverrides.library;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Layout</h2>
          <p className="text-text-secondary text-sm">Personalize a posição dos elementos</p>
        </div>
        {hasOverrides && (
          <button
            onClick={resetLayoutOverrides}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            Resetar
          </button>
        )}
      </div>

      {/* Layout Presets */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Layouts Pré-definidos</h3>
        <div className="grid grid-cols-2 gap-3">
          {LAYOUT_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;
            return (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-colors text-left ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-bg-tertiary hover:border-accent-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} />
                  <span className={`font-medium ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
                    {preset.name}
                  </span>
                </div>
                <span className="text-xs text-text-muted">{preset.description}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Position */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Posição da Sidebar</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: 'left', label: 'Esquerda', icon: PanelLeft },
            { value: 'right', label: 'Direita', icon: PanelRight },
            { value: 'top', label: 'Topo', icon: PanelTop },
            { value: 'hidden', label: 'Oculta', icon: EyeOff },
          ].map((option) => {
            const Icon = option.icon;
            const currentPosition = layoutOverrides.sidebar?.position || layout?.sidebar?.position || 'left';
            const currentVisible = layoutOverrides.sidebar?.visible ?? layout?.sidebar?.visible ?? true;
            const isActive = option.value === 'hidden'
              ? !currentVisible
              : (currentPosition === option.value && currentVisible);
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (option.value === 'hidden') {
                    updateLayoutOverride({ sidebar: { visible: false } });
                  } else {
                    updateLayoutOverride({ sidebar: { position: option.value, visible: true } });
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-bg-tertiary hover:border-accent-primary/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`} />
                <span className={`text-xs ${isActive ? 'text-accent-primary font-medium' : 'text-text-secondary'}`}>
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
            const isActive = (layoutOverrides.player?.position || layout?.player?.position || 'bottom') === option.value;
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

      {/* Library View */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Visualização da Biblioteca</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'grid', label: 'Grade', icon: Grid3X3, description: 'Cards em grade' },
            { value: 'list', label: 'Lista', icon: List, description: 'Lista detalhada' },
            { value: 'columns', label: 'Colunas', icon: Columns, description: 'Estilo iTunes' },
          ].map((option) => {
            const Icon = option.icon;
            const isActive = (layoutOverrides.library?.view || layout?.library?.view || 'grid') === option.value;
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateLayoutOverride({ library: { view: option.value } })}
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
                <span className="text-xs text-text-muted">{option.description}</span>
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
              const currentVisible = layoutOverrides.header?.visible ?? layout?.header?.visible ?? true;
              updateLayoutOverride({ header: { visible: !currentVisible } });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              (layoutOverrides.header?.visible ?? layout?.header?.visible ?? true) ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (layoutOverrides.header?.visible ?? layout?.header?.visible ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sidebar Behavior */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary">
        <h3 className="font-semibold text-text-primary mb-4">Comportamento da Sidebar</h3>
        <div className="space-y-4">
          {/* Auto Expand */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-text-primary text-sm">Auto-expandir no hover</span>
              <p className="text-xs text-text-muted mt-0.5">Expande a sidebar ao passar o mouse quando recolhida</p>
            </div>
            <button
              onClick={() => {
                const current = layoutOverrides.sidebar?.autoExpand ?? false;
                updateLayoutOverride({ sidebar: { autoExpand: !current } });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                (layoutOverrides.sidebar?.autoExpand ?? false) ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  (layoutOverrides.sidebar?.autoExpand ?? false) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Collapse */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-text-primary text-sm">Auto-recolher ao sair</span>
              <p className="text-xs text-text-muted mt-0.5">Recolhe a sidebar ao tirar o mouse quando expandida</p>
            </div>
            <button
              onClick={() => {
                const current = layoutOverrides.sidebar?.autoCollapse ?? false;
                updateLayoutOverride({ sidebar: { autoCollapse: !current } });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                (layoutOverrides.sidebar?.autoCollapse ?? false) ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  (layoutOverrides.sidebar?.autoCollapse ?? false) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
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
