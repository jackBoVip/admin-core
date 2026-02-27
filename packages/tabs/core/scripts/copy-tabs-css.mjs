import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const from = new URL('../src/styles/tabs.css', import.meta.url);
const to = new URL('../dist/styles/tabs.css', import.meta.url);
const fromPath = fileURLToPath(from);
const toPath = fileURLToPath(to);

mkdirSync(dirname(toPath), { recursive: true });
copyFileSync(fromPath, toPath);
