import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Minus, Square, X, Home, Music, Heart, ListMusic, Sliders, Settings, Download, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import Titlebar from './Titlebar';
import Sidebar from './Sidebar';
import Player from './Player';
import FirstUseWizard from './FirstUseWizard';

interface LayoutProps {
  children: ReactNode;
}

// Compact navigation items
const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/tracks', icon: Music, label: 'Faixas' },
  { path: '/favorites', icon: Heart, label: 'Favoritos' },
  { path: '/playlists', icon: ListMusic, label: 'Playlists' },
  { path: '/equalizer', icon: Sliders, label: 'Equalizador' },
  { path: '/downloader', icon: Download, label: 'Download' },
  { path: '/stats', icon: BarChart3, label: 'Estatísticas' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
];

export default function Layout({ children }: LayoutProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { layout } = useTheme();
  const [showWizard, setShowWizard] = useState(false);
  const [isCheckingFirstUse, setIsCheckingFirstUse] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    checkFirstUse();
    checkMaximized();

    // Listen for window state changes
    if (window.electronAPI?.onWindowStateChanged) {
      window.electronAPI.onWindowStateChanged((state) => {
        setIsMaximized(state.isMaximized);
      });
    }
  }, []);

  const checkMaximized = async () => {
    if (window.electronAPI) {
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    }
  };

  const checkFirstUse = async () => {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        // Show wizard if no music folder is set
        if (!settings.musicFolder) {
          setShowWizard(true);
        }
      }
    } catch (error) {
      console.error('Error checking first use:', error);
    }
    setIsCheckingFirstUse(false);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
  };

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const sidebarPosition = layout?.sidebar?.position || 'left';
  const sidebarVisible = layout?.sidebar?.visible ?? true;
  const playerPosition = layout?.player?.position || 'bottom';
  const headerVisible = layout?.header?.visible ?? true;

  // Check if gradient is enabled via CSS variable
  const bgStyle = useMemo(() => {
    // We'll use the CSS variable directly
    return {
      background: 'var(--bg-gradient, var(--color-bg-primary))',
      backgroundColor: 'var(--color-bg-primary)',
    };
  }, []);

  return (
    <div
      className="app-container flex flex-col h-screen overflow-hidden"
      style={bgStyle}
    >
      {/* First Use Wizard */}
      {showWizard && <FirstUseWizard onComplete={handleWizardComplete} />}

      {/* Custom Titlebar */}
      {headerVisible && <Titlebar />}

      {/* Drag region and floating window controls when titlebar is hidden */}
      {!headerVisible && (
        <>
          <div
            className="h-8 w-full bg-transparent absolute top-0 left-0 right-0 z-40"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          />
          {/* Floating window controls */}
          <div
            className="absolute top-2 right-2 z-50 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              title="Minimizar"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-red-500/20 text-text-secondary hover:text-red-500 transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left position */}
        {sidebarVisible && sidebarPosition === 'left' && <Sidebar position="left" />}

        {/* Content wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top navigation if sidebar is on top */}
          {sidebarVisible && sidebarPosition === 'top' && <Sidebar horizontal />}

          {/* Compact navigation bar when sidebar is hidden */}
          {!sidebarVisible && (
            <nav className="flex items-center gap-1 px-4 py-2 bg-bg-secondary border-b border-bg-tertiary overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-accent-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Player - Top position */}
          {playerPosition === 'top' && <Player />}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 animate-fadeIn">
            {children}
          </main>

          {/* Player - Bottom position (default) */}
          {playerPosition === 'bottom' && <Player />}
        </div>

        {/* Sidebar - Right position */}
        {sidebarVisible && sidebarPosition === 'right' && <Sidebar position="right" />}
      </div>
    </div>
  );
}
