/**
 * Vue 组件 Props 类型定义
 * @description 导出所有抽屉组件的 Props 类型，供外部使用
 */

import type { LocaleMessages } from '@admin-core/preferences';

/**
 * PreferencesDrawer Props
 */
export interface PreferencesDrawerProps {
  /** 是否显示 */
  open?: boolean;
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlay?: boolean;
}

/**
 * PreferencesTrigger Props
 */
export interface PreferencesTriggerProps {
  /** 自定义类名 */
  class?: string;
}

/**
 * Block Props
 */
export interface BlockProps {
  /** 标题（可选） */
  title?: string;
  /** 描述（可选） */
  description?: string;
}

/**
 * SwitchItem Props
 */
export interface SwitchItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  modelValue: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * SelectItem Props
 */
export interface SelectItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  modelValue: string | number;
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * SliderItem Props
 */
export interface SliderItemProps {
  /** 当前值 */
  modelValue: number;
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 格式化显示值 */
  formatValue?: (value: number) => string;
}

/**
 * InputItem Props
 */
export interface InputItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  modelValue: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * AppearanceTab Props
 */
export interface AppearanceTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

/**
 * LayoutTab Props
 */
export interface LayoutTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

/**
 * ShortcutKeysTab Props
 */
export interface ShortcutKeysTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

/**
 * GeneralTab Props
 */
export interface GeneralTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}
