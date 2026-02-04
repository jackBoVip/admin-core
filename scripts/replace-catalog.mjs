#!/usr/bin/env node

/**
 * 将 package.json 中的 catalog: 替换为实际版本号
 * 用于发布前准备
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 pnpm-workspace.yaml 解析 catalog
function parseCatalog() {
  const workspaceFile = join(rootDir, 'pnpm-workspace.yaml');
  const workspaceContent = readFileSync(workspaceFile, 'utf-8');
  
  const lines = workspaceContent.split('\n');
  const catalog = {};
  let inCatalog = false;
  
  for (const line of lines) {
    // 检测 catalog: 开始
    if (line.trim().startsWith('catalog:')) {
      inCatalog = true;
      continue;
    }
    
    // 如果遇到新的顶级键（不以空格开头），结束 catalog
    if (inCatalog && line.trim() && !line.startsWith(' ') && !line.startsWith('\t') && line.includes(':')) {
      break;
    }
    
    if (inCatalog) {
      const trimmed = line.trim();
      
      // 跳过注释行和空行
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // 匹配包名和版本，支持多种格式：
      // eslint: ^9.39.2
      // 'package-name': ^version
      // "@scope/package": ^version
      // 先尝试匹配带引号的（单引号或双引号）
      let match = trimmed.match(/^['"]([^'"]+)['"]\s*:\s*(.+)$/);
      if (match) {
        const [, name, version] = match;
        const cleanVersion = version.split('#')[0].trim();
        if (cleanVersion) {
          catalog[name] = cleanVersion;
        }
      } else {
        // 再尝试匹配不带引号的（包名不能包含空格）
        match = trimmed.match(/^([^:\s]+)\s*:\s*(.+)$/);
        if (match) {
          const [, name, version] = match;
          const cleanVersion = version.split('#')[0].trim();
          if (cleanVersion && name) {
            catalog[name] = cleanVersion;
          }
        }
      }
    }
  }
  
  if (Object.keys(catalog).length === 0) {
    throw new Error('未找到 catalog 配置或 catalog 为空');
  }
  
  return catalog;
}

// 查找所有需要处理的 package.json 文件
async function findPackageJsonFiles() {
  const patterns = [
    'packages/*/package.json',
    'internal/*/package.json',
    'examples/*/package.json'
  ];
  
  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: rootDir, absolute: true });
    files.push(...matches);
  }
  
  return files;
}

