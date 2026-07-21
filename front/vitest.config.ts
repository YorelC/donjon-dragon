import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@donjon-dragon/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});