import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seo from './plugins/seo'
import { siteConfig } from './src/config/site'

export default defineConfig({
  plugins: [react(), seo(siteConfig)],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the heavy, rarely-changing libraries out of the app bundle so
        // they cache independently of portfolio content edits.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          icons: ['react-icons/fa', 'react-icons/fi', 'react-icons/si'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
