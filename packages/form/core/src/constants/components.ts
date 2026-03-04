/**
 * Form Core 语义组件常量。
 * @description 定义语义组件键、模型属性映射与事件属性映射等基础协议常量。
 */
import type { SemanticFormComponentType } from '../types';

/**
 * 语义组件键集合。
 * 用于约束 schema 中可直接使用的组件标识。
 */
export const SEMANTIC_COMPONENT_KEYS: SemanticFormComponentType[] = [
  'input',
  'password',
  'textarea',
  'select',
  'checkbox',
  'checkbox-group',
  'radio',
  'radio-group',
  'range',
  'section-title',
  'switch',
  'date',
  'date-range',
  'time',
  'default-button',
  'primary-button',
];

/** 默认双向绑定属性名。 */
export const DEFAULT_MODEL_PROP_NAME = 'modelValue';

/**
 * 组件事件属性名覆盖表。
 * 当组件不使用 `modelValue` 作为值属性时，通过该映射指定正确的受控属性。
 */
export const COMPONENT_EVENT_PROP_OVERRIDES: Partial<
  Record<SemanticFormComponentType, string>
> = {
  checkbox: 'checked',
  switch: 'checked',
};
