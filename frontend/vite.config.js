import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/hypervision-registration-page/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
