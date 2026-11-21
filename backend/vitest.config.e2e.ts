import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Real database calls (a remote Postgres) plus bcrypt hashing are slow.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
