import { defineConfig } from 'tsup';
import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default defineConfig(
  createCoreLibraryTsupConfig({
    entry: {
      index: 'src/index.ts',
      'styles/index': 'src/styles/index.ts',
      'locales/zh-CN': 'src/locales/zh-CN.ts',
      'locales/en-US': 'src/locales/en-US.ts',
    },
    packageName: '@admin-core/page-core',
    globalName: 'AdminCorePageCore',
    copyEntries: [
      {
        from: 'src/styles/page.css',
        to: 'dist/styles/page.css',
      },
    ],
  })
);
