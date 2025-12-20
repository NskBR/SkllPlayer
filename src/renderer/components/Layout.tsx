import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import Titlebar from './Titlebar';
import Sidebar from './Sidebar';
import Player from './Player';
import FirstUseWizard from './FirstUseWizard';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const { layout } = useTheme();
  const [showWizard, setShowWizard] = useState(false);
  const [isCheckingFirstUse, setIsCheckingFirstUse] = useState(true);

  useEffect(() => {
    checkFirstUse();
  }, []);

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

  const sidebarPosition = layout?.sidebar.position || 'left';
  const playerPosition = layout?.player.position || 'bottom';
  const headerVisible = layout?.header.visible ?? true;

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
      className="flex flex-col h-screen overflow-hidden"
      style={bgStyle}
    >
      {/* First Use Wizard */}
      {showWizard && <FirstUseWizard onComplete={handleWizardComplete} />}

      {/* Custom Titlebar */}
      {headerVisible && <Titlebar />}

      {/* Drag region when titlebar is hidden */}
      {!headerVisible && (
        <div
          className="h-6 w-full bg-transparent absolute top-0 left-0 right-0 z-50"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left position */}
        {sidebarPosition === 'left' && <Sidebar position="left" />}

        {/* Content wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top navigation if sidebar is on top */}
          {sidebarPosition === 'top' && <Sidebar horizontal />}

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
        {sidebarPosition === 'right' && <Sidebar position="right" />}
      </div>
    </div>
  );
}
