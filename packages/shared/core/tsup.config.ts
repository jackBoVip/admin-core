import { defineConfig } from 'tsup';
import { stripJSDocCommentsFromDist } from '../../../internal/build-config/tsup.js';

/**
 * shared-core 包构建配置。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      removeComments: true,
    },
  },
  clean: true,
  sourcemap: process.env.NODE_ENV !== 'production',
  treeshake: true,
  minify: true,
  target: 'es2020',
  esbuildOptions(options) {
    options.legalComments = 'none';
  },
  onSuccess() {
    stripJSDocCommentsFromDist();
  },
});
