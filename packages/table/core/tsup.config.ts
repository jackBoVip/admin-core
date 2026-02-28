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
    packageName: '@admin-core/table-core',
    globalName: 'AdminCoreTableCore',
    copyEntries: [
      {
        from: 'src/styles/table.css',
        to: 'dist/styles/table.css',
        optional: true,
      },
      {
        from: 'src/styles/vxe-iconfont.css',
        to: 'dist/styles/vxe-iconfont.css',
        optional: true,
      },
      {
        from: 'src/styles/vxe-table-icon.woff2',
        to: 'dist/styles/vxe-table-icon.woff2',
        optional: true,
      },
    ],
  })
);
