/**
 * React 组件模块导出。
 * @description 聚合偏好设置图标、Provider、抽屉页签与锁屏组件。
 */

import { Icon, type IconProps } from './Icon';
import { LayoutIcon, type LayoutIconProps } from './LayoutIcon';

/**
 * 导出 Icon 组件（带别名）。
 * @description `AdminIcon` 与 `Icon` 指向同一组件实现。
 */
export { Icon, type IconProps };
export { LayoutIcon, type LayoutIconProps };

/**
 * 别名导出。
 * @description 为调用方提供语义化命名，便于统一业务代码风格。
 */
/**
 * 通用图标组件导出别名。
 */
export const AdminIcon = Icon;
/**
 * 布局图标组件导出别名。
 */
export const AdminLayoutIcon = LayoutIcon;

/**
 * 偏好设置提供者（推荐使用，自动集成锁屏和快捷键）。
 */
export {
  PreferencesProvider,
  usePreferencesContext,
  type PreferencesProviderProps,
  type PreferencesContextValue,
} from './PreferencesProvider';

/**
 * 偏好设置抽屉组件（高级场景单独使用）。
 * @description 支持直接组合抽屉、触发器、页签组件与基础表单项组件。
 */
export {
  /** 主组件 */
  PreferencesDrawer,
  PreferencesTrigger,
  /** 页签组件（可独立使用） */
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  /** 基础组件 */
  Block as PreferencesBlock,
  SwitchItem as PreferencesSwitchItem,
  SelectItem as PreferencesSelectItem,
  SliderItem as PreferencesSliderItem,
  InputItem as PreferencesInputItem,
  NumberItem as PreferencesNumberItem,
  /** 类型 */
  type PreferencesDrawerProps,
  type PreferencesTriggerProps,
  type AppearanceTabProps,
  type LayoutTabProps,
  type ShortcutKeysTabProps,
  type GeneralTabProps,
  type BlockProps as PreferencesBlockProps,
  type SwitchItemProps as PreferencesSwitchItemProps,
  type SelectItemProps as PreferencesSelectItemProps,
  type SliderItemProps as PreferencesSliderItemProps,
  type InputItemProps as PreferencesInputItemProps,
  type NumberItemProps as PreferencesNumberItemProps,
} from './drawer';

/**
 * 内部组件（被 `PreferencesProvider` 使用）。
 * @description 一般无需直接使用，保留导出用于特殊定制场景。
 */
export { LockScreen, type LockScreenProps } from './lock-screen';
