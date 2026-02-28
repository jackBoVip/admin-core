#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const PACKAGES_DIR = join(ROOT, 'packages');
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'coverage']);

function hasAllowedExtension(file) {
  for (const ext of ALLOWED_EXTENSIONS) {
    if (file.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

function collectFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(name)) {
        continue;
      }
      collectFiles(abs, out);
      continue;
    }
    if (!hasAllowedExtension(name)) {
      continue;
    }
    out.push(abs);
  }
  return out;
}

function hashFile(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

if (!statSync(PACKAGES_DIR).isDirectory()) {
  console.error('packages directory not found');
  process.exit(1);
}

const files = collectFiles(PACKAGES_DIR);
const groups = new Map();

for (const file of files) {
  const hash = hashFile(file);
  const list = groups.get(hash) ?? [];
  list.push(file);
  groups.set(hash, list);
}

const duplicates = [...groups.values()]
  .filter((list) => list.length > 1)
  .sort((a, b) => b.length - a.length);

if (duplicates.length === 0) {
  console.log('OK: no duplicated files detected in packages/**');
  process.exit(0);
}

console.error(`Found ${duplicates.length} duplicate content group(s) in packages/**:`);
for (const list of duplicates) {
  console.error(`- group (${list.length})`);
  for (const file of list.sort()) {
    console.error(`  ${relative(ROOT, file)}`);
  }
}
process.exit(1);
