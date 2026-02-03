import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'locales/zh-CN': 'src/locales/zh-CN.ts',
    'locales/en-US': 'src/locales/en-US.ts',
    'styles/index': 'src/styles/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: process.env.NODE_ENV !== 'production',
  treeshake: true,
  minify: true,
  target: 'es2020',
  external: ['@admin-core/preferences'],
});
