/**
 * 布局功能域公共纯函数
 * @description 提供 React/Vue 共用的 theme/watermark/lock/transition/title/shortcut 逻辑
 */

import {
  generateThemeCSSVariables,
  generateThemeClasses,
  generateWatermarkContent,
  generateWatermarkStyle,
  shouldShowLockScreen,
} from './layout';
import { resolvePageTransitionName } from './layout-state';
import {
  dispatchShortcutAction,
  resolveShortcutAction,
  shouldIgnoreShortcutEvent,
  type ShortcutAction,
  type ShortcutActionHandlers,
} from './shortcut-keys';
import { formatDocumentTitle, resolveMenuTitleByPath } from './title';
import type {
  CheckUpdatesConfig,
  LockScreenConfig,
  ThemeConfig,
  WatermarkConfig,
} from '../types';
import type { buildMenuPathIndex } from './menu';
import type { TransitionPreferences, ShortcutKeyPreferences } from '@admin-core/preferences';

export function resolveThemeActualMode(
  mode: ThemeConfig['mode'],
  systemDark: boolean
): 'light' | 'dark' {
  if (mode === 'auto') {
    return systemDark ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

export function resolveThemeSnapshot(
  config: ThemeConfig = {},
  systemDark = false
) {
  const mode = config.mode || 'light';
  const isDark = mode === 'dark';
  const isAuto = mode === 'auto';
  const actualMode = resolveThemeActualMode(mode, systemDark);

  return {
    mode,
    isDark,
    isAuto,
    actualMode,
    cssVariables: generateThemeCSSVariables({ ...config, mode: actualMode }),
    cssClasses: generateThemeClasses({ ...config, mode: actualMode }),
    isGrayMode: config.colorGrayMode === true,
    isWeakMode: config.colorWeakMode === true,
  };
}

export function resolveThemeToggleTargetMode(mode: ThemeConfig['mode']): 'light' | 'dark' {
  return mode === 'dark' ? 'light' : 'dark';
}

export function resolveWatermarkSnapshot(config: WatermarkConfig = {}) {
  const enabled = config.enable === true;
  const content = generateWatermarkContent(config);

  return {
    enabled,
    content,
    style: generateWatermarkStyle(config),
    canvasConfig: {
      content,
      fontSize: config.fontSize || 16,
      fontColor: config.fontColor || 'rgba(0, 0, 0, 0.15)',
      angle: config.angle || -22,
      gap: config.gap || ([100, 100] as [number, number]),
      offset: config.offset || ([50, 50] as [number, number]),
    },
  };
}

export function resolveLockScreenSnapshot(config: LockScreenConfig = {}) {
  return {
    isLocked: shouldShowLockScreen(config),
    backgroundImage: config.backgroundImage || '',
    showUserInfo: config.showUserInfo !== false,
    showClock: config.showClock !== false,
    showDate: config.showDate !== false,
  };
}

export function resolveCheckUpdatesEnabled(config: CheckUpdatesConfig = {}) {
  return config.enable === true;
}

export function resolveShortcutEnabled(config?: Partial<ShortcutKeyPreferences>) {
  return config?.enable !== false;
}

export function handleShortcutKeydown(
  event: KeyboardEvent,
  config: Partial<ShortcutKeyPreferences> | undefined,
  handlers: ShortcutActionHandlers
): { handled: boolean; action: ShortcutAction | null } {
  if (shouldIgnoreShortcutEvent(event)) return { handled: false, action: null };

  const action = resolveShortcutAction(event, config);
  if (!action) return { handled: false, action: null };

  event.preventDefault();
  return {
    handled: dispatchShortcutAction(action, handlers),
    action,
  };
}

export function resolvePageTransitionSnapshot(config: Partial<TransitionPreferences> = {}) {
  return {
    enabled: config.enable !== false,
    transitionName: resolvePageTransitionName(config.name),
    showProgress: config.progress !== false,
    showLoading: config.loading !== false,
  };
}

export function resolveDynamicTitleSnapshot(options: {
  enabled: boolean;
  appName?: string;
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  currentPath?: string;
}) {
  if (!options.enabled || !options.currentPath) {
    return {
      appName: options.appName || '',
      pageTitle: '',
      title: '',
    };
  }
  const pageTitle = resolveMenuTitleByPath(options.menuIndex, options.currentPath);
  if (!pageTitle) {
    return {
      appName: options.appName || '',
      pageTitle: '',
      title: '',
    };
  }
  return {
    appName: options.appName || '',
    pageTitle,
    title: formatDocumentTitle(pageTitle, options.appName || ''),
  };
}

export interface LayoutDynamicTitleControllerOptions {
  getEnabled: () => boolean;
  getAppName: () => string;
  setDocumentTitle: (title: string) => void;
}

export interface LayoutDynamicTitleController {
  updateTitle: (pageTitle?: string) => void;
  applyTitle: (title?: string) => void;
}

/**
 * 创建动态标题控制器
 */
export function createLayoutDynamicTitleController(
  options: LayoutDynamicTitleControllerOptions
): LayoutDynamicTitleController {
  const applyTitle = (title?: string) => {
    if (!options.getEnabled() || !title) return;
    options.setDocumentTitle(title);
  };

  const updateTitle = (pageTitle?: string) => {
    const title = formatDocumentTitle(pageTitle, options.getAppName());
    applyTitle(title);
  };

  return {
    updateTitle,
    applyTitle,
  };
}
