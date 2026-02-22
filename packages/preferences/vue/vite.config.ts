import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

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

// NPM 构建配置
const npmConfig = defineConfig(async () => {
  const dtsPlugins = await resolveDtsPlugin({
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    rollupTypes: false,
    insertTypesEntry: true,
  });

  return {
    plugins: [vue(), ...dtsPlugins],
    resolve: {
      alias: {
        // 解析 core 包的资源文件，以便内联
        '@admin-core/preferences/assets': resolve(__dirname, '../core/src/assets'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCorePreferencesVue',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        // 将核心包作为外部依赖
        external: [
          'vue',
          '@admin-core/preferences',
        ],
        output: {
          globals: {
            vue: 'Vue',
            '@admin-core/preferences': 'AdminCorePreferences',
          },
          banner: '/* @admin-core/preferences-vue */',
        },
      },
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: 'esbuild',
      target: 'es2020',
      // 内联小于 100KB 的资源为 base64
      assetsInlineLimit: 102400,
    },
  };
});

export default npmConfig;
