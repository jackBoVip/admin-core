/**
 * @admin-core/form-core
 * 框架无关表单引擎
 */

export * from './adapter/registry';
export * from './compiler';
export * from './config';
export { createFormApi, registerFormRules } from './form-api';
export * from './locales';
export * from './styles';
export type * from './types';
export * from './utils';
export { createStore } from '@admin-core/shared-core';

export { z } from 'zod';
