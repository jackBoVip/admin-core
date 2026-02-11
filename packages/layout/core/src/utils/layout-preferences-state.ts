/**
 * 偏好设置状态公共工具
 * @description 提供 React/Vue 共用的偏好同步与 CSS 变量派生逻辑
 */

import {
  generateAllCSSVariables,
  getResolvedLayoutProps,
  mapPreferencesToLayoutProps,
} from './layout';
import type { BasicLayoutProps, LayoutState } from '../types';
import type { Preferences } from '@admin-core/preferences';

export interface LayoutPreferencesManagerLike<TPreferences = Preferences> {
  getPreferences: () => TPreferences;
  subscribe: (
    listener: (preferences: TPreferences, ...rest: unknown[]) => void
  ) => () => void;
}

/**
 * 将偏好设置映射为布局 props（浅拷贝，确保引用变化）
 */
export function mapLayoutPreferencesToProps(
  preferences: Preferences
): Partial<BasicLayoutProps> {
  return { ...mapPreferencesToLayoutProps(preferences) };
}

/**
 * 计算布局全量 CSS 变量
 */
export function resolveAllLayoutCSSVariables(
  props: BasicLayoutProps,
  state: LayoutState
): Record<string, string> {
  return generateAllCSSVariables(getResolvedLayoutProps(props), state);
}

export interface StartLayoutPreferencesSyncOptions<TPreferences = Preferences> {
  manager: LayoutPreferencesManagerLike<TPreferences>;
  onChange: (next: Partial<BasicLayoutProps>) => void;
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

/**
 * 启动偏好同步（立即推送一次，并订阅后续变更）
 */
export function startLayoutPreferencesSync<TPreferences = Preferences>(
  options: StartLayoutPreferencesSyncOptions<TPreferences>
): () => void {
  const map = options.map ?? ((preferences: TPreferences) =>
    mapLayoutPreferencesToProps(preferences as unknown as Preferences));

  const emit = (preferences: TPreferences) => {
    options.onChange({ ...map(preferences) });
  };

  emit(options.manager.getPreferences());

  const unsubscribe = options.manager.subscribe((preferences: TPreferences) => {
    emit(preferences);
  });

  return () => {
    unsubscribe?.();
  };
}

export interface SafeStartLayoutPreferencesSyncOptions<TPreferences = Preferences> {
  createManager: () => LayoutPreferencesManagerLike<TPreferences>;
  onChange: (next: Partial<BasicLayoutProps>) => void;
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

/**
 * 安全启动偏好同步（异常时返回 null）
 */
export function safeStartLayoutPreferencesSync<TPreferences = Preferences>(
  options: SafeStartLayoutPreferencesSyncOptions<TPreferences>
): (() => void) | null {
  try {
    const manager = options.createManager();
    return startLayoutPreferencesSync({
      manager,
      onChange: options.onChange,
      map: options.map,
    });
  } catch {
    return null;
  }
}

export interface LayoutPreferencesSyncRuntimeOptions<TPreferences = Preferences> {
  createManager: () => LayoutPreferencesManagerLike<TPreferences>;
  onChange: (next: Partial<BasicLayoutProps>) => void;
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

export interface LayoutPreferencesSyncRuntimeController {
  start: () => void;
  destroy: () => void;
  restart: () => void;
}

/**
 * 创建偏好设置同步运行时控制器
 */
export function createLayoutPreferencesSyncRuntime<TPreferences = Preferences>(
  options: LayoutPreferencesSyncRuntimeOptions<TPreferences>
): LayoutPreferencesSyncRuntimeController {
  let stop: (() => void) | null = null;

  const start = () => {
    if (stop) return;
    stop = safeStartLayoutPreferencesSync({
      createManager: options.createManager,
      onChange: options.onChange,
      map: options.map,
    });
  };

  const destroy = () => {
    stop?.();
    stop = null;
  };

  const restart = () => {
    destroy();
    start();
  };

  return {
    start,
    destroy,
    restart,
  };
}
