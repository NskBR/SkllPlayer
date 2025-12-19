import { ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import Titlebar from './Titlebar';
import Sidebar from './Sidebar';
import Player from './Player';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const { layout } = useTheme();

  const sidebarPosition = layout?.sidebar.position || 'left';
  const playerPosition = layout?.player.position || 'bottom';

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Custom Titlebar */}
      <Titlebar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left position */}
        {sidebarPosition === 'left' && <Sidebar />}

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
        {sidebarPosition === 'right' && <Sidebar />}
      </div>
    </div>
  );
}
