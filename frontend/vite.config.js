import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.mjs', // 🔧 important pour Tailwind CSS avec PostCSS séparé
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000/api'),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    },
    port: 5173,
    strictPort: true,
    historyApiFallback: true // 👈 Ajout du fallback pour React Router
  },
})
