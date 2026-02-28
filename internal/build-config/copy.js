/**
 * Shared file copy helpers for build scripts.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * @typedef {{from: string; to: string; optional?: boolean}} CopyFileEntry
 */

/**
 * @param {CopyFileEntry[]} entries
 * @param {{cwd?: string}} [options]
 */
export function copyFiles(entries, options = {}) {
  const cwd = options.cwd ?? process.cwd();

  for (const entry of entries) {
    const sourcePath = resolve(cwd, entry.from);
    const targetPath = resolve(cwd, entry.to);
    const isOptional = entry.optional ?? false;

    if (isOptional && !existsSync(sourcePath)) {
      continue;
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}
