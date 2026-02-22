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
            '@admin-core/preferences/styles/element': resolve(__dirname, '../../packages/preferences/core/src/styles/css/adapters/element.css'),
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
