import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // tldraw uses some large dependencies — increase the chunk warning limit
  build: {
    chunkSizeWarningLimit: 3000,
  },
  optimizeDeps: {
    // Ensure tldraw is pre-bundled for faster dev server HMR
    include: ['tldraw'],
  },
})