import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/RS-Gifts-admin/',
  plugins: [
    react(),
    {
      name: 'serve-root-images-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/images/') || req.url === '/favicon.svg')) {
            req.url = '/RS-Gifts-admin' + req.url;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
