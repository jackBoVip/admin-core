/**
 * Shared tsup config helpers.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyFiles } from './copy.js';

const STRIPPABLE_FILE_SUFFIXES = ['.js', '.cjs', '.mjs', '.d.ts', '.d.cts', '.d.mts'];

function isStrippableFile(filePath) {
  return STRIPPABLE_FILE_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function stripJSDocComments(content) {
  return content.replace(/\/\*\*(?!\!)[\s\S]*?\*\//g, '');
}

function walkDistDirectory(dirPath, filePaths) {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const entryPath = join(dirPath, entry);
    const entryStat = statSync(entryPath);
    if (entryStat.isDirectory()) {
      walkDistDirectory(entryPath, filePaths);
      continue;
    }
    filePaths.push(entryPath);
  }
}

export function stripJSDocCommentsFromDist(outDir = 'dist') {
  if (!existsSync(outDir)) {
    return;
  }

  const filePaths = [];
  walkDistDirectory(outDir, filePaths);

  for (const filePath of filePaths) {
    if (!isStrippableFile(filePath)) {
      continue;
    }
    const currentContent = readFileSync(filePath, 'utf8');
    const strippedContent = stripJSDocComments(currentContent);
    if (strippedContent !== currentContent) {
      writeFileSync(filePath, strippedContent);
    }
  }
}

function createBanner(packageName, mode) {
  if (mode === 'dev') {
    return `/* ${packageName} - CDN Development Build */`;
  }
  return `/* ${packageName} - CDN Build */`;
}

export function createCoreLibraryTsupConfig(options) {
  const {
    copyEntries = [],
    entry,
    external = [],
    globalName,
    noExternal = [],
    packageName,
  } = options;

  const shouldGenerateSourceMap = process.env.NODE_ENV !== 'production';
  const hasExternal = Array.isArray(external) && external.length > 0;
  const hasNoExternal = Array.isArray(noExternal) && noExternal.length > 0;
  const hasCopyEntries = Array.isArray(copyEntries) && copyEntries.length > 0;

  return [
    {
      entry,
      format: ['cjs', 'esm'],
      dts: {
        compilerOptions: {
          removeComments: true,
        },
      },
      clean: true,
      sourcemap: shouldGenerateSourceMap,
      treeshake: true,
      minify: true,
      target: 'es2020',
      esbuildOptions(esbuildConfig) {
        esbuildConfig.legalComments = 'none';
      },
      onSuccess() {
        if (hasCopyEntries) {
          copyFiles(copyEntries);
        }
        stripJSDocCommentsFromDist();
      },
      ...(hasExternal ? { external } : {}),
    },
    {
      entry: ['src/index.ts'],
      outDir: 'dist',
      format: ['iife'],
      globalName,
      clean: false,
      outExtension: () => ({ js: '.global.js' }),
      sourcemap: shouldGenerateSourceMap,
      treeshake: true,
      minify: true,
      target: 'es2020',
      ...(hasNoExternal ? { noExternal } : {}),
      esbuildOptions(esbuildConfig) {
        esbuildConfig.legalComments = 'none';
        esbuildConfig.banner = {
          js: createBanner(packageName, 'prod'),
        };
      },
      onSuccess() {
        stripJSDocCommentsFromDist();
      },
    },
    {
      entry: ['src/index.ts'],
      outDir: 'dist',
      format: ['iife'],
      globalName,
      clean: false,
      outExtension: () => ({ js: '.global.dev.js' }),
      sourcemap: true,
      treeshake: true,
      minify: false,
      target: 'es2020',
      ...(hasNoExternal ? { noExternal } : {}),
      esbuildOptions(esbuildConfig) {
        esbuildConfig.legalComments = 'none';
        esbuildConfig.banner = {
          js: createBanner(packageName, 'dev'),
        };
      },
      onSuccess() {
        stripJSDocCommentsFromDist();
      },
    },
  ];
}
