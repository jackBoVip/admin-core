/**
 * React 偏好设置抽屉模块导出入口。
 * @description 聚合抽屉主组件、页签组件与基础表单项组件，供外部按需引入。
 */

/**
 * 主组件导出。
 */
export { PreferencesDrawer, type PreferencesDrawerProps } from './PreferencesDrawer';
export { PreferencesTrigger, type PreferencesTriggerProps } from './PreferencesTrigger';

/**
 * 标签页组件导出（可独立使用）。
 */
export { AppearanceTab, type AppearanceTabProps } from './AppearanceTab';
export { LayoutTab, type LayoutTabProps } from './LayoutTab';
export { ShortcutKeysTab, type ShortcutKeysTabProps } from './ShortcutKeysTab';
export { GeneralTab, type GeneralTabProps } from './GeneralTab';

/**
 * 基础表单项组件导出。
 */
export { Block, type BlockProps } from './Block';
export { SwitchItem, type SwitchItemProps } from './SwitchItem';
export { SelectItem, type SelectItemProps } from './SelectItem';
export { SliderItem, type SliderItemProps } from './SliderItem';
export { InputItem, type InputItemProps } from './InputItem';
export { NumberItem, type NumberItemProps } from './NumberItem';
