import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/v3_1/frontend/',
  server: {
    port: 5173,
    proxy: {
      '/v3_1/backend/api': {
        target: 'http://localhost',
        changeOrigin: true,
      }
    }
  }
})
