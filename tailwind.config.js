/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors via CSS variables
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-active': 'var(--color-accent-active)',
        'sidebar-bg': 'var(--color-sidebar-bg)',
        'sidebar-hover': 'var(--color-sidebar-hover)',
        'sidebar-active': 'var(--color-sidebar-active)',
        'player-progress': 'var(--color-player-progress)',
        'player-progress-bg': 'var(--color-player-progress-bg)',
      },
      fontFamily: {
        'primary': 'var(--font-primary)',
        'secondary': 'var(--font-secondary)',
      },
      fontSize: {
        'theme-small': 'var(--font-size-small)',
        'theme-normal': 'var(--font-size-normal)',
        'theme-medium': 'var(--font-size-medium)',
        'theme-large': 'var(--font-size-large)',
        'theme-title': 'var(--font-size-title)',
      },
      borderRadius: {
        'theme': 'var(--border-radius)',
      },
      transitionDuration: {
        'theme': 'var(--transition-speed)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
        'player': 'var(--player-height)',
        'header': 'var(--header-height)',
      },
    },
  },
  plugins: [],
}
