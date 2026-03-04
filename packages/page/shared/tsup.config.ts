import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

/**
 * page-shared 包构建配置。
 */
export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCorePageShared',
  packageName: '@admin-core/page-shared',
});
