import { defineConfig } from 'tsup';
import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default defineConfig(
  createCoreLibraryTsupConfig({
    entry: {
      index: 'src/index.ts',
      'locales/zh-CN': 'src/locales/zh-CN.ts',
      'locales/en-US': 'src/locales/en-US.ts',
      'styles/index': 'src/styles/index.ts',
    },
    packageName: '@admin-core/layout',
    globalName: 'AdminCoreLayout',
    external: ['@admin-core/preferences'],
    noExternal: ['@admin-core/preferences'],
    copyEntries: [
      {
        from: 'src/styles/layout.css',
        to: 'dist/styles/layout.css',
      },
    ],
  })
);
