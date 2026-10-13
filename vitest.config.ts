import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Bound simultaneous DOM/catalog suites on the two-core CI runner.
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'jsdom',
          include: ['tests/integration/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup.ts'],
        },
      },
    ],
  },
});
