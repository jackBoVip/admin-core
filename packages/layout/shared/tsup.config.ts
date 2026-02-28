import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreLayoutShared',
  packageName: '@admin-core/layout-shared',
});
