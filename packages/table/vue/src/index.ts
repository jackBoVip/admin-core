/**
 * @admin-core/table-vue
 * Vue 3 表格适配层（基于 @admin-core/table-core）
 * @description 提供 Vue 表格组件、setup 初始化能力与主题/语言同步能力。
 */

import './styles/index.css';

/**
 * 导出跨框架共享的 table-shared 能力。
 * @description 包含表格状态计算、工具函数与跨框架复用实现。
 */
export * from '@admin-core/table-shared';

/**
 * 导出 Vue 表格组件、setup 与组合式工具。
 * @description 支持在应用侧统一完成初始化，并通过 composable 订阅语言与偏好变化。
 */
export { default as AdminTable } from './components/AdminTable.vue';
export {
  getAdminTableVueSetupState,
  setupAdminTableVue,
  syncAdminTableVueWithPreferences,
} from './setup';
export { useAdminTable } from './hooks';
export { useLocaleVersion } from './composables/useLocaleVersion';
export { usePreferencesLocale } from './composables/usePreferencesLocale';

/**
 * 导出 Vue 侧类型定义。
 * @description 聚合组件属性、扩展 API 与 setup 参数类型。
 */
export type {
  AdminTableVueProps,
  ExtendedAdminTableApi,
  SetupAdminTableVueOptions,
  VxeTableGridOptions,
} from './types';
