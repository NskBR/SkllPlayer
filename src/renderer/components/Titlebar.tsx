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
    <header className="relative flex items-center h-[var(--header-height)] bg-sidebar-bg border-b border-bg-tertiary select-none drag-region">
      {/* Centered title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-text-primary font-semibold text-sm">SkllPlayer</span>
        <span className="ml-2 text-text-muted text-xs">v0.1</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Window controls */}
      <div className="flex items-center h-full relative z-10">
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
