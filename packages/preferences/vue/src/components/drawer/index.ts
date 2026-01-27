/**
 * 偏好设置抽屉组件
 */

// 主组件
export { default as PreferencesDrawer } from './PreferencesDrawer.vue';
export { default as PreferencesTrigger } from './PreferencesTrigger.vue';

// 标签页组件（可单独使用）
export { default as AppearanceTab } from './AppearanceTab.vue';
export { default as LayoutTab } from './LayoutTab.vue';
export { default as ShortcutKeysTab } from './ShortcutKeysTab.vue';
export { default as GeneralTab } from './GeneralTab.vue';

// 基础组件
export { default as Block } from './Block.vue';
export { default as SwitchItem } from './SwitchItem.vue';
export { default as SelectItem } from './SelectItem.vue';
export { default as SliderItem } from './SliderItem.vue';

// 类型
export type {
  PreferencesDrawerProps,
  PreferencesTriggerProps,
  AppearanceTabProps,
  LayoutTabProps,
  ShortcutKeysTabProps,
  GeneralTabProps,
  BlockProps,
  SwitchItemProps,
  SelectItemProps,
  SliderItemProps,
} from './types';
