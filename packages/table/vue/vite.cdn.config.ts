import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTableVue',
  packageName: '@admin-core/table-vue',
  plugins: [vue()],
  external: [
    'vue',
    'vxe-table',
    'vxe-pc-ui',
    '@admin-core/form-vue',
  ],
  globals: {
    vue: 'Vue',
    'vxe-table': 'VXETable',
    'vxe-pc-ui': 'VxeUI',
    '@admin-core/form-vue': 'AdminCoreFormVue',
  },
});
