#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const skipCheck = args.has('--skip-check');
const dryRun = args.has('--dry-run');

function runPnpm(command, extraArgs = []) {
  const result = spawnSync('pnpm', [command, ...extraArgs], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`pnpm ${command} ${extraArgs.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
}

async function main() {
  let replacedCatalog = false;
  let replacedWorkspace = false;
  let releaseError = null;
  let restoreError = null;

  try {
    if (!skipCheck) {
      runPnpm('check:catalog');
      runPnpm('check:duplicates');
    }

    runPnpm('build');
    replacedCatalog = true;
    runPnpm('catalog:replace');

    replacedWorkspace = true;
    runPnpm('workspace:replace');

    if (dryRun) {
      console.log('\n[dry-run] skipped changeset:publish');
    } else {
      runPnpm('changeset:publish');
    }
  } catch (error) {
    releaseError = error;
  } finally {
    try {
      if (replacedWorkspace) {
        runPnpm('workspace:restore');
      }

      if (replacedCatalog) {
        runPnpm('catalog:restore');
      }
    } catch (error) {
      restoreError = error;
    }
  }

  if (releaseError) {
    console.error(`\nRelease pipeline failed: ${releaseError.message}`);
    process.exit(1);
  }

  if (restoreError) {
    console.error(`\nRestore step failed: ${restoreError.message}`);
    process.exit(1);
  }

  console.log('\nRelease pipeline completed successfully');
}

main().catch((error) => {
  console.error(`\nUnexpected error: ${error.message}`);
  process.exit(1);
});
