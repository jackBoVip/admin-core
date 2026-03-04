/**
 * 快捷键解析工具（布局层）。
 * @description 负责快捷键事件过滤、动作判定与动作分发，不直接依赖 UI 层实现。
 */

import { matchShortcutKey, type ShortcutKeyPreferences } from '@admin-core/preferences';

/**
 * 快捷键动作类型。
 */
export type ShortcutAction = 'globalSearch' | 'globalLockScreen' | 'globalLogout';
/**
 * 快捷键动作回调集合。
 */
export interface ShortcutActionHandlers {
  /** 命中锁屏快捷键时触发。 */
  onLockScreen?: () => void;
  /** 命中退出登录快捷键时触发。 */
  onLogout?: () => void;
  /** 命中全局搜索快捷键时触发。 */
  onGlobalSearch?: (keyword: string) => void;
}

/**
 * 是否忽略快捷键事件（避免影响输入）。
 * @description 当焦点位于输入控件或事件已被消费时，直接跳过快捷键处理。
 * @param event 键盘事件。
 * @returns 是否应忽略本次快捷键处理。
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
 * 解析快捷键动作。
 * @description 按固定优先级匹配搜索、锁屏、退出登录动作，并遵循配置开关。
 * @param event 键盘事件。
 * @param config 快捷键配置。
 * @returns 命中的快捷键动作；未命中时返回 `null`。
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
 * 分发快捷键动作。
 * @description 根据动作类型调用对应处理器，并返回是否成功命中可执行动作。
 * @param action 快捷键动作类型。
 * @param handlers 快捷键动作处理器集合。
 * @returns 是否命中了可执行动作。
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
