/**
 * 快捷键管理工具
 * @description 处理全局快捷键的监听和匹配
 */

import { SHORTCUT_KEY_BINDINGS } from '../config/defaults';
import { isMacOs } from './platform';
import type { Preferences } from '../types';

// 缓存平台检测结果（避免每次调用都检测）
let cachedIsMac: boolean | null = null;

/**
 * 获取是否为 Mac 平台（带缓存）
 */
function getIsMac(): boolean {
  if (cachedIsMac === null) {
    cachedIsMac = isMacOs();
  }
  return cachedIsMac;
}

/**
 * 快捷键事件类型
 */
export type ShortcutKeyAction =
  | 'globalPreferences'
  | 'globalSearch'
  | 'globalLockScreen'
  | 'globalLogout';

/**
 * 快捷键回调函数映射
 */
export interface ShortcutKeyCallbacks {
  onPreferences?: () => void;
  onSearch?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

/**
 * 快捷键管理器配置
 */
export interface ShortcutManagerOptions {
  /** 偏好设置（用于检查功能是否启用） */
  getPreferences: () => Preferences;
  /** 回调函数 */
  callbacks: ShortcutKeyCallbacks;
  /** 是否启用快捷键监听（默认 true） */
  enabled?: boolean;
  /** 可选的事件目标（默认 window） */
  target?: Window | Document;
}

/**
 * 按键到 KeyboardEvent.code 的映射
 */
const KEY_CODE_MAP: Record<string, string> = {
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
};

/**
 * 检查键盘事件是否匹配指定的快捷键
 * @param event - 键盘事件
 * @param action - 快捷键动作标识
 * @returns 是否匹配
 */
export function matchShortcutKey(event: KeyboardEvent, action: ShortcutKeyAction): boolean {
  // 防御性检查
  if (!event || !action) return false;
  
  const binding = SHORTCUT_KEY_BINDINGS[action];
  if (!binding) return false;

  const isMac = getIsMac();
  const keys = isMac ? binding.keysMac : binding.keys;

  // 检查修饰键
  const needCtrl = keys.some((k) => k === 'Ctrl' || k === '⌘');
  const needAlt = keys.some((k) => k === 'Alt' || k === '⌥');
  const needShift = keys.some((k) => k === 'Shift' || k === '⇧');
  const needMeta = isMac && keys.some((k) => k === '⌘');

  // Mac 上 ⌘ 对应 metaKey，Windows 上 Ctrl 对应 ctrlKey
  const ctrlMatch = isMac ? event.metaKey === needMeta : event.ctrlKey === needCtrl;
  const altMatch = event.altKey === needAlt;
  const shiftMatch = event.shiftKey === needShift;

  if (!ctrlMatch || !altMatch || !shiftMatch) return false;

  // 获取主键（非修饰键）
  const mainKey = keys.find(
    (k) => !['Ctrl', 'Alt', 'Shift', '⌘', '⌥', '⇧'].includes(k)
  );
  if (!mainKey) return false;

  // 使用 event.code 匹配（更可靠，不受 Shift 影响）
  const targetCode = KEY_CODE_MAP[mainKey] || `Key${mainKey.toUpperCase()}`;
  if (event.code === targetCode) return true;

  // 备用：使用 event.key 匹配（处理字母键）
  const pressedKey = event.key.toUpperCase();
  const targetKey = mainKey.toUpperCase();
  if (targetKey === pressedKey) return true;

  return false;
}

/**
 * 创建快捷键管理器
 * @param options - 配置选项
 * @returns 销毁函数
 */
export function createShortcutManager(options: ShortcutManagerOptions): () => void {
  const { getPreferences, callbacks, enabled = true, target = window } = options;

  const handleKeyDown = (event: KeyboardEvent) => {
    // 防御性检查
    if (!enabled) return;
    let preferences: Preferences;
    try {
      preferences = getPreferences();
      if (!preferences) return;
    } catch {
      return;
    }

    // 检查是否启用快捷键
    if (!preferences.shortcutKeys.enable) {
      return;
    }

    // 检查是否在输入框中（避免干扰输入）
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }
    const isInputElement =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;
    if (isInputElement) {
      return;
    }

    // 匹配并执行快捷键
    if (
      preferences.shortcutKeys.globalPreferences &&
      matchShortcutKey(event, 'globalPreferences')
    ) {
      event.preventDefault();
      callbacks.onPreferences?.();
      return;
    }

    if (
      preferences.shortcutKeys.globalSearch &&
      matchShortcutKey(event, 'globalSearch')
    ) {
      event.preventDefault();
      callbacks.onSearch?.();
      return;
    }

    if (
      preferences.shortcutKeys.globalLockScreen &&
      matchShortcutKey(event, 'globalLockScreen')
    ) {
      event.preventDefault();
      callbacks.onLockScreen?.();
      return;
    }

    if (
      preferences.shortcutKeys.globalLogout &&
      matchShortcutKey(event, 'globalLogout')
    ) {
      event.preventDefault();
      callbacks.onLogout?.();
      return;
    }
  };

  // 注册事件监听
  target.addEventListener('keydown', handleKeyDown as EventListener);

  // 返回销毁函数
  return () => {
    target.removeEventListener('keydown', handleKeyDown as EventListener);
  };
}

/**
 * 快捷键 Hook 的返回类型
 */
export interface UseShortcutKeysResult {
  /** 销毁快捷键监听 */
  destroy: () => void;
}
