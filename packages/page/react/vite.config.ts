import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCorePageReact',
  plugins: [react()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    skipDiagnostics: true,
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
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
