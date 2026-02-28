#!/usr/bin/env node

/**
 * 发布前将 workspace: 协议替换为具体版本号（本地包）。
 * 支持 --restore 恢复为 workspace:*，以及 --dry-run 预览。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const restore = args.has('--restore');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

async function findWorkspacePackageJsonFiles() {
  const patterns = [
    'packages/*/package.json',
    'packages/*/*/package.json',
    'examples/*/package.json',
    'internal/*/package.json',
  ];
  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: rootDir, absolute: true });
    files.push(...matches);
  }
  return Array.from(new Set(files)).sort();
}

function resolveWorkspaceTargetVersion(rawVersion, localVersion) {
  const spec = rawVersion.slice('workspace:'.length).trim();

  if (!spec || spec === '*') return localVersion;
  if (spec === '^') return `^${localVersion}`;
  if (spec === '~') return `~${localVersion}`;
  if (spec.startsWith('^') || spec.startsWith('~')) return spec;
  return spec;
}

function processDepsSection({
  depType,
  deps,
  localVersions,
  changes,
  modeRestore,
}) {
  if (!deps || typeof deps !== 'object') return false;

  let changed = false;
  for (const [depName, depVersion] of Object.entries(deps)) {
    if (!localVersions.has(depName)) continue;

    if (modeRestore) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        continue;
      }
      const prev = depVersion;
      deps[depName] = 'workspace:*';
      changed = true;
      changes.push(`  [${depType}] ${depName}: ${prev} -> workspace:*`);
      continue;
    }

    if (typeof depVersion !== 'string' || !depVersion.startsWith('workspace:')) {
      continue;
    }

    const localVersion = localVersions.get(depName);
    const next = resolveWorkspaceTargetVersion(depVersion, localVersion);
    if (next === depVersion) continue;

    deps[depName] = next;
    changed = true;
    changes.push(`  [${depType}] ${depName}: ${depVersion} -> ${next}`);
  }

  return changed;
}

async function main() {
  const files = await findWorkspacePackageJsonFiles();

  const localVersions = new Map();
  for (const file of files) {
    const pkg = readJson(file);
    if (!pkg?.name || !pkg?.version) continue;
    localVersions.set(pkg.name, pkg.version);
  }

  let totalChanged = 0;

  for (const file of files) {
    const pkg = readJson(file);
    const changes = [];
    let changed = false;

    changed =
      processDepsSection({
        depType: 'dependencies',
        deps: pkg.dependencies,
        localVersions,
        changes,
        modeRestore: restore,
      }) || changed;

    changed =
      processDepsSection({
        depType: 'devDependencies',
        deps: pkg.devDependencies,
        localVersions,
        changes,
        modeRestore: restore,
      }) || changed;

    changed =
      processDepsSection({
        depType: 'peerDependencies',
        deps: pkg.peerDependencies,
        localVersions,
        changes,
        modeRestore: restore,
      }) || changed;

    if (!changed) continue;

    totalChanged += 1;
    const rel = relative(rootDir, file);
    console.log(`✅ ${rel}`);
    for (const line of changes) console.log(line);

    if (!dryRun) {
      writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    }
  }

  if (totalChanged === 0) {
    console.log(restore ? '✨ 没有可恢复的 workspace 依赖' : '✨ 没有需要替换的 workspace 依赖');
    return;
  }

  if (dryRun) {
    console.log(`\n✨ 预览模式：将处理 ${totalChanged} 个文件`);
  } else {
    console.log(`\n✨ 已处理 ${totalChanged} 个文件`);
  }
}

main().catch((error) => {
  console.error('❌ 处理失败:', error?.message || error);
  process.exit(1);
});

