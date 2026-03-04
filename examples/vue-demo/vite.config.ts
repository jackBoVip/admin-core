import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

/**
 * Vite 路径别名配置。
 * @description 将 `@/` 统一映射到示例项目 `src` 目录。
 */
const alias = [
  {
    find: /^@\//,
    replacement: `${resolve(__dirname, 'src')}/`,
  },
];

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias,
  },
  server: {
    port: 3000,
    open: true,
    // 监听依赖包变化
    watch: {
      // 监听 monorepo 中的包（默认 node_modules 被忽略）
      ignored: ['!**/node_modules/@admin-core/**'],
    },
  },
  // 优化依赖处理
  optimizeDeps: {
    include: ['vue', 'vue-router'],
  },
  // CSS 配置
  css: {
    devSourcemap: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        /**
         * 自定义 Rollup 分包策略。
         * @description 将布局、偏好设置与核心三方库拆分为稳定 chunk，降低主包体积波动。
         *
         * @param id 模块文件路径（绝对路径）。
         * @returns 命中规则时返回 chunk 名称，否则返回 `undefined` 交由 Rollup 默认处理。
         */
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('/packages/layout/') ||
            normalized.includes('/node_modules/@admin-core/layout')
          ) {
            return 'admin-layout';
          }
          if (
            normalized.includes('/packages/preferences/') ||
            normalized.includes('/node_modules/@admin-core/preferences')
          ) {
            return 'admin-preferences';
          }
          if (normalized.includes('/node_modules/vue/') || normalized.includes('/node_modules/@vue/')) {
            return 'vendor-vue';
          }
          if (normalized.includes('/node_modules/vue-router/')) {
            return 'vendor-vue-router';
          }
          if (normalized.includes('/node_modules/@floating-ui/')) {
            return 'vendor-floating-ui';
          }
          if (normalized.includes('/node_modules/')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
