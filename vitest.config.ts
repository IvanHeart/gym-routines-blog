import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'next/link' shim: next/dist/client/link.js is not bundled in this install;
      // this alias replaces it globally in the test environment with a plain <a> shim.
      'next/link': path.resolve(__dirname, './src/test/__mocks__/next/link.tsx'),
    },
  },
})
