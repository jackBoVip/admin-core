import { createCoreLibraryTsupConfig } from '../../../internal/build-config/tsup.js';

/**
 * form-shared 包构建配置。
 */
export default createCoreLibraryTsupConfig({
  entry: ['src/index.ts'],
  globalName: 'AdminCoreFormShared',
  packageName: '@admin-core/form-shared',
});
