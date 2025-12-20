import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { LayoutOverrides, ColorOverrides, ThemeGradient, GradientConfig } from '../types/electron';

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    gradient?: ThemeGradient;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    primary: string;
    hover: string;
    active: string;
  };
  player: {
    progress: string;
    progressBackground: string;
    controls: string;
  };
  sidebar: {
    background: string;
    itemHover: string;
    itemActive: string;
    gradient?: ThemeGradient;
  };
}

interface ThemeFonts {
  primary: string;
  secondary: string;
  sizes: {
    small: string;
    normal: string;
    medium: string;
    large: string;
    title: string;
  };
}

interface ThemeLayout {
  sidebar: {
    position: 'left' | 'right' | 'top';
    width: string;
    collapsedWidth: string;
  };
  player: {
    position: 'bottom' | 'top';
    height: string;
  };
  header: {
    visible: boolean;
    height: string;
  };
}

interface ThemeComponents {
  borderRadius: string;
  trackItem: {
    height: string;
    thumbnailSize: string;
    showDuration: boolean;
    showArtist: boolean;
  };
  buttons: {
    borderRadius: string;
    style: 'filled' | 'outlined' | 'ghost';
  };
  scrollbar: {
    width: string;
    thumbColor: string;
    trackColor: string;
  };
}

interface ThemeEffects {
  blur: boolean;
  animations: boolean;
  transitionSpeed: string;
  hoverScale: number;
}

export interface Theme {
  name: string;
  author: string;
  version: string;
  type: 'dark' | 'light';
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
  components: ThemeComponents;
  effects: ThemeEffects;
}

