import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreLayoutVue',
  packageName: '@admin-core/layout-vue',
  plugins: [vue(), tailwindcss()],
  external: [
    'vue',
    'vue-router',
    '@admin-core/preferences-vue',
  ],
  globals: {
    vue: 'Vue',
    'vue-router': 'VueRouter',
    '@admin-core/preferences-vue': 'AdminCorePreferencesVue',
  },
});
