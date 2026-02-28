import { createCorePackageEslintConfig } from '../../eslint.js';

export default createCorePackageEslintConfig({
  testFiles: ['src/__tests__/**/*.ts'],
  testRules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off',
  },
});
