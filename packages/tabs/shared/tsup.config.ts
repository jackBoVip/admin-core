import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreTabsShared',
  packageName: '@admin-core/tabs-shared',
});
