import adminCoreReactConfig from '@admin-core/eslint-config/react';

export default [
  ...adminCoreReactConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
  {
    files: ['src/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: null, // 测试文件不需要类型检查
      },
    },
  },
];
