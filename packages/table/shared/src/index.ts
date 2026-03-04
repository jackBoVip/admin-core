/**
 * table-shared 导出入口。
 * @description 汇总 table-core 能力与跨框架共享偏好/类型能力。
 */
export {
  createTableApi,
  extendProxyOptions,
  getGlobalTableFormatterRegistry,
  getLocaleMessages,
  registerTableFormatters,
  resolveTableStripeConfig,
  setupAdminTableCore,
  type AdminTableGridEvents,
  type AdminTableApi,
  type AdminTableOptions,
  type AdminTableProps,
  type ColumnCustomChangePayload,
  type ColumnCustomSnapshot,
  type ColumnCustomState,
  type ProxyConfig,
  type SeparatorOptions,
  type TableStripeConfig,
  type TableFormatter,
  type TableRenderer,
  type ToolbarConfig,
} from '@admin-core/table-core';

/**
 * 导出跨框架共享的偏好绑定与类型能力。
 * @description 提供 React/Vue 共用的主题语言联动与初始化类型定义。
 */
export * from './preferences';
export * from './types';
