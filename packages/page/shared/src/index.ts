/**
 * page-shared 导出入口。
 * @description 汇总 page-core 能力与跨框架共享适配类型。
 */
export {
  createPageApi,
  getLocale,
  getLocaleMessages,
  getLocaleVersion,
  normalizePageLocale,
  normalizePageFormTableBridgeOptions,
  registerPageLocaleMessages,
  setLocale,
  setupAdminPageCore,
  subscribeLocaleChange,
  type AdminPageApi,
  type AdminPageItem,
  type AdminPageOptions,
  type ComponentPageItem,
  type NormalizedPageFormTableBridgeOptions,
  type PageFormTableBridgeContext,
  type PageFormTableBridgeOptions,
  type PageScrollOptions,
  type RoutePageItem,
} from '@admin-core/page-core';

/**
 * 导出跨框架共享的 setup 与适配类型。
 * @description 提供 React/Vue 共用的初始化流程与类型定义。
 */
export * from './setup';
export * from './types';
