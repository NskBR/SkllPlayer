import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'src/renderer',
  publicDir: '../../Public',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@pages': path.resolve(__dirname, './src/renderer/pages'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@stores': path.resolve(__dirname, './src/renderer/stores'),
      '@utils': path.resolve(__dirname, './src/renderer/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './assets'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
