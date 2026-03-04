/**
 * @admin-core/page-vue
 * Vue 3 页面适配层（基于 @admin-core/page-core）
 * @description 对外提供页面容器、查询表格组合组件与 setup 能力，
 * 同时透传 form/table Vue 实现，支持一站式接入。
 */

import './styles/index.css';

/**
 * 导出与框架无关的 page-shared 能力。
 * @description 包含查询布局、通用工具类型与跨框架辅助实现。
 */
export * from '@admin-core/page-shared';

/**
 * 导出 Vue 组件与 Hook。
 * @description 包含基础页面容器、查询+表格复合组件及其状态管理 Hook。
 */
export { AdminPage } from './components/AdminPage';
export {
  AdminPageQueryTable,
  createAdminPageQueryTableApi,
} from './components/AdminPageQueryTable';
export { useAdminPage } from './hooks';
export { useAdminPageQueryTable } from './hooks';
export { getAdminPageVueSetupState, setupAdminPageVue } from './setup';
/**
 * 透传 Form Vue 能力，便于组合包一站式接入。
 * @description 使用 `@admin-core/page-vue` 时无需额外单独安装 form-vue。
 */
export {
  createFormApi,
  setupAdminFormVue,
  type AdminFormApi,
  type AdminFormProps,
  type SetupAdminFormVueOptions,
} from '@admin-core/form-vue';
/**
 * 透传 Table Vue 能力，便于组合包一站式接入。
 * @description 使用 `@admin-core/page-vue` 时无需额外单独安装 table-vue。
 */
export {
  createTableApi,
  setupAdminTableVue,
  type AdminTableApi,
  type AdminTableVueProps,
  type SetupAdminTableVueOptions,
} from '@admin-core/table-vue';

/**
 * 导出 Vue 侧类型定义。
 * @description 聚合页面组件、查询表格组合及 setup 相关类型。
 */
export type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
  AdminPageVueItem,
  AdminPageVueProps,
  ExtendedAdminPageApi,
  SetupAdminPageVueOptions,
  UseAdminPageQueryTableReturn,
  VuePageComponent,
} from './types';
