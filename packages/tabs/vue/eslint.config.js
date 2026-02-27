import adminCoreVueConfig from '@admin-core/eslint-config/vue';

export default [
  ...adminCoreVueConfig,
  {
    rules: {
      'import-x/no-duplicates': 'off',
      'import-x/order': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  {
    files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
];
