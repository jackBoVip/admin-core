/**
 * 快捷键解析工具（布局层）
 */

import { matchShortcutKey, type ShortcutKeyPreferences } from '@admin-core/preferences';

export type ShortcutAction = 'globalSearch' | 'globalLockScreen' | 'globalLogout';
export interface ShortcutActionHandlers {
  onLockScreen?: () => void;
  onLogout?: () => void;
  onGlobalSearch?: (keyword: string) => void;
}

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

/**
 * 分发快捷键动作
 * @returns 是否命中了可执行动作
 */
export function dispatchShortcutAction(
  action: ShortcutAction,
  handlers: ShortcutActionHandlers
): boolean {
  if (!action) return false;
  if (action === 'globalLockScreen') {
    handlers.onLockScreen?.();
    return true;
  }
  if (action === 'globalLogout') {
    handlers.onLogout?.();
    return true;
  }
  if (action === 'globalSearch') {
    handlers.onGlobalSearch?.('');
    return true;
  }
  return false;
}
