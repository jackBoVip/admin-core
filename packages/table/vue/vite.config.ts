import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTableVue',
  plugins: [vue()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    // build 脚本已先执行 vue-tsc --noEmit，声明阶段跳过重复诊断，避免噪音
    skipDiagnostics: true,
  },
  external: [
    'vue',
    '@admin-core/form-vue',
    'vxe-table',
    'vxe-pc-ui',
  ],
  globals: {
    vue: 'Vue',
  },
});
