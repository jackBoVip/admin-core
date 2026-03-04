/**
 * Table Core 类型导出入口。
 * @description 汇总 table-core 对外公开的 API、配置、语言、渲染器与表格结构类型。
 */
/** 表格 API 类型。 */
export type * from './api';
/** 表格初始化配置类型。 */
export type * from './config';
/** 表格国际化类型。 */
export type * from './locales';
/**
 * 渲染器注册与上下文类型。
 * @description 约束单元格渲染器、注册表和渲染上下文参数。
 */
export type * from './renderer';
/**
 * 列、工具栏与表格运行态类型。
 * @description 包含列定义、分页、查询、工具栏与运行状态契约。
 */
export type * from './table';
/**
 * 复用 shared-core 通用 Store 类型。
 * @description 避免调用方重复引入 shared-core。
 */
export type { StoreApi, StoreListener } from '@admin-core/shared-core';
