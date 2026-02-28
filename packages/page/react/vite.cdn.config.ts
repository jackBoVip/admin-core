import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCorePageReact',
  packageName: '@admin-core/page-react',
  plugins: [react()],
  external: [
    'react',
    'react-dom',
    '@admin-core/form-react',
    '@admin-core/table-react',
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    '@admin-core/form-react': 'AdminCoreFormReact',
    '@admin-core/table-react': 'AdminCoreTableReact',
  },
});
