import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreFormShared',
  packageName: '@admin-core/form-shared',
});
