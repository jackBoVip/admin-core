import adminCoreConfig from '@admin-core/eslint-config';

export default [
  ...adminCoreConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
  {
    files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: null, // 测试文件不需要类型检查
      },
    },
  },
];
