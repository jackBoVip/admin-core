#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const distEntryUrl = new URL('../dist/index.js', import.meta.url);
const distEntryPath = fileURLToPath(distEntryUrl);

if (!existsSync(distEntryPath)) {
  console.error(
    '[table-core bench] dist/index.js not found. Run `pnpm --filter @admin-core/table-core build` first.'
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const argMap = new Map(
  args
    .filter((item) => item.startsWith('--') && item.includes('='))
    .map((item) => {
      const [key, value] = item.slice(2).split('=');
      return [key, value];
    })
);
const hasCheck = args.includes('--check');

function readIntArg(name, fallback) {
  const raw = argMap.get(name);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readFloatArg(name, fallback) {
  const raw = argMap.get(name);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const columnsCount = readIntArg('columns', 240);
const warmup = readIntArg('warmup', 200);
const iterations = readIntArg('iterations', 1500);
const checkBudgetSnapshotAvgMs = readFloatArg('budgetSnapshotAvgMs', 2.5);
const checkBudgetRuntimeAvgMs = readFloatArg('budgetRuntimeAvgMs', 4);
const checkBudgetControlsAvgMs = readFloatArg('budgetControlsAvgMs', 3);

const {
  buildColumnCustomControls,
  buildColumnRuntimeItems,
  createColumnCustomSnapshot,
} = await import(distEntryUrl.href);

function createColumns(count) {
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const key = `col_${index}`;
    const sortable = index % 2 === 0;
    const filterable = index % 3 === 0;
    const fixed = index === 0 ? 'left' : index === count - 1 ? 'right' : '';
    result.push({
      field: key,
      filters: filterable
        ? [
            {
              label: 'A',
              value: 'A',
            },
            {
              label: 'B',
              value: 'B',
            },
          ]
        : undefined,
      fixed,
      hidden: index % 5 === 0,
      key,
      sortable,
      title: `Column ${index + 1}`,
      visible: index % 7 !== 0,
    });
  }
  return result;
}

function createSnapshotSource(columns) {
  const order = [];
  const fixed = {};
  const visible = {};
  const sortable = {};
  const filterable = {};
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    const key = columns[index].key;
    order.push(key);
    visible[key] = index % 4 !== 0;
    sortable[key] = index % 2 === 0;
    filterable[key] = index % 3 === 0;
    fixed[key] = index % 11 === 0 ? 'left' : index % 13 === 0 ? 'right' : '';
  }
  return {
    filterable,
    fixed,
    order,
    sortable,
    visible,
  };
}

function runCase(name, fn) {
  for (let index = 0; index < warmup; index += 1) {
    fn();
  }
  const start = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    fn();
  }
  const elapsed = performance.now() - start;
  const avgMs = elapsed / iterations;
  const opsPerSec = avgMs > 0 ? 1000 / avgMs : Number.POSITIVE_INFINITY;
  return {
    avgMs,
    elapsed,
    name,
    opsPerSec,
  };
}

const columns = createColumns(columnsCount);
const source = createSnapshotSource(columns);
const stableSnapshot = createColumnCustomSnapshot(columns, source, true);

const results = [
  runCase('createColumnCustomSnapshot', () => {
    createColumnCustomSnapshot(columns, source, true);
  }),
  runCase('buildColumnRuntimeItems', () => {
    buildColumnRuntimeItems(columns, stableSnapshot, {
      includeVisibilityFlags: true,
    });
  }),
  runCase('buildColumnCustomControls', () => {
    buildColumnCustomControls(columns, stableSnapshot);
  }),
];

const header = '[table-core bench] column-custom';
console.log(`${header}`);
console.log(
  `columns=${columnsCount}, warmup=${warmup}, iterations=${iterations}`
);
for (const item of results) {
  console.log(
    `${item.name.padEnd(28)} avg=${item.avgMs.toFixed(4)}ms total=${item.elapsed.toFixed(1)}ms ops/s=${Math.round(item.opsPerSec)}`
  );
}

if (hasCheck) {
  const byName = new Map(results.map((item) => [item.name, item]));
  const errors = [];
  if (
    (byName.get('createColumnCustomSnapshot')?.avgMs ?? 0) >
    checkBudgetSnapshotAvgMs
  ) {
    errors.push(
      `createColumnCustomSnapshot avg exceeds budget ${checkBudgetSnapshotAvgMs}ms`
    );
  }
  if (
    (byName.get('buildColumnRuntimeItems')?.avgMs ?? 0) >
    checkBudgetRuntimeAvgMs
  ) {
    errors.push(
      `buildColumnRuntimeItems avg exceeds budget ${checkBudgetRuntimeAvgMs}ms`
    );
  }
  if (
    (byName.get('buildColumnCustomControls')?.avgMs ?? 0) >
    checkBudgetControlsAvgMs
  ) {
    errors.push(
      `buildColumnCustomControls avg exceeds budget ${checkBudgetControlsAvgMs}ms`
    );
  }
  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`[table-core bench] ${message}`);
    }
    process.exit(1);
  }
  console.log('[table-core bench] check passed');
}
