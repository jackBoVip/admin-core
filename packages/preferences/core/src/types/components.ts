/**
 * 组件 Props 类型定义。
 * @description 定义框架无关的组件属性结构，供 Vue/React 适配层共享。
 */

import type { LocaleMessages } from '../locales';

/**
 * 抽屉组件 Props（通用）。
 * @description 抽象设置抽屉容器最小行为，供不同框架组件复用。
 */
export interface DrawerComponentProps {
  /** 抽屉是否显示。 */
  open?: boolean;
  /** 是否显示遮罩层。 */
  showOverlay?: boolean;
  /** 点击遮罩层时是否关闭抽屉。 */
  closeOnOverlay?: boolean;
}

/**
 * 触发按钮组件 Props。
 * @description 控制偏好设置入口按钮的显隐与样式扩展。
 */
export interface TriggerComponentProps {
  /** 触发按钮自定义类名。 */
  className?: string;
  /** 是否显示触发按钮。 */
  show?: boolean;
}

/**
 * 区块组件 Props。
 * @description 定义抽屉内配置区块的标题与说明文案结构。
 */
export interface BlockComponentProps {
  /** 区块标题。 */
  title: string;
  /** 区块描述（可选）。 */
  description?: string;
}

/**
 * 抽屉基础组件 Props（框架无关）。
 * @description 抽象通用设置项的标签与禁用态参数。
 */
export interface DrawerItemBaseProps {
  /** 表单项标签文本。 */
  label: string;
  /** 当前项是否禁用。 */
  disabled?: boolean;
}

/**
 * 开关项基础 Props。
 * @description 在基础设置项之上扩展开关图标与提示语。
 */
export interface SwitchItemBaseProps extends DrawerItemBaseProps {
  /** 图标 SVG 字符串。 */
  icon?: string;
  /** 提示文本。 */
  tip?: string;
}

/**
 * 下拉选项定义。
 * @description 统一选择器组件选项数据结构，适配 Vue/React 渲染。
 */
export interface SelectItemOption {
  /** 显示标签。 */
  label: string;
  /** 值。 */
  value: string | number;
}

/**
 * 选择项基础 Props。
 * @description 定义下拉选择类设置项的可选项集合。
 */
export interface SelectItemBaseProps extends DrawerItemBaseProps {
  /** 可选项列表。 */
  options: SelectItemOption[];
}

/**
 * 滑动条基础 Props。
 * @description 用于数值类配置项，支持区间、步进与单位展示。
 */
export interface SliderItemBaseProps extends DrawerItemBaseProps {
  /** 最小值。 */
  min?: number;
  /** 最大值。 */
  max?: number;
  /** 步进值。 */
  step?: number;
  /** 单位文本。 */
  unit?: string;
  /** 输入防抖延迟（毫秒）。 */
  debounce?: number;
}

/**
 * 输入项基础 Props。
 * @description 用于文本/数字输入类设置项，支持校验约束与布局控制。
 */
export interface InputItemBaseProps extends DrawerItemBaseProps {
  /** 占位符文本。 */
  placeholder?: string;
  /** 输入防抖延迟（毫秒）。 */
  debounce?: number;
  /** 最大长度。 */
  maxLength?: number;
  /** 输入类型。 */
  type?: string;
  /** 输入模式。 */
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  /** 最小值（`type=number` 时生效）。 */
  min?: number;
  /** 最大值（`type=number` 时生效）。 */
  max?: number;
  /** 步进值（`type=number` 时生效）。 */
  step?: number;
  /** 是否使用行内布局（标签左侧、输入右侧）。 */
  inline?: boolean;
  /** 提示文本。 */
  tip?: string;
}

/**
 * 开关组件 Props（通用基础）。
 * @description 供基础开关控件渲染时消费的最小输入集合。
 */
export interface SwitchComponentProps {
  /** 标签文本。 */
  label: string;
  /** 当前开关值。 */
  checked: boolean;
  /** 是否禁用。 */
  disabled?: boolean;
}

/**
 * 选择组件 Props（通用基础）。
 * @description 供基础选择控件渲染时消费的最小输入集合。
 */
export interface SelectComponentProps {
  /** 标签文本。 */
  label: string;
  /** 当前选中值。 */
  value: string | number;
  /** 选项列表。 */
  options: SelectItemOption[];
  /** 是否禁用。 */
  disabled?: boolean;
}

/**
 * Tab 组件通用 Props。
 * @description 约束各设置页签组件共享的国际化输入。
 */
export interface TabComponentProps {
  /** 当前语言包。 */
  locale: LocaleMessages;
}

/**
 * 外观 Tab Props
 * @description 外观设置页签组件属性别名。
 */
export type AppearanceTabComponentProps = TabComponentProps;

/**
 * 布局 Tab Props
 * @description 布局设置页签组件属性别名。
 */
export type LayoutTabComponentProps = TabComponentProps;

/**
 * 快捷键 Tab Props
 * @description 快捷键设置页签组件属性别名。
 */
export type ShortcutKeysTabComponentProps = TabComponentProps;

/**
 * 通用设置 Tab Props
 * @description 通用设置页签组件属性别名。
 */
export type GeneralTabComponentProps = TabComponentProps;

/**
 * 锁屏组件 Props（Vue/React 共享）。
 * @description 统一锁屏页渲染所需的用户信息与行为回调参数。
 */
export interface LockScreenComponentProps {
  /** 退出登录回调。 */
  onLogout?: () => void;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 用户名。 */
  username?: string;
  /** 背景图片 URL，传入空字符串禁用背景，不传则使用默认背景。 */
  backgroundImage?: string;
}

/**
 * 锁屏密码弹窗 Props（Vue/React 共享）。
 * @description 统一锁屏解锁弹窗所需的展示与用户信息参数。
 */
export interface LockPasswordModalComponentProps {
  /** 弹窗是否显示。 */
  open?: boolean;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 用户名。 */
  username?: string;
}

/**
 * PreferencesProvider Props（Vue/React 共享）。
 * @description 统一偏好系统 Provider 容器的行为开关与用户信息输入。
 */
export interface PreferencesProviderComponentProps {
  /** 是否显示触发按钮。 */
  showTrigger?: boolean;
  /** 退出登录回调。 */
  onLogout?: () => void;
  /** 全局搜索回调。 */
  onSearch?: () => void;
  /** 锁屏时回调。 */
  onLock?: () => void;
  /** 解锁时回调。 */
  onUnlock?: () => void;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 用户名。 */
  username?: string;
  /** 锁屏背景图片 URL，传入空字符串禁用背景，不传则使用默认背景。 */
  lockScreenBackground?: string;
}
