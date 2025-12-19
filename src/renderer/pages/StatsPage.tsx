import { useEffect, useState } from 'react';
import {
  Clock,
  Music,
  PlayCircle,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { Track } from '../stores/playerStore';
import { motion } from 'framer-motion';

interface Stats {
  totalTracks: number;
  totalListeningTime: number;
  playedTracks: number;
  neverPlayedTracks: number;
}

export default function StatsPage(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [neverPlayed, setNeverPlayed] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const [statsData, topTracksData, neverPlayedData] = await Promise.all([
          window.electronAPI.getStats(),
          window.electronAPI.getTopTracks(5),
          window.electronAPI.getNeverPlayedTracks(),
        ]);

        setStats(statsData);
        setTopTracks(topTracksData);
        setNeverPlayed(neverPlayedData.slice(0, 10)); // Show only first 10
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setIsLoading(false);
  };

  const formatTime = (seconds: number): { value: string; unit: string } => {
    if (seconds < 60) {
      return { value: seconds.toString(), unit: 'segundos' };
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return { value: mins.toString(), unit: 'minutos' };
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return { value: `${hours}h ${mins}m`, unit: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const listeningTime = formatTime(stats?.totalListeningTime || 0);

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Header */}
      <div>
        <h1 className="text-theme-title font-bold text-text-primary">Estatísticas</h1>
        <p className="text-text-secondary">Acompanhe seus hábitos de escuta</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Tempo Total Ouvindo"
          value={listeningTime.value}
          unit={listeningTime.unit}
          color="from-blue-500 to-cyan-600"
          delay={0}
        />
        <StatCard
          icon={<Music className="w-6 h-6" />}
          label="Total de Músicas"
          value={(stats?.totalTracks || 0).toString()}
          unit="faixas"
          color="from-purple-500 to-violet-600"
          delay={0.1}
        />
        <StatCard
          icon={<PlayCircle className="w-6 h-6" />}
          label="Músicas Tocadas"
          value={(stats?.playedTracks || 0).toString()}
          unit="faixas"
          color="from-green-500 to-emerald-600"
          delay={0.2}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Nunca Tocadas"
          value={(stats?.neverPlayedTracks || 0).toString()}
          unit="faixas"
          color="from-orange-500 to-amber-600"
          delay={0.3}
        />
      </div>

      {/* Top 5 most played */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Top 5 Mais Tocadas
            </h2>
            <p className="text-sm text-text-secondary">
              Suas músicas favoritas
            </p>
          </div>
        </div>

        {topTracks.length > 0 ? (
          <div className="space-y-3">
            {topTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-bg-tertiary"
              >
                {/* Rank */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-500 text-black'
                      : index === 1
                      ? 'bg-gray-300 text-black'
                      : index === 2
                      ? 'bg-orange-700 text-white'
                      : 'bg-bg-primary text-text-secondary'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-bg-primary flex items-center justify-center flex-shrink-0">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Music className="w-5 h-5 text-text-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {track.title}
                  </h4>
                  <p className="text-xs text-text-secondary truncate">
                    {track.artist || 'Artista desconhecido'}
                  </p>
                </div>

                {/* Play count */}
                <div className="text-right">
                  <p className="text-lg font-bold text-accent-primary">
                    {track.playCount}
                  </p>
                  <p className="text-xs text-text-muted">reproduções</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma música tocada ainda</p>
          </div>
        )}
      </section>

      {/* Never played tracks */}
      <section className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Nunca Tocadas
            </h2>
            <p className="text-sm text-text-secondary">
              Músicas esperando para serem descobertas
            </p>
          </div>
        </div>

        {neverPlayed.length > 0 ? (
          <>
            <div className="space-y-2">
              {neverPlayed.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Music className="w-4 h-4 text-text-muted" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-text-primary truncate">
                      {track.title}
                    </h4>
                    <p className="text-xs text-text-secondary truncate">
                      {track.artist || 'Artista desconhecido'}
                    </p>
                  </div>

                  {/* Added date */}
                  <p className="text-xs text-text-muted">
                    Adicionada em {new Date(track.addedAt).toLocaleDateString('pt-BR')}
                  </p>
                </motion.div>
              ))}
            </div>

            {(stats?.neverPlayedTracks || 0) > 10 && (
              <p className="text-center text-sm text-text-muted mt-4">
                E mais {(stats?.neverPlayedTracks || 0) - 10} músicas...
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Todas as músicas já foram tocadas!</p>
          </div>
        )}
      </section>

      {/* Listening insights */}
      <section className="bg-gradient-to-br from-accent-primary/20 to-accent-active/20 rounded-xl p-6 border border-accent-primary/30">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats && stats.totalTracks > 0 && (
            <>
              <InsightCard
                text={`Você já ouviu ${Math.round(
                  (stats.playedTracks / stats.totalTracks) * 100
                )}% da sua biblioteca`}
              />
              {stats.totalListeningTime > 3600 && (
                <InsightCard
                  text={`Isso equivale a ${Math.round(
                    stats.totalListeningTime / 3600
                  )} horas de música!`}
                />
              )}
              {topTracks.length > 0 && (
                <InsightCard
                  text={`Sua música favorita é "${topTracks[0].title}" com ${topTracks[0].playCount} reproduções`}
                />
              )}
              {stats.neverPlayedTracks > 0 && (
                <InsightCard
                  text={`Você ainda tem ${stats.neverPlayedTracks} músicas para descobrir`}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
  delay: number;
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
  delay,
}: StatCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary"
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4`}
      >
        {icon}
      </div>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-muted">{unit}</p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}

interface InsightCardProps {
  text: string;
}

function InsightCard({ text }: InsightCardProps): JSX.Element {
  return (
    <div className="p-4 rounded-lg bg-bg-primary/50 border border-accent-primary/20">
      <p className="text-sm text-text-primary">{text}</p>
    </div>
  );
}
