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
 * 抽屉基础组件 Props（框架无关）
 */
export interface DrawerItemBaseProps {
  /** 标签文本 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 开关项基础 Props
 */
export interface SwitchItemBaseProps extends DrawerItemBaseProps {
  /** 图标 SVG 字符串 */
  icon?: string;
  /** 提示文本 */
  tip?: string;
}

/**
 * 选择项基础 Props
 */
export interface SelectItemBaseProps extends DrawerItemBaseProps {
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
}

/**
 * 滑动条基础 Props
 */
export interface SliderItemBaseProps extends DrawerItemBaseProps {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 单位文本 */
  unit?: string;
  /** 防抖延迟 (ms) */
  debounce?: number;
}

/**
 * 输入项基础 Props
 */
export interface InputItemBaseProps extends DrawerItemBaseProps {
  /** 占位符 */
  placeholder?: string;
  /** 防抖延迟 (ms) */
  debounce?: number;
  /** 最大长度 */
  maxLength?: number;
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

/**
 * 锁屏组件 Props（Vue/React 共享）
 */
export interface LockScreenComponentProps {
  /** 退出登录回调 */
  onLogout?: () => void;
  /** 用户头像 URL */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 背景图片 URL，传入空字符串禁用背景，不传则使用默认背景 */
  backgroundImage?: string;
}

/**
 * 锁屏密码弹窗 Props（Vue/React 共享）
 */
export interface LockPasswordModalComponentProps {
  /** 是否显示 */
  open?: boolean;
  /** 用户头像 URL */
  avatar?: string;
  /** 用户名 */
  username?: string;
}

/**
 * PreferencesProvider Props（Vue/React 共享）
 */
export interface PreferencesProviderComponentProps {
  /** 是否显示触发按钮 */
  showTrigger?: boolean;
  /** 退出登录回调 */
  onLogout?: () => void;
  /** 全局搜索回调 */
  onSearch?: () => void;
  /** 锁屏时回调 */
  onLock?: () => void;
  /** 解锁时回调 */
  onUnlock?: () => void;
  /** 用户头像 URL */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 锁屏背景图片 URL，传入空字符串禁用背景，不传则使用默认背景 */
  lockScreenBackground?: string;
}
