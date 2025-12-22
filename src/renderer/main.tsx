import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import './styles/index.css';

// Handle rounded corners based on window state and window effect
const updateWindowCorners = async () => {
  if (!window.electronAPI) return;

  const isMaximized = await window.electronAPI.isMaximized();
  if (isMaximized) {
    document.documentElement.classList.add('window-maximized');
  } else {
    document.documentElement.classList.remove('window-maximized');
  }
};

// Listen for window state changes
if (window.electronAPI?.onWindowStateChanged) {
  window.electronAPI.onWindowStateChanged((state) => {
    if (state.isMaximized || state.isFullScreen) {
      document.documentElement.classList.add('window-maximized');
    } else {
      document.documentElement.classList.remove('window-maximized');
    }
  });
}

// Track window effect for rounded corners
// Acrylic/mica effects don't support rounded corners on Windows
window.addEventListener('window-effect-changed', ((e: CustomEvent) => {
  const effect = e.detail;
  if (effect === 'acrylic' || effect === 'mica' || effect === 'tabbed') {
    document.documentElement.classList.add('has-window-effect');
  } else {
    document.documentElement.classList.remove('has-window-effect');
  }
}) as EventListener);

// Initial check after render
setTimeout(updateWindowCorners, 100);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
