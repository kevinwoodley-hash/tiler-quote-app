import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Auto-detects GitHub repo name for correct base path on GitHub Pages
// e.g. github.com/yourname/tiler-quote-app → base = '/tiler-quote-app/'
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
