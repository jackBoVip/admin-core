import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreLayoutVue',
  plugins: [vue(), tailwindcss()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
  },
  external: [
    'vue',
    '@admin-core/preferences-vue',
    '@vueuse/core',
    '@floating-ui/vue',
  ],
  globals: {
    vue: 'Vue',
  },
});
