/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['./tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['./tests/unit/**', './tests/e2e/**'],
    globals: true,
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**',
      ],
    },
    // Longer timeout for blockchain interactions
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@local-contracts': path.resolve(__dirname, '../hardhat'),
    },
  },
})
