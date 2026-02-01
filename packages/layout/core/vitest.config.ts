import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@admin-core/preferences': fileURLToPath(
        new URL('../../preferences/core/src/index.ts', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
  },
});
