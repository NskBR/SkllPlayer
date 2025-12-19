import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function Titlebar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    async function checkMaximized() {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    }

    checkMaximized();

    // Listen for window state changes
    const handleResize = () => checkMaximized();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <header className="flex items-center justify-between h-[var(--header-height)] bg-sidebar-bg border-b border-bg-tertiary select-none">
      {/* Drag region - left side */}
      <div className="flex items-center h-full px-4 drag-region flex-1">
        <div className="flex items-center gap-2 no-drag">
          {/* Logo */}
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-text-primary font-semibold text-sm">SkllPlayer</span>
        </div>
        <span className="ml-3 text-text-muted text-xs">v0.1 Build Test</span>
      </div>

      {/* Window controls */}
      <div className="flex items-center h-full">
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="h-full px-4 flex items-center justify-center hover:bg-bg-tertiary transition-colors no-drag"
          title="Minimizar"
        >
          <Minus className="w-4 h-4 text-text-secondary" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="h-full px-4 flex items-center justify-center hover:bg-bg-tertiary transition-colors no-drag"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
          ) : (
            <Square className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="h-full px-4 flex items-center justify-center hover:bg-red-600 transition-colors no-drag group"
          title="Fechar"
        >
          <X className="w-4 h-4 text-text-secondary group-hover:text-white" />
        </button>
      </div>
    </header>
  );
}
