import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCorePageReact',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          '@admin-core/form-react',
          '@admin-core/page-core',
          '@admin-core/table-react',
        ],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            '@admin-core/form-react': 'AdminCoreFormReact',
            '@admin-core/page-core': 'AdminCorePageCore',
            '@admin-core/table-react': 'AdminCoreTableReact',
          },
          banner: isDev
            ? '/* @admin-core/page-react - CDN Development Build */'
            : '/* @admin-core/page-react - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});
