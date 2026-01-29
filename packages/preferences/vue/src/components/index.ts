/**
 * Vue Components 模块
 */

export { Icon, default as AdminIcon, type IconProps } from './Icon';
export { LayoutIcon, default as AdminLayoutIcon, type LayoutIconProps } from './LayoutIcon';

// 偏好设置提供者（推荐使用，自动集成锁屏和快捷键）
export { default as PreferencesProvider } from './PreferencesProvider.vue';

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
export { LockScreen } from './lock-screen';
