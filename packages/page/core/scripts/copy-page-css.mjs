import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const from = new URL('../src/styles/page.css', import.meta.url);
const to = new URL('../dist/styles/page.css', import.meta.url);
const fromPath = fileURLToPath(from);
const toPath = fileURLToPath(to);

mkdirSync(dirname(toPath), { recursive: true });
copyFileSync(fromPath, toPath);
