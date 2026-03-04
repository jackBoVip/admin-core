import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

/**
 * form-vue CDN 库构建配置。
 */
export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreFormVue',
  packageName: '@admin-core/form-vue',
  plugins: [vue()],
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
});
