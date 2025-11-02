
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Update 'base' to match your GitHub repo name if different.
export default defineConfig({
  plugins: [react()],
  base: '/cyclesense-frontend/',
})
