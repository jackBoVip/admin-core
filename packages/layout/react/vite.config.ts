import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createLibraryViteConfig } from '../../../internal/build-config/vite.js';

export default createLibraryViteConfig({
  entry: resolve(__dirname, 'src/index.ts'),
  name: 'AdminCoreLayoutReact',
  plugins: [react(), tailwindcss()],
  dts: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react-router-dom',
    '@admin-core/preferences-react',
    '@floating-ui/react',
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
});
