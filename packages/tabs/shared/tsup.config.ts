import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

/**
 * tabs-shared 包构建配置。
 */
export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreTabsShared',
  packageName: '@admin-core/tabs-shared',
});
