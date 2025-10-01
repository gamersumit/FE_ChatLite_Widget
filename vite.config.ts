import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    cors: true,
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'widget.[hash].js',
        chunkFileNames: 'widget.[hash].js',
        assetFileNames: 'widget.[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    },
    minify: true,
    target: 'es2015',
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
