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

/**
 * 偏好管理器最小接口。
 */
export interface LayoutPreferencesManagerLike<TPreferences = Preferences> {
  /** 获取当前偏好。 */
  getPreferences: () => TPreferences;
  /**
   * 订阅偏好变化。
   * @param listener 偏好变更监听器。
   */
  subscribe: (
    listener: (preferences: TPreferences, ...rest: unknown[]) => void
  ) => () => void;
}

/**
 * 将偏好设置映射为布局属性补丁（浅拷贝，确保引用变化）。
 * @param preferences 偏好设置对象。
 * @returns 基于偏好生成的布局属性补丁。
 */
export function mapLayoutPreferencesToProps(
  preferences: Preferences
): Partial<BasicLayoutProps> {
  return { ...mapPreferencesToLayoutProps(preferences) };
}

/**
 * 计算布局全量 CSS 变量。
 * @param props 布局属性。
 * @param state 布局运行时状态。
 * @returns 布局与主题合并后的 CSS 变量映射。
 */
export function resolveAllLayoutCSSVariables(
  props: BasicLayoutProps,
  state: LayoutState
): Record<string, string> {
  return generateAllCSSVariables(getResolvedLayoutProps(props), state);
}

/**
 * 启动偏好同步选项。
 */
export interface StartLayoutPreferencesSyncOptions<TPreferences = Preferences> {
  /** 偏好管理器。 */
  manager: LayoutPreferencesManagerLike<TPreferences>;
  /**
   * 偏好映射结果回调。
   * @param next 映射后的布局 props 补丁。
   */
  onChange: (next: Partial<BasicLayoutProps>) => void;
  /** 偏好到布局 props 的映射函数。 */
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

/**
 * 启动偏好同步（立即推送一次，并订阅后续变更）。
 * @param options 偏好同步启动参数。
 * @returns 用于取消订阅的清理函数。
 */
export function startLayoutPreferencesSync<TPreferences = Preferences>(
  options: StartLayoutPreferencesSyncOptions<TPreferences>
): () => void {
  /**
   * 解析最终偏好映射函数。
   * @param preferences 偏好设置对象。
   * @returns 布局 props 补丁。
   */
  const map = options.map ?? ((preferences: TPreferences) =>
    mapLayoutPreferencesToProps(preferences as unknown as Preferences));

  /**
   * 推送一次偏好映射结果。
   * @param preferences 偏好设置对象。
   * @returns 无返回值。
   */
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

/**
 * 安全启动偏好同步选项。
 */
export interface SafeStartLayoutPreferencesSyncOptions<TPreferences = Preferences> {
  /** 偏好管理器工厂。 */
  createManager: () => LayoutPreferencesManagerLike<TPreferences>;
  /**
   * 偏好映射结果回调。
   * @param next 映射后的布局 props 补丁。
   */
  onChange: (next: Partial<BasicLayoutProps>) => void;
  /** 偏好到布局 props 的映射函数。 */
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

/**
 * 安全启动偏好同步（异常时返回 `null`）。
 * @param options 安全启动参数。
 * @returns 成功时返回取消订阅函数，失败时返回 `null`。
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

/**
 * 偏好同步运行时选项。
 */
export interface LayoutPreferencesSyncRuntimeOptions<TPreferences = Preferences> {
  /** 偏好管理器工厂。 */
  createManager: () => LayoutPreferencesManagerLike<TPreferences>;
  /**
   * 偏好映射结果回调。
   * @param next 映射后的布局 props 补丁。
   */
  onChange: (next: Partial<BasicLayoutProps>) => void;
  /** 偏好到布局 props 的映射函数。 */
  map?: (preferences: TPreferences) => Partial<BasicLayoutProps>;
}

/**
 * 偏好同步运行时控制器。
 */
export interface LayoutPreferencesSyncRuntimeController {
  /** 启动偏好同步。 */
  start: () => void;
  /** 停止并销毁偏好同步。 */
  destroy: () => void;
  /** 重启偏好同步。 */
  restart: () => void;
}

/**
 * 创建偏好设置同步运行时控制器。
 * @param options 运行时控制器创建参数。
 * @returns 偏好同步运行时控制器实例。
 */
export function createLayoutPreferencesSyncRuntime<TPreferences = Preferences>(
  options: LayoutPreferencesSyncRuntimeOptions<TPreferences>
): LayoutPreferencesSyncRuntimeController {
  let stop: (() => void) | null = null;

  /**
   * 启动偏好同步订阅。
   * @returns 无返回值。
   */
  const start = () => {
    if (stop) return;
    stop = safeStartLayoutPreferencesSync({
      createManager: options.createManager,
      onChange: options.onChange,
      map: options.map,
    });
  };

  /**
   * 停止偏好同步订阅。
   * @returns 无返回值。
   */
  const destroy = () => {
    stop?.();
    stop = null;
  };

  /**
   * 重启偏好同步订阅。
   * @returns 无返回值。
   */
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
