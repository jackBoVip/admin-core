import { createVuePackageEslintConfig } from '../../eslint.js';

export default createVuePackageEslintConfig({
  testFiles: ['src/__tests__/**/*.ts'],
  vueRules: {
    'vue/no-v-html': 'off',
  },
});
