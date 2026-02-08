import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: [
        'src/core/**/*.{ts}',
        'src/hooks/**/*.{ts,tsx}',
        'src/models/**/*.{ts}',
        'src/store/**/*.{ts}',
      ],
      exclude: ['src/test/**', '**/*.d.ts', '**/index.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
