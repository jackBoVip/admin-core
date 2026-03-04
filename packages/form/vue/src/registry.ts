/**
 * Form Vue 适配器注册入口。
 * @description 提供 Vue 组件映射注册、适配库初始化与注册表读取能力。
 */
import type { Component } from 'vue';

import { createFormAdapterRuntime } from '@admin-core/form-shared';

import { nativeVueComponents } from './components/native-components';
import type {
  RegisterVueFormComponentsOptions,
  SetupAdminFormVueOptions,
  VueAdapterInput,
} from './types';

/**
 * Vue 表单适配器运行时实例。
 * @description 负责统一管理组件注册、库优先级与桥接能力。
 */
const runtime = createFormAdapterRuntime<Component, VueAdapterInput>({
  nativeComponents: nativeVueComponents,
});
/** 适配器桥接对象（提供 registry 等能力）。 */
const bridge = runtime.bridge;

/**
 * 初始化 Vue 表单适配器。
 *
 * @param options 初始化配置。
 * @returns 无返回值。
 */
export function setupAdminFormVue(options: SetupAdminFormVueOptions = {}) {
  runtime.setup(options);
}

/**
 * `setupAdminFormVue` 的兼容别名。
 * 便于与 React 侧保持统一的初始化命名习惯。
 */
export const setupAdminForm = setupAdminFormVue;

/**
 * 注册 Vue 表单组件映射。
 *
 * @param components 组件映射表。
 * @param options 注册选项。
 * @returns 无返回值。
 */
export function registerFormComponents(
  components: VueAdapterInput['components'],
  options: RegisterVueFormComponentsOptions = {}
) {
  runtime.register(components, options);
}

/**
 * 获取 Vue 表单适配器注册表实例。
 * @returns 组件注册表对象。
 */
export function getVueFormAdapterRegistry() {
  return bridge.registry;
}

/**
 * `getVueFormAdapterRegistry` 的兼容别名。
 * @returns 组件注册表对象。
 */
export const getFormAdapterRegistry = getVueFormAdapterRegistry;
