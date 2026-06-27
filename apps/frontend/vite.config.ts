import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // alias @ maps to src
    alias: {
      '@': '/src'
    },
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'zustand']
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) {
            return 'three-core';
          }
          if (id.includes('node_modules/@react-three/')) {
            return 'react-three';
          }
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/framer-motion/') || id.includes('node_modules/katex/')) {
            return 'ui-vendor';
          }
        }
      }
    }
  }
})
