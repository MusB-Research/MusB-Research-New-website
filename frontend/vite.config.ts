import { defineConfig } from 'vite'
// restart triggered
import react from '@vitejs/plugin-react'
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          lucide: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    open: true,
    proxy: {
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
