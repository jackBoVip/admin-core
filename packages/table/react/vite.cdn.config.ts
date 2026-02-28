import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTableReact',
  packageName: '@admin-core/table-react',
  plugins: [react()],
  external: [
    'react',
    'react-dom',
    'antd',
    '@admin-core/form-react',
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
    '@admin-core/form-react': 'AdminCoreFormReact',
  },
});
