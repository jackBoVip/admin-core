/**
 * 快捷键解析工具（布局层）
 */

import { matchShortcutKey, type ShortcutKeyPreferences } from '@admin-core/preferences';

export type ShortcutAction = 'globalSearch' | 'globalLockScreen' | 'globalLogout';

/**
 * 是否忽略快捷键事件（避免影响输入）
 */
export function shouldIgnoreShortcutEvent(event: KeyboardEvent): boolean {
  if (!event) return true;
  if (event.defaultPrevented) return true;
  const target = event.target;
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * 解析快捷键动作
 */
export function resolveShortcutAction(
  event: KeyboardEvent,
  config?: Partial<ShortcutKeyPreferences>
): ShortcutAction | null {
  if (!event) return null;
  if (config?.enable === false) return null;

  if (config?.globalSearch !== false && matchShortcutKey(event, 'globalSearch')) {
    return 'globalSearch';
  }
  if (config?.globalLockScreen !== false && matchShortcutKey(event, 'globalLockScreen')) {
    return 'globalLockScreen';
  }
  if (config?.globalLogout !== false && matchShortcutKey(event, 'globalLogout')) {
    return 'globalLogout';
  }

  return null;
}
