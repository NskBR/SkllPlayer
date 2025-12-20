import { useEffect, useState, useCallback } from 'react';
import { Clock, Music, PlayCircle, TrendingUp, Heart } from 'lucide-react';
import { usePlayerStore, Track } from '../stores/playerStore';
import TrackList from '../components/TrackList';

interface Stats {
  totalTracks: number;
  totalListeningTime: number;
  playedTracks: number;
  neverPlayedTracks: number;
}

export default function HomePage(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const { setQueue } = usePlayerStore();

  const loadData = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const [statsData, topTracksData, favorites] = await Promise.all([
          window.electronAPI.getStats(),
          window.electronAPI.getTopTracks(5),
          window.electronAPI.getFavorites(),
        ]);
        setStats(statsData);
        setTopTracks(topTracksData);
        setFavoriteTracks(favorites.slice(0, 5));
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Welcome section */}
      <section>
        <h1 className="text-theme-title font-bold text-text-primary mb-2">
          Bem-vindo ao SkllPlayer
        </h1>
        <p className="text-text-secondary">
          Seu player de música pessoal
        </p>
      </section>

      {/* Stats cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Music className="w-6 h-6" />}
          label="Total de Músicas"
          value={stats?.totalTracks?.toString() || '0'}
          color="text-purple-400"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Tempo Ouvindo"
          value={formatListeningTime(stats?.totalListeningTime || 0)}
          color="text-blue-400"
        />
        <StatCard
          icon={<PlayCircle className="w-6 h-6" />}
          label="Músicas Tocadas"
          value={stats?.playedTracks?.toString() || '0'}
          color="text-green-400"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Nunca Tocadas"
          value={stats?.neverPlayedTracks?.toString() || '0'}
          color="text-orange-400"
        />
      </section>

      {/* Favorites */}
      {favoriteTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent-primary fill-current" />
              <h2 className="text-theme-large font-semibold text-text-primary">
                Favoritas
              </h2>
            </div>
            <a href="/favorites" className="text-sm text-accent-primary hover:text-accent-hover transition-colors">
              Ver todas
            </a>
          </div>
          <TrackList
            tracks={favoriteTracks}
            onPlay={(_track, index) => setQueue(favoriteTracks, index)}
            onTrackUpdate={loadData}
          />
        </section>
      )}

      {/* Top tracks */}
      {topTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-theme-large font-semibold text-text-primary">
              Mais Tocadas
            </h2>
            <a href="/tracks" className="text-sm text-accent-primary hover:text-accent-hover transition-colors">
              Ver todas
            </a>
          </div>
          <TrackList
            tracks={topTracks}
            onPlay={(_track, index) => setQueue(topTracks, index)}
            showPlayCount
            onTrackUpdate={loadData}
          />
        </section>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <QuickAction
          title="Todas as Músicas"
          description="Navegue por toda sua biblioteca"
          icon={<Music className="w-6 h-6" />}
          href="/tracks"
        />
        <QuickAction
          title="Criar Playlist"
          description="Organize suas músicas favoritas"
          icon={<PlayCircle className="w-6 h-6" />}
          href="/playlists"
        />
        <QuickAction
          title="Baixar Músicas"
          description="Adicione novas músicas"
          icon={<TrendingUp className="w-6 h-6" />}
          href="/downloader"
        />
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps): JSX.Element {
  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-bg-tertiary hover:border-accent-primary/30 transition-colors">
      <div className={`mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickAction({ title, description, icon, href }: QuickActionProps): JSX.Element {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 bg-bg-secondary rounded-xl border border-bg-tertiary hover:border-accent-primary/30 hover:bg-bg-tertiary transition-all group"
    >
      <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary group-hover:text-accent-primary transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </a>
  );
}
