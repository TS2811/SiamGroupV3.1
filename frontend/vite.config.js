import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/v3_1/frontend/',
  server: {
    port: 5173,
    proxy: {
      '/v3_1/backend/api': {
        target: 'http://localhost',
        changeOrigin: true,
        // Forward cookies ระหว่าง Vite (5173) กับ XAMPP (80)
        cookieDomainRewrite: 'localhost',
        secure: false,
      }
    }
  }
})
