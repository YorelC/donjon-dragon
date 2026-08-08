import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    // Doit rester aligne sur les "paths" de tsconfig.json.
    alias: {
      '@donjon-dragon/shared': path.resolve(__dirname, '../shared/src'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@kernel': path.resolve(__dirname, 'src/kernel'),
      '@modules': path.resolve(__dirname, 'src/modules'),
    },
  },
});