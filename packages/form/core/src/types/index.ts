/**
 * form-core 类型导出入口。
 * @description 汇总 form-core 对外公开的类型定义。
 */
/** 适配器相关类型。 */
export type * from './adapter';
/** 表单 API 类型。 */
export type * from './api';
/** 提交页与步骤表单类型。 */
export type * from './page';
/** 表单结构与运行时字段类型。 */
export type * from './schema';
/**
 * 复用 shared-core 通用 Store 类型。
 * @description 避免调用方重复引入 shared-core。
 */
export type { StoreApi, StoreListener } from '@admin-core/shared-core';
