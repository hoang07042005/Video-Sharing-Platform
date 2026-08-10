import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'videoplatform.com',
    port: 80,
    proxy: {
      '/api': {
        target: 'http://localhost:5139',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
