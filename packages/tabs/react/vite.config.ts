import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

async function resolveDtsPlugin(options: Record<string, any>) {
  try {
    const { default: dts } = await import('vite-plugin-dts');
    return [dts(options)];
  } catch {
    console.warn(
      '[admin-core] vite-plugin-dts is unavailable, skip declaration generation in vite build.'
    );
    return [];
  }
}

export default defineConfig(async () => {
  const dtsPlugins = await resolveDtsPlugin({
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
    logLevel: 'silent',
    skipDiagnostics: true,
  });

  return {
    plugins: [react(), ...dtsPlugins],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCoreTabsReact',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'antd',
          '@admin-core/tabs-core',
        ],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            antd: 'antd',
            '@admin-core/tabs-core': 'AdminCoreTabsCore',
          },
        },
      },
      cssCodeSplit: false,
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: 'esbuild',
      target: 'es2020',
    },
  };
});
