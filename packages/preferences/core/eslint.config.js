import adminCoreConfig from '@admin-core/eslint-config';

export default [
  ...adminCoreConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
];