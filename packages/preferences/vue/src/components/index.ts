/**
 * Vue Components 模块
 */

export { Icon, default as AdminIcon, type IconProps } from './Icon';
export { LayoutIcon, default as AdminLayoutIcon, type LayoutIconProps } from './LayoutIcon';

// 偏好设置提供者（推荐使用，自动集成锁屏和快捷键）
export { default as PreferencesProvider } from './PreferencesProvider.vue';

/** Vue 偏好设置上下文类型 */
export interface PreferencesContextValue {
  /** 打开偏好设置抽屉 */
  openPreferences: () => void;
  /** 关闭偏好设置抽屉 */
  closePreferences: () => void;
  /** 切换偏好设置抽屉 */
  togglePreferences: () => void;
  /** 抽屉是否打开 */
  isPreferencesOpen: import('vue').Ref<boolean>;
  /** 锁定屏幕（如果没有密码会弹出设置弹窗） */
  lock: () => void;
  /** 解锁屏幕 */
  unlock: () => void;
  /** 是否已锁定 */
  isLocked: import('vue').Ref<boolean>;
  /** 是否已设置密码 */
  hasPassword: import('vue').Ref<boolean>;
  /** 是否启用锁屏功能 */
  isLockEnabled: import('vue').Ref<boolean>;
}

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
  NumberItem as PreferencesNumberItem,
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
  type NumberItemProps as PreferencesNumberItemProps,
} from './drawer';

// 内部组件（被 PreferencesProvider 使用）
export { LockScreen } from './lock-screen';
