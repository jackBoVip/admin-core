/**
 * Form React 适配器注册入口。
 * @description 提供 React 组件映射注册、适配库初始化与注册表读取能力。
 */
import { createFormAdapterRuntime } from '@admin-core/form-shared';
import { nativeReactComponents } from './components/native-components';
import type {
  ReactAdapterInput,
  RegisterReactFormComponentsOptions,
  SetupAdminFormReactOptions,
} from './types';
import type { ComponentType } from 'react';

/**
 * React 表单适配器运行时实例。
 * @description 负责统一管理组件注册、库优先级与桥接能力。
 */
const runtime = createFormAdapterRuntime<ComponentType<any>, ReactAdapterInput>({
  defaultBaseModelPropName: 'value',
  nativeComponents: nativeReactComponents,
});
/** 适配器桥接对象（提供 registry 等能力）。 */
const bridge = runtime.bridge;

/**
 * 初始化 React 表单适配器。
 *
 * @param options 初始化配置。
 * @returns 无返回值。
 */
export function setupAdminFormReact(options: SetupAdminFormReactOptions = {}) {
  runtime.setup(options);
}

/**
 * `setupAdminFormReact` 的兼容别名。
 * 便于与 Vue 侧保持统一的初始化命名习惯。
 */
export const setupAdminForm = setupAdminFormReact;

/**
 * 注册 React 表单组件映射。
 *
 * @param components 组件映射表。
 * @param options 注册选项。
 * @returns 无返回值。
 */
export function registerFormComponents(
  components: ReactAdapterInput['components'],
  options: RegisterReactFormComponentsOptions = {}
) {
  runtime.register(components, options);
}

/**
 * 获取 React 表单适配器注册表实例。
 * @returns 组件注册表对象。
 */
export function getReactFormAdapterRegistry() {
  return bridge.registry;
}

/**
 * `getReactFormAdapterRegistry` 的兼容别名。
 * @returns 组件注册表对象。
 */
export const getFormAdapterRegistry = getReactFormAdapterRegistry;
