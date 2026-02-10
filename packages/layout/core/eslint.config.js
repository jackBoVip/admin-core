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
    files: ['src/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: null, // 测试文件不需要类型检查
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
];
