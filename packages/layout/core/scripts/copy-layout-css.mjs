import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('src/styles/layout.css');
const target = resolve('dist/styles/layout.css');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
