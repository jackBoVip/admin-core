import { defineConfig } from 'tsup';
import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default defineConfig(
  createCoreLibraryTsupConfig({
    entry: {
      index: 'src/index.ts',
      'styles/index': 'src/styles/index.ts',
    },
    packageName: '@admin-core/tabs-core',
    globalName: 'AdminCoreTabsCore',
    copyEntries: [
      {
        from: 'src/styles/tabs.css',
        to: 'dist/styles/tabs.css',
      },
    ],
  })
);
