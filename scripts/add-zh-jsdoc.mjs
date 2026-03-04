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

function toDisplayName(name) {
  if (!name) {
    return '该项';
  }
  return name;
}

function buildTypeDoc(name, kindLabel) {
  return `/**\n * ${toDisplayName(name)}${kindLabel}。\n */\n`;
}

function normalizeParamName(param) {
  if (ts.isIdentifier(param.name)) {
    return param.name.text;
  }
  if (ts.isObjectBindingPattern(param.name)) {
    return 'options';
  }
  if (ts.isArrayBindingPattern(param.name)) {
    return 'items';
  }
  return 'value';
}

function buildParamDescription(paramName) {
  if (paramName === 'options') {
    return '配置项。';
  }
  if (paramName === 'params') {
    return '参数集合。';
  }
  if (paramName === 'ctx' || paramName === 'context') {
    return '上下文对象。';
  }
  return `参数 ${paramName}。`;
}

function hasNonVoidReturnType(typeNode) {
  if (!typeNode) {
    return false;
  }
  if (typeNode.kind === ts.SyntaxKind.VoidKeyword) {
    return false;
  }
  if (typeNode.kind === ts.SyntaxKind.NeverKeyword) {
    return false;
  }
  return true;
}

function buildFunctionDoc(name, params, typeNode) {
  const lines = [
    '/**',
    ` * ${toDisplayName(name)}。`,
  ];

  for (const param of params) {
    const paramName = normalizeParamName(param);
    lines.push(` * @param ${paramName} ${buildParamDescription(paramName)}`);
  }

  if (hasNonVoidReturnType(typeNode)) {
    lines.push(' * @returns 返回结果。');
  }

  lines.push(' */');
  return `${lines.join('\n')}\n`;
}

function isTopLevelFunctionVariableStatement(statement) {
  if (!ts.isVariableStatement(statement)) {
    return false;
  }
  if (statement.declarationList.declarations.length !== 1) {
    return false;
  }
  const declaration = statement.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name)) {
    return false;
  }
  const initializer = declaration.initializer;
  if (!initializer) {
    return false;
  }
  return ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
}

function collectInsertions(sourceFile) {
  const insertions = [];

  function pushInsertion(statement, text) {
    insertions.push({
      pos: statement.getStart(sourceFile),
      text,
    });
  }

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      if (!statement.name || hasJSDoc(statement)) {
        continue;
      }
      pushInsertion(
        statement,
        buildFunctionDoc(statement.name.text, statement.parameters, statement.type)
      );
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      if (hasJSDoc(statement)) {
        continue;
      }
      pushInsertion(statement, buildTypeDoc(statement.name.text, '类型定义'));
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      if (hasJSDoc(statement)) {
        continue;
      }
      pushInsertion(statement, buildTypeDoc(statement.name.text, '接口定义'));
      continue;
    }

    if (ts.isClassDeclaration(statement)) {
      if (!statement.name || hasJSDoc(statement)) {
        continue;
      }
      pushInsertion(statement, buildTypeDoc(statement.name.text, '类定义'));
      continue;
    }

    if (ts.isEnumDeclaration(statement)) {
      if (hasJSDoc(statement)) {
        continue;
      }
      pushInsertion(statement, buildTypeDoc(statement.name.text, '枚举定义'));
      continue;
    }

    if (!isTopLevelFunctionVariableStatement(statement) || hasJSDoc(statement)) {
      continue;
    }

    const declaration = statement.declarationList.declarations[0];
    const initializer = declaration.initializer;
    if (!initializer || !ts.isIdentifier(declaration.name)) {
      continue;
    }

    const functionNode = ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)
      ? initializer
      : null;
    if (!functionNode) {
      continue;
    }

    pushInsertion(
      statement,
      buildFunctionDoc(declaration.name.text, functionNode.parameters, functionNode.type)
    );
  }

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
  let insertedDocCount = 0;

  for (const filePath of targetFiles) {
    const content = await readFile(filePath, 'utf8');
    const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const insertions = collectInsertions(sourceFile);
    if (insertions.length === 0) {
      continue;
    }

    const next = applyInsertions(content, insertions);
    if (next === content) {
      continue;
    }

    changedFileCount += 1;
    insertedDocCount += insertions.length;
    if (!dryRun) {
      await writeFile(filePath, next, 'utf8');
    }
  }

  console.log(
    dryRun
      ? `[dry-run] 将修改 ${changedFileCount} 个文件，新增 ${insertedDocCount} 条 JSDoc。`
      : `已修改 ${changedFileCount} 个文件，新增 ${insertedDocCount} 条 JSDoc。`
  );
}

main().catch((error) => {
  console.error(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
