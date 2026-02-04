/**
 * Vue 组件 Props 类型定义
 * @description 导出所有抽屉组件的 Props 类型，供外部使用
 */

import type {
  InputItemBaseProps,
  SelectItemBaseProps,
  SliderItemBaseProps,
  SwitchItemBaseProps,
  TabComponentProps,
} from '@admin-core/preferences';

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
export interface SwitchItemProps extends SwitchItemBaseProps {
  /** 当前值 */
  modelValue: boolean;
}

/**
 * SelectItem Props
 */
export interface SelectItemProps extends SelectItemBaseProps {
  /** 当前值 */
  modelValue: string | number;
}

/**
 * SliderItem Props
 */
export interface SliderItemProps extends SliderItemBaseProps {
  /** 当前值 */
  modelValue: number;
  /** 格式化显示值 */
  formatValue?: (value: number) => string;
}

/**
 * InputItem Props
 */
export interface InputItemProps extends InputItemBaseProps {
  /** 当前值 */
  modelValue: string;
}

/**
 * AppearanceTab Props
 */
export type AppearanceTabProps = TabComponentProps;

/**
 * LayoutTab Props
 */
export type LayoutTabProps = TabComponentProps;

/**
 * ShortcutKeysTab Props
 */
export type ShortcutKeysTabProps = TabComponentProps;

/**
 * GeneralTab Props
 */
export type GeneralTabProps = TabComponentProps;
