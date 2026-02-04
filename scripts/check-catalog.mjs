#!/usr/bin/env node

/**
 * 检查 pnpm catalog 中的包版本是否为最新版本
 * 在发布前运行此脚本可以确保所有 catalog 依赖都是最新的
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 pnpm-workspace.yaml
const workspaceFile = join(rootDir, 'pnpm-workspace.yaml');
const workspaceContent = readFileSync(workspaceFile, 'utf-8');

// 解析 catalog 配置
const catalogMatch = workspaceContent.match(/^catalog:\s*((?:\n(?:  |\t).*)*)/m);
if (!catalogMatch) {
  console.log('❌ 未找到 catalog 配置');
  process.exit(1);
}

const catalogLines = catalogMatch[1].split('\n').filter(line => line.trim());
const catalog = {};

for (const line of catalogLines) {
  const match = line.match(/^\s*['"]?([^'":\s]+)['"]?:\s*(.+)$/);
  if (match) {
    const [, name, version] = match;
    // 移除注释
    const cleanVersion = version.split('#')[0].trim();
    catalog[name] = cleanVersion;
  }
}

console.log('📦 检查 catalog 版本...\n');

// 检查每个包的版本
const outdated = [];
const packages = Object.keys(catalog);

for (const pkg of packages) {
  try {
    // 使用 npm view 获取最新版本
    const { execSync } = await import('node:child_process');
    const latestVersion = execSync(`npm view ${pkg} version`, { encoding: 'utf-8' }).trim();
    const currentVersion = catalog[pkg].replace(/[\^~]/, '');
    
    // 简单版本比较（实际应该使用 semver）
    if (latestVersion !== currentVersion) {
      outdated.push({
        name: pkg,
        current: catalog[pkg],
        latest: `^${latestVersion}`,
        latestExact: latestVersion
      });
    } else {
      console.log(`✅ ${pkg}: ${catalog[pkg]} (最新)`);
    }
  } catch (error) {
    console.log(`⚠️  ${pkg}: 无法检查版本 (${error.message})`);
  }
}

if (outdated.length > 0) {
  console.log('\n⚠️  发现过时的 catalog 版本:\n');
  outdated.forEach(({ name, current, latest, latestExact }) => {
    console.log(`  ${name}`);
    console.log(`    当前: ${current}`);
    console.log(`    最新: ${latest} (${latestExact})\n`);
  });
  
  console.log('💡 提示: 更新 pnpm-workspace.yaml 中的 catalog 版本后运行 pnpm install');
  process.exit(1);
} else {
  console.log('\n✅ 所有 catalog 版本都是最新的！');
  process.exit(0);
}
