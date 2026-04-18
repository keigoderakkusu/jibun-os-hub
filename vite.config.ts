import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages の場合はリポジトリ名がパスになる
  // ローカル or Renderでは '/' のまま
  base: process.env.DEPLOY_TARGET === 'github' ? '/jibun-os-hub/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5500,
    strictPort: true, host: true, allowedHosts: true, cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
