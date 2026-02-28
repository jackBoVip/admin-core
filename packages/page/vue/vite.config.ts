import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCorePageVue',
  plugins: [vue()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    skipDiagnostics: true,
  },
  external: ['vue', '@admin-core/form-vue', '@admin-core/table-vue'],
  globals: {
    vue: 'Vue',
    '@admin-core/form-vue': 'AdminCoreFormVue',
    '@admin-core/table-vue': 'AdminCoreTableVue',
  },
});
