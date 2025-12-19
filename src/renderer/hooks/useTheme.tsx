import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
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
  availableThemes: Array<{ name: string; author: string; type: string; isCustom: boolean }>;
  loadTheme: (name: string) => Promise<void>;
  layout: ThemeLayout | null;
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

function applyThemeToCSS(theme: Theme): void {
  const root = document.documentElement;

  // Colors
  root.style.setProperty('--color-bg-primary', theme.colors.background.primary);
  root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary);
  root.style.setProperty('--color-bg-tertiary', theme.colors.background.tertiary);

  root.style.setProperty('--color-text-primary', theme.colors.text.primary);
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--color-text-muted', theme.colors.text.muted);

  root.style.setProperty('--color-accent-primary', theme.colors.accent.primary);
  root.style.setProperty('--color-accent-hover', theme.colors.accent.hover);
  root.style.setProperty('--color-accent-active', theme.colors.accent.active);

  root.style.setProperty('--color-player-progress', theme.colors.player.progress);
  root.style.setProperty('--color-player-progress-bg', theme.colors.player.progressBackground);
  root.style.setProperty('--color-player-controls', theme.colors.player.controls);

  root.style.setProperty('--color-sidebar-bg', theme.colors.sidebar.background);
  root.style.setProperty('--color-sidebar-hover', theme.colors.sidebar.itemHover);
  root.style.setProperty('--color-sidebar-active', theme.colors.sidebar.itemActive);

  // Fonts
  root.style.setProperty('--font-primary', theme.fonts.primary);
  root.style.setProperty('--font-secondary', theme.fonts.secondary);
  root.style.setProperty('--font-size-small', theme.fonts.sizes.small);
  root.style.setProperty('--font-size-normal', theme.fonts.sizes.normal);
  root.style.setProperty('--font-size-medium', theme.fonts.sizes.medium);
  root.style.setProperty('--font-size-large', theme.fonts.sizes.large);
  root.style.setProperty('--font-size-title', theme.fonts.sizes.title);

  // Layout
  root.style.setProperty('--sidebar-width', theme.layout.sidebar.width);
  root.style.setProperty('--sidebar-collapsed-width', theme.layout.sidebar.collapsedWidth);
  root.style.setProperty('--player-height', theme.layout.player.height);
  root.style.setProperty('--header-height', theme.layout.header.height);

  // Components
  root.style.setProperty('--border-radius', theme.components.borderRadius);
  root.style.setProperty('--transition-speed', theme.effects.transitionSpeed);
  root.style.setProperty('--hover-scale', theme.effects.hoverScale.toString());

  // Scrollbar
  root.style.setProperty('--scrollbar-width', theme.components.scrollbar.width);
  root.style.setProperty('--scrollbar-thumb', theme.components.scrollbar.thumbColor);
  root.style.setProperty('--scrollbar-track', theme.components.scrollbar.trackColor);
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState<string>('Default Dark');
  const [availableThemes, setAvailableThemes] = useState<Array<{ name: string; author: string; type: string; isCustom: boolean }>>([]);

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
      applyThemeToCSS(loadedTheme);

      // Save preference
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

  useEffect(() => {
    async function init() {
      try {
        if (window.electronAPI) {
          // Load available themes
          const themes = await window.electronAPI.getThemes();
          setAvailableThemes(themes);

          // Load saved theme from settings
          const settings = await window.electronAPI.getSettings();
          await loadTheme(settings.theme || 'Default Dark');
        } else {
          // Fallback for development
          setTheme(defaultTheme);
          applyThemeToCSS(defaultTheme);
          setAvailableThemes([
            { name: 'Default Dark', author: 'SkellBR', type: 'dark', isCustom: false },
            { name: 'Default Light', author: 'SkellBR', type: 'light', isCustom: false },
          ]);
        }
      } catch (error) {
        console.error('Theme initialization error:', error);
        setTheme(defaultTheme);
        applyThemeToCSS(defaultTheme);
      }
    }

    init();
  }, [loadTheme]);

  const value: ThemeContextType = {
    theme,
    themeName,
    themeType: theme?.type || 'dark',
    availableThemes,
    loadTheme,
    layout: theme?.layout || null,
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
