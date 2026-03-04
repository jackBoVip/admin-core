import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

/**
 * table-shared 包构建配置。
 */
export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreTableShared',
  packageName: '@admin-core/table-shared',
});
