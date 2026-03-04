/**
 * @admin-core/tabs-vue
 * Vue 3 Tabs 适配层（基于 @admin-core/tabs-core）
 * @description 提供 Vue Tabs 组件、setup 初始化能力与跨框架共享能力透传。
 */

import './styles/index.css';

/**
 * 导出跨框架共享的 tabs-shared 能力。
 * @description 包含 tabs-core API、适配层 setup 运行时与通用类型。
 */
export * from '@admin-core/tabs-shared';

/**
 * 导出 Vue Tabs 组件与 setup 能力。
 * @description 支持在应用启动时完成一次性初始化，并按需读取 setup 状态。
 */
export { AdminTabs } from './components/AdminTabs';
export { getAdminTabsVueSetupState, setupAdminTabsVue } from './setup';

/**
 * 导出 Vue 侧类型定义。
 * @description 聚合 Vue 页签项、组件属性与事件负载类型。
 */
export type {
  AdminTabVueItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';
