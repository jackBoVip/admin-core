import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTabsVue',
  packageName: '@admin-core/tabs-vue',
  plugins: [vue()],
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
});
