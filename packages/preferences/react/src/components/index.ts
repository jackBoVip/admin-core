/**
 * React Components 模块
 */

import { Icon, type IconProps } from './Icon';
import { LayoutIcon, type LayoutIconProps } from './LayoutIcon';

// 导出 Icon 组件（带别名）
export { Icon, type IconProps };
export { LayoutIcon, type LayoutIconProps };

// 别名导出
export const AdminIcon = Icon;
export const AdminLayoutIcon = LayoutIcon;

// 偏好设置提供者（推荐使用，自动集成锁屏和快捷键）
export {
  PreferencesProvider,
  usePreferencesContext,
  type PreferencesProviderProps,
  type PreferencesContextValue,
} from './PreferencesProvider';

// 偏好设置抽屉组件（高级场景单独使用）
export {
  // 主组件
  PreferencesDrawer,
  PreferencesTrigger,
  // Tab 组件（可独立使用）
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  // 基础组件
  Block as PreferencesBlock,
  SwitchItem as PreferencesSwitchItem,
  SelectItem as PreferencesSelectItem,
  SliderItem as PreferencesSliderItem,
  InputItem as PreferencesInputItem,
  // 类型
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
} from './drawer';

// 内部组件（被 PreferencesProvider 使用）
export { LockScreen, type LockScreenProps } from './lock-screen';
