/**
 * 组件 Props 类型定义
 * @description 框架无关的组件属性类型，Vue/React 共享
 */

import type { LocaleMessages } from '../locales';
import type { SelectOption } from './utils';

/**
 * 抽屉组件 Props（通用）
 */
export interface DrawerComponentProps {
  /** 是否显示 */
  open?: boolean;
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlay?: boolean;
}

/**
 * 触发按钮组件 Props
 */
export interface TriggerComponentProps {
  /** 自定义类名 */
  className?: string;
  /** 是否显示 */
  show?: boolean;
}

/**
 * 区块组件 Props
 */
export interface BlockComponentProps {
  /** 标题 */
  title: string;
  /** 描述（可选） */
  description?: string;
}

/**
 * 开关组件 Props（通用基础）
 */
export interface SwitchComponentProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  checked: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 选择组件 Props（通用基础）
 */
export interface SelectComponentProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 选项列表 */
  options: SelectOption[];
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * Tab 组件通用 Props
 */
export interface TabComponentProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

/**
 * 外观 Tab Props
 */
export type AppearanceTabComponentProps = TabComponentProps;

/**
 * 布局 Tab Props
 */
export type LayoutTabComponentProps = TabComponentProps;

/**
 * 快捷键 Tab Props
 */
export type ShortcutKeysTabComponentProps = TabComponentProps;

/**
 * 通用设置 Tab Props
 */
export type GeneralTabComponentProps = TabComponentProps;
