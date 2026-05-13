import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.js'],
    include: ['tests/unit/**/*.test.js'],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
