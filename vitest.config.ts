import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
