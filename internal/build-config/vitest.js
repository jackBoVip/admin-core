/**
 * Shared Vitest config helpers.
 */

import { mergeConfig } from 'vitest/config';

const CORE_TEST_DEFAULTS = {
  test: {
    globals: true,
  },
};

const DOM_TEST_DEFAULTS = {
  test: {
    environment: 'jsdom',
    globals: true,
  },
};

export function createCoreVitestConfig(config = {}) {
  return mergeConfig(CORE_TEST_DEFAULTS, config);
}

export function createDomVitestConfig(config = {}) {
  return mergeConfig(DOM_TEST_DEFAULTS, config);
}
