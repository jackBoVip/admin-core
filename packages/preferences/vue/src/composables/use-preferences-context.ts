/**
 * 偏好设置上下文 composable
 * @description 用于在 PreferencesProvider 的子组件中访问偏好设置上下文
 */
import { inject, type Ref, type ComputedRef } from 'vue';

export interface PreferencesContextValue {
  /** 打开偏好设置抽屉 */
  openPreferences: () => void;
  /** 关闭偏好设置抽屉 */
  closePreferences: () => void;
  /** 切换偏好设置抽屉 */
  togglePreferences: () => void;
  /** 抽屉是否打开 */
  isPreferencesOpen: Readonly<Ref<boolean>>;
  /** 锁定屏幕（如果没有密码会弹出设置弹窗） */
  lock: () => void;
  /** 解锁屏幕 */
  unlock: () => void;
  /** 是否已锁定 */
  isLocked: Readonly<ComputedRef<boolean>>;
  /** 是否已设置密码 */
  hasPassword: Readonly<ComputedRef<boolean>>;
  /** 是否启用锁屏功能 */
  isLockEnabled: Readonly<ComputedRef<boolean>>;
}

/**
 * 使用偏好设置上下文
 * @description 必须在 PreferencesProvider 组件内使用
 */
export function usePreferencesContext(): PreferencesContextValue {
  const context = inject<PreferencesContextValue>('preferencesContext');
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}
