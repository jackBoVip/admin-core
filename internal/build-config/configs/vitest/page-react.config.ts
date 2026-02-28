import { createDomVitestConfig } from '../../vitest.js';

export default createDomVitestConfig({
  test: {
    passWithNoTests: true,
  },
});
