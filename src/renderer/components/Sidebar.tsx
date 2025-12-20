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
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  horizontal?: boolean;
}

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  section?: string;
  color?: string;
}

const navItems: NavItem[] = [
  // Biblioteca - itens principais
  { path: '/', icon: Home, label: 'Início', section: 'Biblioteca', color: 'text-blue-400' },
  { path: '/tracks', icon: Music, label: 'Faixas', section: 'Biblioteca', color: 'text-green-400' },
  { path: '/favorites', icon: Heart, label: 'Favoritas', section: 'Biblioteca', color: 'text-pink-400' },
  // Gerenciamento - ferramentas e configurações
  { path: '/playlists', icon: ListMusic, label: 'Playlists', section: 'Gerenciamento', color: 'text-purple-400' },
  { path: '/equalizer', icon: Sliders, label: 'Equalizador', section: 'Gerenciamento', color: 'text-orange-400' },
  { path: '/downloader', icon: Download, label: 'Download', section: 'Gerenciamento', color: 'text-cyan-400' },
  { path: '/stats', icon: BarChart3, label: 'Estatísticas', section: 'Gerenciamento', color: 'text-yellow-400' },
  { path: '/settings', icon: Settings, label: 'Configurações', section: 'Gerenciamento', color: 'text-gray-400' },
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
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
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
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg border-r border-bg-tertiary transition-all duration-300 ${
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-bg-tertiary ${collapsed ? 'justify-center' : ''}`}>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-accent-primary/20"
        >
          <img
            src="/Icon/Icone.png"
            alt="SkllPlayer"
            className="w-full h-full object-contain"
          />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold text-text-primary tracking-tight">SkllPlayer</h1>
              <p className="text-xs text-text-muted">v0.1</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30'
                          : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Icon with color and glow effect */}
                      <motion.span
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        className={`relative z-10 transition-all duration-300 ${
                          isActive ? 'text-white' : `${item.color} group-hover:drop-shadow-[0_0_8px_currentColor]`
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.span>

                      {/* Label */}
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 inset-y-0 my-auto w-1 h-5 bg-white rounded-r-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}

                      {/* Hover glow background */}
                      {!isActive && (
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r from-transparent ${item.color?.replace('text-', 'via-')} to-transparent`} />
                      )}
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
        </motion.button>
      </div>
    </aside>
  );
}
