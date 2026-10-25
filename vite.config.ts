/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo '' para leer API_PROXY_TARGET (sin VITE_): solo lo usa el servidor de desarrollo, nunca llega al navegador.
  const entorno = loadEnv(mode, process.cwd(), '')
  const destinoApi = entorno.API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      proxy: {
        '/api': { target: destinoApi, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        '/api': { target: destinoApi, changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/pruebas/configurar.ts'],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/componentes/ui/**', 'src/api/esquema.d.ts', 'src/main.tsx', 'src/**/*.test.{ts,tsx}'],
      },
    },
  }
})
