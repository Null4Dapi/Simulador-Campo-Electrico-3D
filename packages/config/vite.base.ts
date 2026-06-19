import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export const baseViteConfig = defineConfig({
  plugins: [react()],
  resolve: {
    // we assume tsconfigPaths might be needed per workspace 
    // but the plugin is usually imported per app if they want it.
  }
})
