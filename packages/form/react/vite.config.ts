import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreFormReact',
  plugins: [react()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
  },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
});
