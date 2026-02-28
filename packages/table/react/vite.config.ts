import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTableReact',
  plugins: [react()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    // 由 build 脚本先执行 tsc --noEmit，声明生成阶段不重复打印诊断噪音
    skipDiagnostics: true,
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'antd',
    '@admin-core/form-react',
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
});
