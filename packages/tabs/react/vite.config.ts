import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreTabsReact',
  plugins: [react()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    skipDiagnostics: true,
  },
  external: ['react', 'react-dom', 'react/jsx-runtime', 'antd'],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
  },
});
