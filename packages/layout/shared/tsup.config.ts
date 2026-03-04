import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

/**
 * layout-shared 包构建配置。
 */
export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreLayoutShared',
  packageName: '@admin-core/layout-shared',
});
