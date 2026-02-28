import { createVuePackageEslintConfig } from '../../eslint.js';

export default createVuePackageEslintConfig({
  testFiles: ['src/__tests__/**/*.ts'],
});
