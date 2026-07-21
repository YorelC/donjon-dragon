import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@donjon-dragon/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});