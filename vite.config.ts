
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to your repo name for GitHub Pages (e.g. '/cyclesense-frontend/')
export default defineConfig({
  plugins: [react()],
  base: '/cyclesense-frontend/'
})
