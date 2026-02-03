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
        // 确保只有一个模块实例
        dedupe: ['@admin-core/preferences'],
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
    // 优化依赖处理 - 使用 alias 指向 dist 后，不再需要特殊处理
    optimizeDeps: {
        include: ['vue', 'vue-router'],
        exclude: ['@admin-core/preferences'],
    },
    // CSS 配置
    css: {
        devSourcemap: true,
    },
    build: {
        chunkSizeWarningLimit: 2000,
    },
});