// 替换 package.json 中的 catalog: 为实际版本
function replaceCatalogInPackageJson(filePath, catalog, dryRun = false) {
  const content = readFileSync(filePath, 'utf-8');
  const pkg = JSON.parse(content);
  
  // 处理所有包含 catalog: 的包
  // 即使包是 private，如果它有 publishConfig 或包含 catalog: 依赖，也应该处理
  // 因为发布时可能会移除 private 字段
  
  let changed = false;
  const changes = [];
  
  // 处理 dependencies
  if (pkg.dependencies) {
    for (const [dep, version] of Object.entries(pkg.dependencies)) {
      if (version === 'catalog:' || version.startsWith('catalog:')) {
        if (catalog[dep]) {
          const actualVersion = catalog[dep];
          pkg.dependencies[dep] = actualVersion;
          changed = true;
          changes.push(`  ${dep}: catalog: → ${actualVersion}`);
        } else {
          console.warn(`⚠️  ${filePath}: 未找到 catalog 中的 ${dep}`);
        }
      }
    }
  }
  
  // 处理 devDependencies
  if (pkg.devDependencies) {
    for (const [dep, version] of Object.entries(pkg.devDependencies)) {
      if (version === 'catalog:' || version.startsWith('catalog:')) {
        if (catalog[dep]) {
          const actualVersion = catalog[dep];
          pkg.devDependencies[dep] = actualVersion;
          changed = true;
          changes.push(`  ${dep}: catalog: → ${actualVersion}`);
        } else {
          console.warn(`⚠️  ${filePath}: 未找到 catalog 中的 ${dep}`);
        }
      }
    }
  }
  
  // 处理 peerDependencies
  if (pkg.peerDependencies) {
    for (const [dep, version] of Object.entries(pkg.peerDependencies)) {
      if (version === 'catalog:' || version.startsWith('catalog:')) {
        if (catalog[dep]) {
          const actualVersion = catalog[dep];
          pkg.peerDependencies[dep] = actualVersion;
          changed = true;
          changes.push(`  ${dep}: catalog: → ${actualVersion}`);
        } else {
          console.warn(`⚠️  ${filePath}: 未找到 catalog 中的 ${dep}`);
        }
      }
    }
  }
  
  if (changed && !dryRun) {
    const newContent = JSON.stringify(pkg, null, 2) + '\n';
    writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return { changed, changes };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mode = args.includes('--restore') ? 'restore' : 'replace';
  
  try {
    const catalog = parseCatalog();
    const files = await findPackageJsonFiles();
    
    if (files.length === 0) {
      console.log('📦 未找到需要处理的 package.json 文件');
      return;
    }
    
    if (mode === 'restore') {
      console.log('🔄 恢复 catalog: 协议...\n');
    } else {
      console.log('🔄 替换 catalog: 为实际版本...\n');
    }
    
    let totalChanged = 0;
    
    for (const file of files) {
      const relativePath = file.replace(rootDir + '\\', '').replace(rootDir + '/', '');
      
      if (mode === 'restore') {
        // 恢复模式：将实际版本恢复为 catalog:
        const content = readFileSync(file, 'utf-8');
        const pkg = JSON.parse(content);
        
        // 检查是否有 catalog 中的依赖需要恢复
        let hasCatalogDeps = false;
        if (pkg.dependencies) {
          hasCatalogDeps = Object.values(pkg.dependencies).some(v => 
            typeof v === 'string' && catalog[Object.keys(pkg.dependencies).find(k => pkg.dependencies[k] === v)] && v === catalog[Object.keys(pkg.dependencies).find(k => pkg.dependencies[k] === v)]
          );
        }
        if (!hasCatalogDeps && pkg.devDependencies) {
          hasCatalogDeps = Object.values(pkg.devDependencies).some(v => 
            typeof v === 'string' && catalog[Object.keys(pkg.devDependencies).find(k => pkg.devDependencies[k] === v)] && v === catalog[Object.keys(pkg.devDependencies).find(k => pkg.devDependencies[k] === v)]
          );
        }
        if (!hasCatalogDeps && pkg.peerDependencies) {
          hasCatalogDeps = Object.values(pkg.peerDependencies).some(v => 
            typeof v === 'string' && catalog[Object.keys(pkg.peerDependencies).find(k => pkg.peerDependencies[k] === v)] && v === catalog[Object.keys(pkg.peerDependencies).find(k => pkg.peerDependencies[k] === v)]
          );
        }
        
        if (!hasCatalogDeps) {
          continue;
        }
        
        let changed = false;
        const changes = [];
        
        // 检查并恢复 dependencies
        if (pkg.dependencies) {
          for (const [dep, version] of Object.entries(pkg.dependencies)) {
            if (catalog[dep] && version === catalog[dep]) {
              pkg.dependencies[dep] = 'catalog:';
              changed = true;
              changes.push(`  ${dep}: ${version} → catalog:`);
            }
          }
        }
        
        // 检查并恢复 devDependencies
        if (pkg.devDependencies) {
          for (const [dep, version] of Object.entries(pkg.devDependencies)) {
            if (catalog[dep] && version === catalog[dep]) {
              pkg.devDependencies[dep] = 'catalog:';
              changed = true;
              changes.push(`  ${dep}: ${version} → catalog:`);
            }
          }
        }
        
        // 检查并恢复 peerDependencies
        if (pkg.peerDependencies) {
          for (const [dep, version] of Object.entries(pkg.peerDependencies)) {
            if (catalog[dep] && version === catalog[dep]) {
              pkg.peerDependencies[dep] = 'catalog:';
              changed = true;
              changes.push(`  ${dep}: ${version} → catalog:`);
            }
          }
        }
        
        if (changed) {
          if (!dryRun) {
            const newContent = JSON.stringify(pkg, null, 2) + '\n';
            writeFileSync(file, newContent, 'utf-8');
          }
          console.log(`✅ ${relativePath}`);
          changes.forEach(change => console.log(change));
          totalChanged++;
        }
      } else {
        // 替换模式
        const result = replaceCatalogInPackageJson(file, catalog, dryRun);
        if (result.changed) {
          console.log(`✅ ${relativePath}`);
          result.changes.forEach(change => console.log(change));
          totalChanged++;
        }
      }
    }
    
    if (totalChanged === 0) {
      console.log('\n✨ 没有需要处理的文件');
    } else {
      if (dryRun) {
        console.log(`\n✨ 预览模式：将修改 ${totalChanged} 个文件`);
      } else {
        console.log(`\n✨ 已处理 ${totalChanged} 个文件`);
      }
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
