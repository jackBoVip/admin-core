import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createCdnLibraryConfig } from '../../../internal/build-config/vite.js';

export default createCdnLibraryConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreLayoutReact',
  packageName: '@admin-core/layout-react',
  plugins: [react(), tailwindcss()],
  external: [
    'react',
    'react-dom',
    'react-router-dom',
    '@admin-core/preferences-react',
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-router-dom': 'ReactRouterDOM',
    '@admin-core/preferences-react': 'AdminCorePreferencesReact',
  },
});
