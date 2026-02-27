import adminCoreReactConfig from '@admin-core/eslint-config/react';

export default [
  ...adminCoreReactConfig,
  {
    rules: {
      'import-x/no-duplicates': 'off',
      'import-x/order': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json'
      }
    }
  },
  {
    files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: null
      }
    }
  }
];
