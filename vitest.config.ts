import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@multi-claw/shared-memory-core': resolve(__dirname, 'plugins/shared-memory-core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['plugins/shared-memory-core/src/**/*.ts'],
      exclude: ['plugins/shared-memory-core/src/index.ts'],
    },
    testTimeout: 15000,
  },
});
