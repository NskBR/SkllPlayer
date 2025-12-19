import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Music,
  Heart,
  ListMusic,
  Sliders,
  Settings,
  Download,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  horizontal?: boolean;
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  section?: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: <Home className="w-5 h-5" />, label: 'Início', section: 'Biblioteca' },
  { path: '/tracks', icon: <Music className="w-5 h-5" />, label: 'Faixas', section: 'Biblioteca' },
  { path: '/favorites', icon: <Heart className="w-5 h-5" />, label: 'Favoritas', section: 'Biblioteca' },
  { path: '/playlists', icon: <ListMusic className="w-5 h-5" />, label: 'Playlists', section: 'Playlists' },
  { path: '/equalizer', icon: <Sliders className="w-5 h-5" />, label: 'Equalizador', section: 'Equalizador' },
  { path: '/downloader', icon: <Download className="w-5 h-5" />, label: 'Download', section: 'Download' },
  { path: '/stats', icon: <BarChart3 className="w-5 h-5" />, label: 'Estatísticas', section: 'Estatísticas' },
  { path: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Configurações', section: 'Configurações' },
];

export default function Sidebar({ horizontal = false }: SidebarProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Group items by section
  const sections = navItems.reduce((acc, item) => {
    const section = item.section || 'Outros';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  if (horizontal) {
    return (
      <nav className="flex items-center gap-1 px-4 py-2 bg-sidebar-bg border-b border-bg-tertiary">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
              }`
            }
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg border-r border-bg-tertiary transition-all duration-300 ${
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName} className="mb-4">
            {/* Section header */}
            <AnimatePresence>
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
                >
                  {sectionName}
                </motion.h3>
              )}
            </AnimatePresence>

            {/* Section items */}
            <ul className="space-y-1 px-2">
              {items.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-accent-primary text-white'
                          : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-bg-tertiary">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
