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
        dedupe: ['react', 'react-dom', '@admin-core/preferences'],
    },
    // 优化依赖处理
    optimizeDeps: {
        // @admin-core/preferences 需要预构建，让图片资源被正确内联为 base64
        // @admin-core/preferences-react 排除预构建，以便 HMR 正常工作
        include: ['react', 'react-dom'],
        exclude: [
            '@admin-core/preferences',
            '@admin-core/preferences-react',
        ],
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
