/**
 * @admin-core/page-core
 * 框架无关页面容器引擎
 */

export * from './config';
export * from './constants';
export * from './locales';
export { createPageApi, createPageApiWithRuntimeOptions } from './page-api';
export * from './styles';
/** 页面核心类型定义。 */
export type * from './types';
export * from './utils';
/**
 * 复用 shared-core 通用 Store 工具，便于上层统一导入。
 */
export { createStore } from '@admin-core/shared-core';
