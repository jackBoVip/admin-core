import adminCoreVueConfig from '@admin-core/eslint-config/vue';

export default [
  ...adminCoreVueConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: null, // .vue 文件跳过类型检查，避免 tsconfig 不包含
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
