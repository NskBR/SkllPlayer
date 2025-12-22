import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TracksPage from './pages/TracksPage';
import FavoritesPage from './pages/FavoritesPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import EqualizerPage from './pages/EqualizerPage';
import SettingsPage from './pages/SettingsPage';
import DownloaderPage from './pages/DownloaderPage';
import StatsPage from './pages/StatsPage';

function App(): JSX.Element {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+, or Ctrl+. to open settings (failsafe when sidebar/titlebar hidden)
      if (e.ctrlKey && (e.key === ',' || e.key === '.')) {
        e.preventDefault();
        navigate('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Show loading while theme is loading
  if (!theme) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracks" element={<TracksPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
        <Route path="/equalizer" element={<EqualizerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/downloader" element={<DownloaderPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
