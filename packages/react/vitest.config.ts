import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@nuk-ui/elements/prefix': fileURLToPath(
        new URL('../elements/src/prefix.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
  },
});
