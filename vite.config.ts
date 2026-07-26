import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const BACKEND = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    // Same-origin in dev: the app always calls /api/*, so no CORS preflight and no base-url branching.
    proxy: { '/api': { target: BACKEND, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: BACKEND, changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
