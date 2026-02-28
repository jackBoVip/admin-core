import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTabsVue',
  plugins: [vue()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    skipDiagnostics: true,
  },
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
});
