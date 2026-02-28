import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCorePageShared',
  packageName: '@admin-core/page-shared',
});