interface ThemeContextType {
  theme: Theme | null;
  themeName: string;
  themeType: 'dark' | 'light';
  availableThemes: Array<{ name: string; author: string; type: string; category: string; windowEffect?: string; isCustom: boolean }>;
  loadTheme: (name: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
  layout: ThemeLayout | null;
  colors: ThemeColors | null;
  // Override management
  layoutOverrides: LayoutOverrides;
  colorOverrides: ColorOverrides;
  updateLayoutOverride: (overrides: LayoutOverrides) => Promise<void>;
  updateColorOverride: (overrides: ColorOverrides) => Promise<void>;
  resetLayoutOverrides: () => Promise<void>;
  resetColorOverrides: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Default theme as fallback
const defaultTheme: Theme = {
  name: 'Default Dark',
  author: 'SkellBR',
  version: '1.0.0',
  type: 'dark',
  colors: {
    background: { primary: '#0a0a0f', secondary: '#12121a', tertiary: '#1a1a25' },
    text: { primary: '#ffffff', secondary: '#a0a0b0', muted: '#606070' },
    accent: { primary: '#8b5cf6', hover: '#7c3aed', active: '#6d28d9' },
    player: { progress: '#8b5cf6', progressBackground: '#2a2a35', controls: '#ffffff' },
    sidebar: { background: '#08080c', itemHover: '#15151f', itemActive: '#8b5cf6' },
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'JetBrains Mono, monospace',
    sizes: { small: '12px', normal: '14px', medium: '16px', large: '20px', title: '28px' },
  },
  layout: {
    sidebar: { position: 'left', width: '240px', collapsedWidth: '70px' },
    player: { position: 'bottom', height: '90px' },
    header: { visible: true, height: '40px' },
  },
  components: {
    borderRadius: '8px',
    trackItem: { height: '60px', thumbnailSize: '48px', showDuration: true, showArtist: true },
    buttons: { borderRadius: '8px', style: 'filled' },
    scrollbar: { width: '8px', thumbColor: '#3a3a45', trackColor: 'transparent' },
  },
  effects: { blur: true, animations: true, transitionSpeed: '200ms', hoverScale: 1.02 },
};

// Helper to generate CSS gradient string
function generateGradientCSS(gradient: ThemeGradient | GradientConfig | undefined): string | null {
  if (!gradient || !gradient.enabled || !gradient.colors || gradient.colors.length < 2) {
    return null;
  }

  const stops = gradient.stops || gradient.colors.map((_, i) => (i / (gradient.colors!.length - 1)) * 100);
  const colorStops = gradient.colors.map((color, i) => `${color} ${stops[i] || 0}%`).join(', ');

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${colorStops})`;
  }

  return `linear-gradient(${gradient.angle || 180}deg, ${colorStops})`;
}

function applyThemeToCSS(
  theme: Theme,
  colorOverrides: ColorOverrides = {},
  layoutOverrides: LayoutOverrides = {}
): void {
  const root = document.documentElement;

  // Merge colors with overrides
  const colors = {
    background: { ...theme.colors.background, ...colorOverrides.background },
    text: { ...theme.colors.text, ...colorOverrides.text },
    accent: { ...theme.colors.accent, ...colorOverrides.accent },
    player: { ...theme.colors.player, ...colorOverrides.player },
    sidebar: { ...theme.colors.sidebar, ...colorOverrides.sidebar },
  };

  // Merge layout with overrides
  const layout = {
    sidebar: { ...theme.layout.sidebar, ...layoutOverrides.sidebar },
    player: { ...theme.layout.player, ...layoutOverrides.player },
    header: { ...theme.layout.header, ...layoutOverrides.header },
  };

  // Apply colors
  root.style.setProperty('--color-bg-primary', colors.background.primary);
  root.style.setProperty('--color-bg-secondary', colors.background.secondary);
  root.style.setProperty('--color-bg-tertiary', colors.background.tertiary);

  root.style.setProperty('--color-text-primary', colors.text.primary);
  root.style.setProperty('--color-text-secondary', colors.text.secondary);
  root.style.setProperty('--color-text-muted', colors.text.muted);

  root.style.setProperty('--color-accent-primary', colors.accent.primary);
  root.style.setProperty('--color-accent-hover', colors.accent.hover);
  root.style.setProperty('--color-accent-active', colors.accent.active);

  root.style.setProperty('--color-player-progress', colors.player.progress);
  root.style.setProperty('--color-player-progress-bg', colors.player.progressBackground);
  root.style.setProperty('--color-player-controls', colors.player.controls);

  root.style.setProperty('--color-sidebar-bg', colors.sidebar.background);
  root.style.setProperty('--color-sidebar-hover', colors.sidebar.itemHover);
  root.style.setProperty('--color-sidebar-active', colors.sidebar.itemActive);

  // Gradients - merge theme gradient with override gradient
  const bgGradient = colorOverrides.background?.gradient || theme.colors.background?.gradient;
  const sidebarGradient = colorOverrides.sidebar?.gradient || theme.colors.sidebar?.gradient;

  const bgGradientCSS = generateGradientCSS(bgGradient);
  const sidebarGradientCSS = generateGradientCSS(sidebarGradient);

  // Set gradient CSS variables (components will use these)
  root.style.setProperty('--bg-gradient', bgGradientCSS || 'none');
  root.style.setProperty('--bg-gradient-enabled', bgGradientCSS ? '1' : '0');
  root.style.setProperty('--sidebar-gradient', sidebarGradientCSS || 'none');
  root.style.setProperty('--sidebar-gradient-enabled', sidebarGradientCSS ? '1' : '0');

  // Fonts
  root.style.setProperty('--font-primary', theme.fonts.primary);
  root.style.setProperty('--font-secondary', theme.fonts.secondary);
  root.style.setProperty('--font-size-small', theme.fonts.sizes.small);
  root.style.setProperty('--font-size-normal', theme.fonts.sizes.normal);
  root.style.setProperty('--font-size-medium', theme.fonts.sizes.medium);
  root.style.setProperty('--font-size-large', theme.fonts.sizes.large);
  root.style.setProperty('--font-size-title', theme.fonts.sizes.title);

  // Layout
  root.style.setProperty('--sidebar-width', layout.sidebar.width);
  root.style.setProperty('--sidebar-collapsed-width', layout.sidebar.collapsedWidth);
  root.style.setProperty('--player-height', layout.player.height);
  root.style.setProperty('--header-height', layout.header.height);

  // Components
  root.style.setProperty('--border-radius', theme.components.borderRadius);
  root.style.setProperty('--transition-speed', theme.effects.transitionSpeed);
  root.style.setProperty('--hover-scale', theme.effects.hoverScale.toString());

  // Scrollbar
  root.style.setProperty('--scrollbar-width', theme.components.scrollbar.width);
  root.style.setProperty('--scrollbar-thumb', theme.components.scrollbar.thumbColor);
  root.style.setProperty('--scrollbar-track', theme.components.scrollbar.trackColor);
}

// Helper to merge layout with overrides
function getMergedLayout(theme: Theme | null, overrides: LayoutOverrides): ThemeLayout {
  const defaultLayout = theme?.layout || defaultTheme.layout;
  return {
    sidebar: { ...defaultLayout.sidebar, ...overrides.sidebar },
    player: { ...defaultLayout.player, ...overrides.player },
    header: { ...defaultLayout.header, ...overrides.header },
  };
}

// Helper to merge colors with overrides
function getMergedColors(theme: Theme | null, overrides: ColorOverrides): ThemeColors {
  const defaultColors = theme?.colors || defaultTheme.colors;
  return {
    background: { ...defaultColors.background, ...overrides.background },
    text: { ...defaultColors.text, ...overrides.text },
    accent: { ...defaultColors.accent, ...overrides.accent },
    player: { ...defaultColors.player, ...overrides.player },
    sidebar: { ...defaultColors.sidebar, ...overrides.sidebar },
  };
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState<string>('Default Dark');
  const [availableThemes, setAvailableThemes] = useState<Array<{ name: string; author: string; type: string; category: string; windowEffect?: string; isCustom: boolean }>>([]);
  const [layoutOverrides, setLayoutOverrides] = useState<LayoutOverrides>({});
  const [colorOverrides, setColorOverrides] = useState<ColorOverrides>({});

  // Refs to always have current values in callbacks
  const layoutOverridesRef = useRef<LayoutOverrides>({});
  const colorOverridesRef = useRef<ColorOverrides>({});
  const themeRef = useRef<Theme | null>(null);

  // Keep refs in sync with state
  useEffect(() => { layoutOverridesRef.current = layoutOverrides; }, [layoutOverrides]);
  useEffect(() => { colorOverridesRef.current = colorOverrides; }, [colorOverrides]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const loadTheme = useCallback(async (name: string) => {
    try {
      // Add transitioning class to disable transitions during theme change
      document.body.classList.add('theme-transitioning');

      let loadedTheme: Theme;

      if (window.electronAPI) {
        loadedTheme = await window.electronAPI.loadTheme(name);
      } else {
        // Fallback for development without Electron
        loadedTheme = defaultTheme;
      }

      setTheme(loadedTheme);
      setThemeName(loadedTheme.name);

      // Use current ref values for overrides (always up-to-date)
      applyThemeToCSS(loadedTheme, colorOverridesRef.current, layoutOverridesRef.current);

      // Apply window effect if specified (Windows only)
      if (window.electronAPI) {
        const effect = loadedTheme.windowEffect || 'none';
        window.electronAPI.setWindowEffect(effect);
      }

      // Save theme preference
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        await window.electronAPI.saveSettings({ ...settings, theme: name });
      }

      // Remove transitioning class after a short delay
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 50);
    } catch (error) {
      console.error('Failed to load theme:', error);
      setTheme(defaultTheme);
      applyThemeToCSS(defaultTheme);
    }
  }, []);

  const updateLayoutOverride = useCallback(async (overrides: LayoutOverrides) => {
    const currentOverrides = layoutOverridesRef.current;
    const newOverrides = { ...currentOverrides };

    // Deep merge for nested properties
    if (overrides.sidebar) {
      newOverrides.sidebar = { ...currentOverrides.sidebar, ...overrides.sidebar };
    }
    if (overrides.player) {
      newOverrides.player = { ...currentOverrides.player, ...overrides.player };
    }
    if (overrides.header) {
      newOverrides.header = { ...currentOverrides.header, ...overrides.header };
    }

    setLayoutOverrides(newOverrides);
    layoutOverridesRef.current = newOverrides;

    if (themeRef.current) {
      applyThemeToCSS(themeRef.current, colorOverridesRef.current, newOverrides);
    }

    // Save to settings
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({ ...settings, layoutOverrides: newOverrides });
    }
  }, []);

  const updateColorOverride = useCallback(async (overrides: ColorOverrides) => {
    const currentOverrides = colorOverridesRef.current;
    const newOverrides = { ...currentOverrides };

    // Deep merge for nested properties
    if (overrides.background) {
      newOverrides.background = { ...currentOverrides.background, ...overrides.background };
    }
    if (overrides.text) {
      newOverrides.text = { ...currentOverrides.text, ...overrides.text };
    }
    if (overrides.accent) {
      newOverrides.accent = { ...currentOverrides.accent, ...overrides.accent };
    }
    if (overrides.player) {
      newOverrides.player = { ...currentOverrides.player, ...overrides.player };
    }
    if (overrides.sidebar) {
      newOverrides.sidebar = { ...currentOverrides.sidebar, ...overrides.sidebar };
    }

    setColorOverrides(newOverrides);
    colorOverridesRef.current = newOverrides;

    if (themeRef.current) {
      applyThemeToCSS(themeRef.current, newOverrides, layoutOverridesRef.current);
    }

    // Save to settings
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({ ...settings, colorOverrides: newOverrides });
    }
  }, []);

  const resetLayoutOverrides = useCallback(async () => {
    setLayoutOverrides({});
    layoutOverridesRef.current = {};

    if (themeRef.current) {
      applyThemeToCSS(themeRef.current, colorOverridesRef.current, {});
    }
    // Save empty overrides to settings
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({ ...settings, layoutOverrides: undefined });
    }
  }, []);

  const resetColorOverrides = useCallback(async () => {
    setColorOverrides({});
    colorOverridesRef.current = {};

    if (themeRef.current) {
      applyThemeToCSS(themeRef.current, {}, layoutOverridesRef.current);
    }
    // Save empty overrides to settings
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      await window.electronAPI.saveSettings({ ...settings, colorOverrides: undefined });
    }
  }, []);

  const refreshThemes = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const themes = await window.electronAPI.getThemes();
        setAvailableThemes(themes);
      }
    } catch (error) {
      console.error('Error refreshing themes:', error);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        if (window.electronAPI) {
          // Load available themes
          const themes = await window.electronAPI.getThemes();
          setAvailableThemes(themes);

          // Load saved settings including overrides
          const settings = await window.electronAPI.getSettings();
          const savedLayoutOverrides = settings.layoutOverrides || {};
          const savedColorOverrides = settings.colorOverrides || {};

          // Update both state and refs
          setLayoutOverrides(savedLayoutOverrides);
          setColorOverrides(savedColorOverrides);
          layoutOverridesRef.current = savedLayoutOverrides;
          colorOverridesRef.current = savedColorOverrides;

          // Load saved theme
          const loadedTheme = await window.electronAPI.loadTheme(settings.theme || 'Default Dark');
          setTheme(loadedTheme);
          setThemeName(loadedTheme.name);
          themeRef.current = loadedTheme;

          applyThemeToCSS(loadedTheme, savedColorOverrides, savedLayoutOverrides);

          // Apply window effect if specified (Windows only)
          const effect = loadedTheme.windowEffect || 'none';
          window.electronAPI.setWindowEffect(effect);
        } else {
          // Fallback for development
          setTheme(defaultTheme);
          themeRef.current = defaultTheme;
          applyThemeToCSS(defaultTheme);
          setAvailableThemes([
            { name: 'Default Dark', author: 'SkellBR', type: 'dark', category: 'official', isCustom: false },
            { name: 'Default Light', author: 'SkellBR', type: 'light', category: 'official', isCustom: false },
          ]);
        }
      } catch (error) {
        console.error('Theme initialization error:', error);
        setTheme(defaultTheme);
        themeRef.current = defaultTheme;
        applyThemeToCSS(defaultTheme);
      }
    }

    init();
  }, []);

  const value: ThemeContextType = {
    theme,
    themeName,
    themeType: theme?.type || 'dark',
    availableThemes,
    loadTheme,
    refreshThemes,
    layout: getMergedLayout(theme, layoutOverrides),
    colors: getMergedColors(theme, colorOverrides),
    layoutOverrides,
    colorOverrides,
    updateLayoutOverride,
    updateColorOverride,
    resetLayoutOverrides,
    resetColorOverrides,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
