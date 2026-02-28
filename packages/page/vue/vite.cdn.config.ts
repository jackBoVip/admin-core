import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCorePageVue',
  packageName: '@admin-core/page-vue',
  plugins: [vue()],
  external: ['vue', '@admin-core/form-vue', '@admin-core/table-vue'],
  globals: {
    vue: 'Vue',
    '@admin-core/form-vue': 'AdminCoreFormVue',
    '@admin-core/table-vue': 'AdminCoreTableVue',
  },
});
