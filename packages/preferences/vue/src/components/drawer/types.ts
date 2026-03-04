/**
 * Vue 抽屉组件 Props 类型定义。
 * @description 汇总偏好抽屉相关子组件的属性契约，供组件实现与外部调用复用。
 */

import type {
  InputItemBaseProps,
  SelectItemBaseProps,
  SliderItemBaseProps,
  SwitchItemBaseProps,
  TabComponentProps,
} from '@admin-core/preferences';

/**
 * 偏好抽屉组件 Props。
 * @description 定义抽屉显隐与蒙层交互行为。
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
 * 偏好触发器组件 Props。
 * @description 定义触发入口的样式扩展参数。
 */
export interface PreferencesTriggerProps {
  /** 自定义类名 */
  class?: string;
}

/**
 * 区块组件 Props。
 * @description 定义抽屉内分组标题与说明文案。
 */
export interface BlockProps {
  /** 标题（可选） */
  title?: string;
  /** 描述（可选） */
  description?: string;
}

/**
 * 开关设置项 Props。
 * @description 在开关基础属性上补充 `v-model` 绑定值。
 */
export interface SwitchItemProps extends SwitchItemBaseProps {
  /** 当前值 */
  modelValue: boolean;
}

/**
 * 下拉设置项 Props。
 * @description 在选择器基础属性上补充 `v-model` 绑定值。
 */
export interface SelectItemProps extends SelectItemBaseProps {
  /** 当前值 */
  modelValue: string | number;
}

/**
 * 滑块设置项 Props。
 * @description 在滑块基础属性上补充值格式化能力。
 */
export interface SliderItemProps extends SliderItemBaseProps {
  /** 当前值 */
  modelValue: number;
  /** 格式化显示值 */
  formatValue?: (value: number) => string;
}

/**
 * 文本输入设置项 Props。
 * @description 在输入基础属性上补充字符串类型的 `v-model` 绑定值。
 */
export interface InputItemProps extends InputItemBaseProps {
  /** 当前值 */
  modelValue: string;
}

/**
 * 数值输入设置项 Props。
 * @description 在输入基础属性上补充数值类型的 `v-model` 绑定值。
 */
export interface NumberItemProps extends InputItemBaseProps {
  /** 当前值 */
  modelValue: number;
}

/**
 * 外观页签 Props。
 * @description 外观设置页签的属性别名，复用通用页签属性。
 */
export type AppearanceTabProps = TabComponentProps;

/**
 * 布局页签 Props。
 * @description 布局设置页签的属性别名，复用通用页签属性。
 */
export type LayoutTabProps = TabComponentProps;

/**
 * 快捷键页签 Props。
 * @description 快捷键设置页签的属性别名，复用通用页签属性。
 */
export type ShortcutKeysTabProps = TabComponentProps;

/**
 * 通用页签 Props。
 * @description 通用设置页签的属性别名，复用通用页签属性。
 */
export type GeneralTabProps = TabComponentProps;
