import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
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
    },
});
