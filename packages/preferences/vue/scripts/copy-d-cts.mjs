#!/usr/bin/env node
/**
 * 复制 index.d.ts 为 index.d.cts，供 CJS 消费者类型解析。
 * 从包根目录执行：node scripts/copy-d-cts.mjs
 */
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..');
const src = join(pkgRoot, 'dist', 'index.d.ts');
const dest = join(pkgRoot, 'dist', 'index.d.cts');

if (!existsSync(src)) {
  console.warn('copy-d-cts: dist/index.d.ts not found, skip.');
  process.exit(0);
}
copyFileSync(src, dest);
console.log('copy-d-cts: dist/index.d.cts created.');
