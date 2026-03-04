#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import { glob } from 'glob';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const includePatterns = [
  'packages/**/*.ts',
  'packages/**/*.tsx',
  'examples/**/*.ts',
  'examples/**/*.tsx',
  'internal/**/*.ts',
  'internal/**/*.tsx',
];

const excludeMatchers = [
  '/node_modules/',
  '/dist/',
  '/coverage/',
  '/.turbo/',
  '/__tests__/',
];

const excludeFileSuffixes = ['.d.ts', '.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

function shouldIgnoreFile(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  if (excludeMatchers.some((segment) => normalized.includes(segment))) {
    return true;
  }
  return excludeFileSuffixes.some((suffix) => normalized.endsWith(suffix));
}

function hasJSDoc(node) {
  const docs = node?.jsDoc;
  return Array.isArray(docs) && docs.length > 0;
}

function applyTemplateTextRefine(content) {
  let next = content;

  next = next.replaceAll(/(\* )([A-Za-z_$][\w$]*)接口定义。/g, '$1$2 数据结构。');
  next = next.replaceAll(/(\* )([A-Za-z_$][\w$]*)类型定义。/g, '$1$2 类型声明。');
  next = next.replaceAll(/(\* )([A-Za-z_$][\w$]*)类定义。/g, '$1$2 类定义。');
  next = next.replaceAll(/(\* )([A-Za-z_$][\w$]*)枚举定义。/g, '$1$2 枚举定义。');

  next = next.replaceAll(
    /(\* )([a-z][A-Za-z0-9_$]*)。(?=\r?\n\s*\* @(?:param|returns)|\r?\n\s*\*\/)/g,
    '$1执行$2相关逻辑。'
  );

  next = next.replaceAll(
    /@param\s+([A-Za-z_$][\w$]*)\s+参数\s+\1。/g,
    (_match, paramName) => {
      if (paramName === 'options') {
        return '@param options 处理配置项。';
      }
      if (paramName === 'params') {
        return '@param params 参数集合。';
      }
      if (paramName === 'ctx' || paramName === 'context') {
        return `@param ${paramName} 上下文对象。`;
      }
      return `@param ${paramName} 参数 \`${paramName}\` 的输入值。`;
    }
  );

  next = next.replaceAll(/@returns 返回结果。/g, '@returns 处理后的结果。');

  return next;
}

function getPropertyName(memberName) {
  if (!memberName) {
    return undefined;
  }
  if (ts.isIdentifier(memberName)) {
    return memberName.text;
  }
  if (ts.isStringLiteral(memberName) || ts.isNumericLiteral(memberName)) {
    return String(memberName.text);
  }
  if (ts.isComputedPropertyName(memberName)) {
    const text = memberName.expression?.getText()?.trim();
    return text || undefined;
  }
  return undefined;
}

function buildFieldDescription(name, kind) {
  if (!name) {
    return kind === 'method' ? '方法定义。' : '字段定义。';
  }

  if (kind === 'method') {
    return `方法 \`${name}\`。`;
  }

  const lower = name.toLowerCase();
  if (lower === 'id') return '唯一标识。';
  if (lower === 'key') return '键名。';
  if (lower === 'name') return '名称。';
  if (lower === 'title') return '标题文案。';
  if (lower === 'label') return '显示标签。';
  if (lower === 'value') return '值。';
  if (lower === 'type') return '类型。';
  if (lower === 'index') return '索引。';
  if (lower === 'order') return '排序信息。';
  if (lower === 'options') return '配置项。';
  if (lower === 'children') return '子节点列表。';
  if (lower === 'rows') return '行数据集合。';
  if (lower === 'columns') return '列配置集合。';
  if (lower === 'classname') return '样式类名。';
  if (lower === 'style') return '样式配置。';
  if (lower === 'visible') return '是否可见。';
  if (lower === 'enabled') return '是否启用。';
  if (lower === 'disabled') return '是否禁用。';
  if (lower === 'required') return '是否必填。';
  if (lower === 'width') return '宽度。';
  if (lower === 'height') return '高度。';

  if (name.startsWith('on') && name.length > 2) {
    return '事件回调。';
  }
  if (
    name.startsWith('is') ||
    name.startsWith('has') ||
    name.startsWith('can') ||
    name.startsWith('should') ||
    name.startsWith('show')
  ) {
    return '布尔状态标记。';
  }
  if (name.endsWith('Id')) {
    return '关联标识。';
  }
  if (name.endsWith('List') || name.endsWith('Items')) {
    return '列表数据。';
  }

  return `字段 \`${name}\`。`;
}

function buildMemberDoc(name, kind) {
  return `/** ${buildFieldDescription(name, kind)} */\n`;
}

function collectMemberInsertions(sourceFile) {
  const insertions = [];

  function addMemberDocs(members) {
    for (const member of members) {
      if (hasJSDoc(member)) {
        continue;
      }

      if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
        insertions.push({
          pos: member.getStart(sourceFile),
          text: buildMemberDoc(getPropertyName(member.name), 'property'),
        });
        continue;
      }

      if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
        insertions.push({
          pos: member.getStart(sourceFile),
          text: buildMemberDoc(getPropertyName(member.name), 'method'),
        });
        continue;
      }
    }
  }

  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      addMemberDocs(node.members);
    }

    if (ts.isTypeLiteralNode(node)) {
      addMemberDocs(node.members);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return insertions;
}

function applyInsertions(content, insertions) {
  if (insertions.length === 0) {
    return content;
  }
  const ordered = [...insertions].sort((a, b) => b.pos - a.pos);
  let next = content;
  for (const insertion of ordered) {
    next = `${next.slice(0, insertion.pos)}${insertion.text}${next.slice(insertion.pos)}`;
  }
  return next;
}

async function main() {
  const files = [];
  for (const pattern of includePatterns) {
    const matched = await glob(pattern, { cwd: ROOT, absolute: true });
    files.push(...matched);
  }

  const targetFiles = Array.from(new Set(files))
    .filter((filePath) => !shouldIgnoreFile(filePath))
    .sort();

  let changedFileCount = 0;
  let insertedMemberDocCount = 0;

  for (const filePath of targetFiles) {
    const content = await readFile(filePath, 'utf8');
    const refined = applyTemplateTextRefine(content);

    const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      filePath,
      refined,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );
    const insertions = collectMemberInsertions(sourceFile);
    const next = applyInsertions(refined, insertions);

    if (next === content) {
      continue;
    }

    changedFileCount += 1;
    insertedMemberDocCount += insertions.length;
    if (!dryRun) {
      await writeFile(filePath, next, 'utf8');
    }
  }

  console.log(
    dryRun
      ? `[dry-run] 将修改 ${changedFileCount} 个文件，新增/优化 ${insertedMemberDocCount} 条成员 JSDoc。`
      : `已修改 ${changedFileCount} 个文件，新增/优化 ${insertedMemberDocCount} 条成员 JSDoc。`
  );
}

main().catch((error) => {
  console.error(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
