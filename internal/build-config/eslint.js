/**
 * Shared ESLint config helpers.
 */

import adminCoreConfig from '@admin-core/eslint-config';
import adminCoreReactConfig from '@admin-core/eslint-config/react';
import adminCoreVueConfig from '@admin-core/eslint-config/vue';

const DEFAULT_TS_FILES = ['**/*.ts', '**/*.tsx'];
const DEFAULT_TEST_FILES = ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'];

function createPackageEslintConfig(baseConfig, options = {}) {
  const {
    disableImportOrderRules = false,
    testFiles = DEFAULT_TEST_FILES,
    testRules,
    tsFiles = DEFAULT_TS_FILES,
    tsProject = './tsconfig.eslint.json',
    vueFiles,
    vueRules,
  } = options;

  const config = [...baseConfig];

  if (disableImportOrderRules) {
    config.push({
      rules: {
        'import-x/no-duplicates': 'off',
        'import-x/order': 'off',
      },
    });
  }

  config.push({
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        project: tsProject,
      },
    },
  });

  if (Array.isArray(vueFiles) && vueFiles.length > 0) {
    config.push({
      files: vueFiles,
      languageOptions: {
        parserOptions: {
          project: null,
        },
      },
      ...(vueRules ? { rules: vueRules } : {}),
    });
  }

  if (Array.isArray(testFiles) && testFiles.length > 0) {
    config.push({
      files: testFiles,
      languageOptions: {
        parserOptions: {
          project: null,
        },
      },
      ...(testRules ? { rules: testRules } : {}),
    });
  }

  return config;
}

export function createCorePackageEslintConfig(options = {}) {
  return createPackageEslintConfig(adminCoreConfig, options);
}

export function createReactPackageEslintConfig(options = {}) {
  return createPackageEslintConfig(adminCoreReactConfig, options);
}

export function createVuePackageEslintConfig(options = {}) {
  return createPackageEslintConfig(adminCoreVueConfig, {
    vueFiles: ['**/*.vue'],
    ...options,
  });
}
