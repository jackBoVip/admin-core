import { defaultLockScreenBg } from '../assets';
import { logger } from '../utils/logger';
import { verifyPasswordSync } from '../utils/password';
import type { LocaleMessages } from '../locales';
import type { Preferences } from '../types';

/**
 * 判断当前是否启用锁屏功能
 */
export function isLockScreenEnabled(preferences: Preferences): boolean {
  return preferences.widget.lockScreen === true;
}

/**
 * 是否已经设置了锁屏密码
 */
export function hasLockScreenPassword(preferences: Preferences): boolean {
  return Boolean(preferences.lockScreen.password);
}

/**
 * 当前配置下是否可以触发锁屏
 */
export function canLockScreen(preferences: Preferences): boolean {
  return isLockScreenEnabled(preferences) && hasLockScreenPassword(preferences);
}

// ============================================================
// 背景图片决策
// ============================================================

export interface LockScreenBackgroundOptions {
  /** 当前偏好设置，可选，未传时仅使用覆盖图和默认图 */
  preferences?: Preferences | null;
  /**
   * 组件层传入的覆盖背景：
   * - undefined: 使用 preferences 或默认背景
   * - '': 显式禁用背景
   * - 其他: 使用该 URL
   */
  overrideImage?: string;
}

/**
 * 计算锁屏背景图片
 *
 * 优先级：
 * 1. 组件传入的 overrideImage：
 *    - 空字符串：禁用背景
 *    - 非空字符串：直接使用
 * 2. 偏好设置中的 lockScreen.backgroundImage：
 *    - 空字符串：使用内置默认图
 *    - 非空字符串：使用该 URL
 * 3. 兜底：使用内置默认图
 */
export function computeLockScreenBackground(
  options: LockScreenBackgroundOptions
): string | undefined {
  const { preferences, overrideImage } = options;

  // 组件显式禁用背景
  if (overrideImage === '') {
    return undefined;
  }

  // 组件传入了自定义背景，优先使用
  if (overrideImage) {
    return overrideImage;
  }

  const prefBackground = preferences?.lockScreen?.backgroundImage;
  if (prefBackground === '') {
    // 明确表示使用默认背景
    return defaultLockScreenBg;
  }
  if (prefBackground) {
    return prefBackground;
  }

  // 兜底：使用默认背景
  return defaultLockScreenBg;
}

// ============================================================
// Body 滚动锁定
// ============================================================

export interface LockScreenBodyLockState {
  applied: boolean;
  previousOverflow: string;
  previousPaddingRight: string;
}

/**
 * 锁定 body 滚动，并根据滚动条宽度补偿 paddingRight，避免布局抖动
 * 在 SSR 环境下安全降级为 no-op。
 */
export function lockBodyScrollForLockScreen(): LockScreenBodyLockState | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const { body, documentElement } = document;
  if (!body || !documentElement) {
    return null;
  }

  const state: LockScreenBodyLockState = {
    applied: false,
    previousOverflow: body.style.overflow || '',
    previousPaddingRight: body.style.paddingRight || '',
  };

  const scrollBarWidth = window.innerWidth - documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (scrollBarWidth > 0) {
    body.style.paddingRight = `${scrollBarWidth}px`;
  }

  state.applied = true;
  return state;
}

/**
 * 恢复 body 滚动状态
 */
export function restoreBodyScrollForLockScreen(
  state: LockScreenBodyLockState | null
): void {
  if (!state || !state.applied) return;
  if (typeof document === 'undefined') return;

  const { body } = document;
  if (!body) return;

  body.style.overflow = state.previousOverflow;
  body.style.paddingRight = state.previousPaddingRight;
}

// ============================================================
// 解锁逻辑（密码校验 + 偏好更新 + flush）
// ============================================================

export interface UnlockWithPasswordOptions {
  /** 用户输入的密码 */
  password: string;
  /** 已保存的密码哈希 */
  savedPassword: string;
  /** 本地化文案 */
  locale: LocaleMessages;
  /**
   * 更新偏好设置的回调
   * 只需支持部分更新：{ lockScreen: { isLocked: boolean } }
   */
  setPreferences: (partial: { lockScreen: { isLocked: boolean } }) => void;
  /**
   * 刷新偏好设置持久化的回调（例如 getPreferencesManager().flush）
   * 可选，未传时仅更新内存状态
   */
  flushPreferences?: () => void;
}

export interface UnlockWithPasswordResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * 统一的锁屏解锁流程：
 * - 校验空密码并返回对应文案
 * - 使用哈希验证密码
 * - 更新偏好设置 isLocked 状态
 * - 尝试 flush 持久化，错误仅记录日志，不抛出到 UI
 */
export function unlockWithPassword(
  options: UnlockWithPasswordOptions
): UnlockWithPasswordResult {
  const { password, savedPassword, locale, setPreferences, flushPreferences } = options;

  if (!password) {
    return {
      success: false,
      errorMessage: locale.lockScreen?.passwordPlaceholder ?? '',
    };
  }

  const isValid = verifyPasswordSync(password, savedPassword);
  if (!isValid) {
    return {
      success: false,
      errorMessage: locale.lockScreen?.passwordError ?? '',
    };
  }

  // 更新锁屏状态
  try {
    setPreferences({ lockScreen: { isLocked: false } });
  } catch (err) {
    logger.error('[LockScreenBehavior] Failed to update preferences:', err);
    return {
      success: false,
      errorMessage: locale.lockScreen?.passwordError ?? '',
    };
  }

  // 持久化 flush（如果提供）
  if (flushPreferences) {
    try {
      flushPreferences();
    } catch (err) {
      logger.error('[LockScreenBehavior] Failed to flush preferences:', err);
      // flush 失败不影响解锁本身
    }
  }

  return { success: true };
}

// ============================================================
// 键盘交互协议
// ============================================================

export type LockScreenKeyAction =
  | { type: 'none' }
  | { type: 'hideUnlockForm' }
  | { type: 'submit' }
  | { type: 'showUnlockForm' };

export interface LockScreenKeyOptions {
  /** 当前解锁面板是否可见 */
  showUnlockForm: boolean;
}

export interface KeyboardEventLike {
  code?: string;
  /** React SyntheticEvent 兼容 */
  key?: string;
  preventDefault?: () => void;
}

/**
 * 将键盘事件解析为统一的锁屏行为动作：
 * - Escape：在解锁面板打开时关闭面板
 * - Enter / NumpadEnter：
 *   - 面板打开时：提交解锁
 *   - 面板关闭时：打开解锁面板
 * - Space：在面板关闭时打开解锁面板
 */
export function getLockScreenKeyAction(
  event: KeyboardEventLike,
  options: LockScreenKeyOptions
): LockScreenKeyAction {
  const { showUnlockForm } = options;
  const code = event.code || event.key;

  if (!code) {
    return { type: 'none' };
  }

  if (code === 'Escape' && showUnlockForm) {
    event.preventDefault?.();
    return { type: 'hideUnlockForm' };
  }

  if (showUnlockForm) {
    if (code === 'Enter' || code === 'NumpadEnter') {
      event.preventDefault?.();
      return { type: 'submit' };
    }
    return { type: 'none' };
  }

  if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') {
    event.preventDefault?.();
    return { type: 'showUnlockForm' };
  }

  return { type: 'none' };
}

