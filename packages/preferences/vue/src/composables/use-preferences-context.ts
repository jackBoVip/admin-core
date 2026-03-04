/**
 * 偏好设置上下文 Composable 模块。
 * @description 在 `PreferencesProvider` 子树内读取抽屉控制、锁屏状态与锁屏动作。
 */
import { inject, type Ref, type ComputedRef } from 'vue';

/**
 * 偏好设置上下文值结构。
 */
export interface PreferencesContextValue {
  /** 打开偏好设置抽屉。 */
  openPreferences: () => void;
  /** 关闭偏好设置抽屉。 */
  closePreferences: () => void;
  /** 切换偏好设置抽屉开关状态。 */
  togglePreferences: () => void;
  /** 抽屉是否打开。 */
  isPreferencesOpen: Readonly<Ref<boolean>>;
  /** 锁定屏幕（若未设置密码通常会触发设置流程）。 */
  lock: () => void;
  /** 解锁屏幕。 */
  unlock: () => void;
  /** 当前是否处于锁定状态。 */
  isLocked: Readonly<ComputedRef<boolean>>;
  /** 是否已配置锁屏密码。 */
  hasPassword: Readonly<ComputedRef<boolean>>;
  /** 是否启用锁屏功能。 */
  isLockEnabled: Readonly<ComputedRef<boolean>>;
}

/**
 * 使用偏好设置上下文。
 * @description 必须在 `PreferencesProvider` 组件作用域内调用。
 * @returns 偏好设置上下文对象。
 * @throws 当未在 `PreferencesProvider` 内调用时抛出错误。
 */
export function usePreferencesContext(): PreferencesContextValue {
  const context = inject<PreferencesContextValue>('preferencesContext');
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}
