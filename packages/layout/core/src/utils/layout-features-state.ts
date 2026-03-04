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

/**
 * 解析主题实际模式（处理 auto 模式）。
 * @param mode 主题模式配置。
 * @param systemDark 系统是否深色。
 * @returns 实际渲染模式。
 */
export function resolveThemeActualMode(
  mode: ThemeConfig['mode'],
  systemDark: boolean
): 'light' | 'dark' {
  if (mode === 'auto') {
    return systemDark ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

/**
 * 生成主题快照。
 * @param config 主题配置。
 * @param systemDark 系统是否深色。
 * @returns 主题运行时快照。
 */
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

/**
 * 解析主题切换目标模式。
 * @param mode 当前模式。
 * @returns 切换后的目标模式。
 */
export function resolveThemeToggleTargetMode(mode: ThemeConfig['mode']): 'light' | 'dark' {
  return mode === 'dark' ? 'light' : 'dark';
}

/**
 * 生成水印快照。
 * @param config 水印配置。
 * @returns 水印运行时快照。
 */
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

/**
 * 生成锁屏快照。
 * @param config 锁屏配置。
 * @returns 锁屏运行时快照。
 */
export function resolveLockScreenSnapshot(config: LockScreenConfig = {}) {
  return {
    isLocked: shouldShowLockScreen(config),
    backgroundImage: config.backgroundImage || '',
    showUserInfo: config.showUserInfo !== false,
    showClock: config.showClock !== false,
    showDate: config.showDate !== false,
  };
}

/**
 * 判断是否启用检查更新。
 * @param config 检查更新配置。
 * @returns 是否启用检查更新。
 */
export function resolveCheckUpdatesEnabled(config: CheckUpdatesConfig = {}) {
  return config.enable === true;
}

/**
 * 判断是否启用快捷键。
 * @param config 快捷键配置。
 * @returns 是否启用快捷键。
 */
export function resolveShortcutEnabled(config?: Partial<ShortcutKeyPreferences>) {
  return config?.enable !== false;
}

/** 快捷键处理结果。 */
export interface ShortcutKeydownResult {
  /** 是否已完成处理。 */
  handled: boolean;
  /** 命中的快捷键动作；未命中时为 `null`。 */
  action: ShortcutAction | null;
}

/**
 * 处理快捷键 keydown 事件。
 * @param event 键盘事件。
 * @param config 快捷键配置。
 * @param handlers 动作处理器集合。
 * @returns 是否处理与命中的动作。
 */
export function handleShortcutKeydown(
  event: KeyboardEvent,
  config: Partial<ShortcutKeyPreferences> | undefined,
  handlers: ShortcutActionHandlers
): ShortcutKeydownResult {
  if (shouldIgnoreShortcutEvent(event)) return { handled: false, action: null };

  const action = resolveShortcutAction(event, config);
  if (!action) return { handled: false, action: null };

  event.preventDefault();
  return {
    handled: dispatchShortcutAction(action, handlers),
    action,
  };
}

/**
 * 生成页面切换快照。
 * @param config 页面切换配置。
 * @returns 页面切换运行时快照。
 */
export function resolvePageTransitionSnapshot(config: Partial<TransitionPreferences> = {}) {
  return {
    enabled: config.enable !== false,
    transitionName: resolvePageTransitionName(config.name),
    showProgress: config.progress !== false,
    showLoading: config.loading !== false,
  };
}

/** 动态标题快照解析参数。 */
export interface ResolveDynamicTitleSnapshotOptions {
  /** 是否启用动态标题。 */
  enabled: boolean;
  /** 应用名称。 */
  appName?: string;
  /** 菜单索引。 */
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  /** 当前路径。 */
  currentPath?: string;
}

/** 动态标题快照。 */
export interface DynamicTitleSnapshot {
  /** 应用名称。 */
  appName: string;
  /** 页面标题。 */
  pageTitle: string;
  /** 最终文档标题。 */
  title: string;
}

/**
 * 解析动态标题快照。
 * @param options 解析参数。
 * @returns 动态标题快照。
 */
export function resolveDynamicTitleSnapshot(
  options: ResolveDynamicTitleSnapshotOptions
): DynamicTitleSnapshot {
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

/** 动态标题控制器创建参数。 */
export interface LayoutDynamicTitleControllerOptions {
  /** 是否启用动态标题。 */
  getEnabled: () => boolean;
  /** 获取应用名称。 */
  getAppName: () => string;
  /** 设置 document.title。 */
  setDocumentTitle: (title: string) => void;
}

/** 动态标题控制器。 */
export interface LayoutDynamicTitleController {
  /** 根据页面标题更新文档标题。 */
  updateTitle: (pageTitle?: string) => void;
  /** 直接应用文档标题。 */
  applyTitle: (title?: string) => void;
}

/**
 * 创建动态标题控制器。
 * @param options 动态标题控制器参数。
 * @returns 动态标题控制器。
 */
export function createLayoutDynamicTitleController(
  options: LayoutDynamicTitleControllerOptions
): LayoutDynamicTitleController {
  /**
   * 直接应用文档标题（会校验功能开关和标题内容）。
   * @param title 待应用标题。
   */
  const applyTitle = (title?: string) => {
    if (!options.getEnabled() || !title) return;
    options.setDocumentTitle(title);
  };

  /**
   * 基于页面标题与应用名拼接后更新文档标题。
   * @param pageTitle 页面标题。
   */
  const updateTitle = (pageTitle?: string) => {
    const title = formatDocumentTitle(pageTitle, options.getAppName());
    applyTitle(title);
  };

  return {
    updateTitle,
    applyTitle,
  };
}
