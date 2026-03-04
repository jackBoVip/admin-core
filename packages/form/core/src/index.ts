/**
 * @admin-core/form-core
 * 框架无关表单引擎
 */

/**
 * 导出表单适配器注册、编译与运行时配置能力。
 */
export * from './adapter/registry';
export * from './compiler';
export * from './config';
export { createFormApi, registerFormRules } from './form-api';
/**
 * 导出表单国际化、样式与工具能力。
 */
export * from './locales';
export * from './styles';
/** 表单核心类型定义。 */
export type * from './types';
export * from './utils';
/**
 * 复用 shared-core Store 能力，便于上层统一导入。
 */
export { createStore } from '@admin-core/shared-core';

/**
 * 透传 zod 供规则/schema 定义复用。
 */
export { z } from 'zod';
