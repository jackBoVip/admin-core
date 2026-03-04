/**
 * @admin-core/table-react
 * React 表格适配层（基于 @admin-core/table-core）
 * @description 提供 React 表格组件、渲染器注册机制、setup 初始化能力与主题同步能力。
 */

import './styles/index.css';

/**
 * 导出跨框架共享的 table-shared 能力。
 * @description 包含表格状态计算、工具函数与跨框架复用实现。
 */
export * from '@admin-core/table-shared';

/**
 * 导出 React 表格组件、渲染器注册能力与 setup。
 * @description 支持自定义渲染器注入，并可在应用启动阶段完成一次性初始化。
 */
export { AdminTable } from './components';
export {
  getReactTableRenderer,
  getReactTableRendererRegistry,
  registerBuiltinReactRenderers,
  registerReactTableRenderer,
  removeReactTableRenderer,
} from './renderers';
export {
  getAdminTableReactSetupState,
  setupAdminTableReact,
  syncAdminTableReactWithPreferences,
} from './setup';
export { useAdminTable, useLocaleVersion } from './hooks';

/**
 * 导出 React 侧类型定义。
 * @description 聚合组件属性、扩展 API 与 setup 参数类型。
 */
export type {
  AdminTableReactProps,
  AdminTableSlots,
  AntdGridOptions,
  AntdTableColumn,
  ExtendedAdminTableApi,
  SetupAdminTableReactOptions,
} from './types';
