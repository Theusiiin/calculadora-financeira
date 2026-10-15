import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base relativa: o mesmo build funciona no GitHub Pages (/calculadora-financeira/) e em qualquer subpasta.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
