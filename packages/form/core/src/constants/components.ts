import type { SemanticFormComponentType } from '../types';

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

export const DEFAULT_MODEL_PROP_NAME = 'modelValue';

export const COMPONENT_EVENT_PROP_OVERRIDES: Partial<
  Record<SemanticFormComponentType, string>
> = {
  checkbox: 'checked',
  switch: 'checked',
};
