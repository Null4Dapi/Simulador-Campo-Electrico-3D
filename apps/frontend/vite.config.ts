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
  }
})
