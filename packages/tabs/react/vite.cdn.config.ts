import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTabsReact',
  packageName: '@admin-core/tabs-react',
  plugins: [react()],
  external: ['react', 'react-dom', 'antd'],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
  },
});
