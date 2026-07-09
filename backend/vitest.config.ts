import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    pool: 'threads',          // run test files in parallel
    testTimeout: 10000,       // 10 s per test (default is 5 s)
  },
});
