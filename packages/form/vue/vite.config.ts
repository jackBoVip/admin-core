import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreFormVue',
  plugins: [vue()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
  },
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
});
