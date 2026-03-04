/**
 * Page Core 类型导出入口。
 * @description 汇总 page-core 对外公开的 API、配置、语言与页面结构类型。
 */
/** 页面 API 类型。 */
export type * from './api';
/** 页面初始化配置类型。 */
export type * from './config';
/** 页面国际化类型。 */
export type * from './locales';
/**
 * 页面运行时与结构类型。
 * @description 包含页面项、路由映射、渲染上下文等核心结构约束。
 */
export type * from './page';
/**
 * 复用 shared-core 的通用 Store 类型。
 * @description 避免调用方重复引入 shared-core。
 */
export type { StoreApi, StoreListener } from '@admin-core/shared-core';
