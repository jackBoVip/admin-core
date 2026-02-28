import { fileURLToPath, URL } from 'node:url';

import { createCoreVitestConfig } from '../../vitest.js';

export default createCoreVitestConfig({
  resolve: {
    alias: {
      '@admin-core/preferences': fileURLToPath(
        new URL('../../../../packages/preferences/core/src/index.ts', import.meta.url)
      ),
    },
  },
});
