import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

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
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    staticImport: true,
    insertTypesEntry: true,
  });

  return {
    plugins: [vue(), tailwindcss(), ...dtsPlugins],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCoreLayoutVue',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: [
          'vue',
          '@admin-core/layout',
          '@admin-core/preferences',
          '@admin-core/preferences-vue',
          '@vueuse/core',
          '@floating-ui/vue',
        ],
        output: {
          globals: {
            vue: 'Vue',
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
