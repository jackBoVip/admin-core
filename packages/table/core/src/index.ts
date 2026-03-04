/**
 * @admin-core/table-core
 * 框架无关表格引擎
 */

/**
 * 导出 Table Core 初始化、默认值与语言能力。
 */
export * from './config';
export * from './constants/defaults';
export * from './locales';
/**
 * 导出代理扩展与渲染器注册能力。
 */
export * from './proxy';
export * from './renderer/registry';
export { createTableApi } from './table-api';
export * from './styles';
/**
 * 导出 Table Core 类型与工具函数。
 */
export type * from './types';
export * from './utils';
/**
 * 复用 shared-core Store 能力，便于上层统一导入。
 */
export { createStore } from '@admin-core/shared-core';
