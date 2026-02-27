import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
var alias = [
    {
        find: /^@\//,
        replacement: "".concat(resolve(__dirname, 'src'), "/"),
    },
];
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: alias,
        // 确保 monorepo 中依赖正确去重
        dedupe: ['react', 'react-dom'],
    },
    // 优化依赖处理
    optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: [
            '@admin-core/form-react',
            '@admin-core/layout-react',
            '@admin-core/page-core',
            '@admin-core/page-react',
            '@admin-core/preferences',
            '@admin-core/preferences-react',
            '@admin-core/table-react',
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
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    var normalized = id.replace(/\\/g, '/');
                    if (normalized.includes('/packages/layout/') ||
                        normalized.includes('/node_modules/@admin-core/layout')) {
                        return 'admin-layout';
                    }
                    if (normalized.includes('/packages/preferences/') ||
                        normalized.includes('/node_modules/@admin-core/preferences')) {
                        return 'admin-preferences';
                    }
                    if (normalized.includes('/node_modules/@floating-ui/')) {
                        return 'vendor-floating-ui';
                    }
                    if (normalized.includes('/node_modules/react-router')) {
                        return 'vendor-react-router';
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
