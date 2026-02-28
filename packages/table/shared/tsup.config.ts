import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreTableShared',
  packageName: '@admin-core/table-shared',
});
