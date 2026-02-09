import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
 
    },
    // 确保 monorepo 中依赖正确去重
    dedupe: ['react', 'react-dom'],
  },
  // 优化依赖处理
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    port: 3001,
    open: true,
    // 监听依赖包变化
    watch: {
      ignored: ['!**/node_modules/@admin-core/**'],
    },
  },
  // CSS 配置
  css: {
    devSourcemap: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
