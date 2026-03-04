/**
 * 全屏运行时状态公共工具
 * @description 提供 React/Vue 共用的全屏状态同步与切换逻辑
 */

import { readFullscreenState, toggleFullscreenState, type FullscreenDocumentLike } from './layout-runtime-state';

/**
 * 可监听全屏事件的目标对象接口。
 */
interface FullscreenEventTargetLike {
  /**
   * 添加事件监听。
   * @param type 事件类型。
   * @param listener 监听器。
   * @param options 监听选项。
   */
  addEventListener: (
    /** 事件类型。 */
    type: string,
    /** 事件监听器。 */
    listener: EventListenerOrEventListenerObject,
    /** 监听选项。 */
    options?: boolean | AddEventListenerOptions
  ) => void;
  /**
   * 移除事件监听。
   * @param type 事件类型。
   * @param listener 监听器。
   * @param options 监听选项。
   */
  removeEventListener: (
    /** 事件类型。 */
    type: string,
    /** 事件监听器。 */
    listener: EventListenerOrEventListenerObject,
    /** 监听选项。 */
    options?: boolean | EventListenerOptions
  ) => void;
}

/**
 * 带事件能力的全屏文档接口。
 */
export interface FullscreenDocumentWithEvents
  extends FullscreenDocumentLike,
    FullscreenEventTargetLike {}

/**
 * 全屏运行时控制器创建选项。
 */
export interface CreateLayoutFullscreenRuntimeOptions {
  /** 目标文档对象。 */
  targetDocument?: FullscreenDocumentWithEvents | null;
  /** 设置全屏状态。 */
  setIsFullscreen: (value: boolean) => void;
  /** 手动切换全屏后的状态回调。 */
  onFullscreenToggle?: (value: boolean) => void;
  /** 全屏切换失败时的错误回调。 */
  onError?: (error: unknown) => void;
}

/**
 * 全屏运行时控制器。
 */
export interface LayoutFullscreenRuntimeController {
  /** 启动监听。 */
  start: () => void;
  /** 同步当前全屏状态。 */
  sync: () => boolean;
  /** 切换全屏。 */
  toggle: () => Promise<boolean>;
  /** 销毁监听。 */
  destroy: () => void;
}

/**
 * 全屏状态控制器创建选项。
 */
export interface CreateLayoutFullscreenStateControllerOptions {
  /** 目标文档对象。 */
  targetDocument?: FullscreenDocumentWithEvents | null;
  /** 读取当前全屏状态。 */
  getIsFullscreen: () => boolean;
  /** 写入当前全屏状态。 */
  setIsFullscreen: (value: boolean) => void;
  /** 同步布局层全屏状态。 */
  setLayoutFullscreen?: (value: boolean) => void;
  /** 手动切换全屏后的状态回调。 */
  onFullscreenToggle?: (value: boolean) => void;
  /** 全屏切换失败时的错误回调。 */
  onError?: (error: unknown) => void;
}

/**
 * 全屏状态控制器。
 */
export interface LayoutFullscreenStateController extends LayoutFullscreenRuntimeController {}

/**
 * 解析目标文档对象。
 * @param targetDocument 显式传入文档。
 * @returns 可用文档对象，无法获取时返回 `null`。
 */
function resolveDocument(
  targetDocument?: FullscreenDocumentWithEvents | null
): FullscreenDocumentWithEvents | null {
  if (targetDocument) return targetDocument;
  if (typeof document !== 'undefined') return document as unknown as FullscreenDocumentWithEvents;
  return null;
}

/**
 * 创建全屏运行时控制器。
 * @param options 全屏运行时控制器创建参数。
 * @returns 全屏运行时控制器实例。
 */
export function createLayoutFullscreenRuntime(
  options: CreateLayoutFullscreenRuntimeOptions
): LayoutFullscreenRuntimeController {
  const targetDocument = resolveDocument(options.targetDocument);
  let started = false;

  /**
   * 从文档读取并同步全屏状态。
   * @returns 同步后的全屏状态。
   */
  const sync = () => {
    if (!targetDocument) return false;
    const nextValue = readFullscreenState(targetDocument);
    options.setIsFullscreen(nextValue);
    return nextValue;
  };

  /**
   * 监听浏览器全屏状态变化并同步到运行时状态。
   * @returns 无返回值。
   */
  const handleFullscreenChange: EventListener = () => {
    sync();
  };

  /**
   * 启动全屏变更监听。
   * @returns 无返回值。
   */
  const start = () => {
    if (!targetDocument || started) return;
    targetDocument.addEventListener('fullscreenchange', handleFullscreenChange);
    started = true;
    sync();
  };

  /**
   * 切换全屏状态并触发回调。
   * @returns 切换后的全屏状态。
   */
  const toggle = async () => {
    if (!targetDocument) return false;
    try {
      const nextValue = await toggleFullscreenState(targetDocument);
      options.setIsFullscreen(nextValue);
      options.onFullscreenToggle?.(nextValue);
      return nextValue;
    } catch (error) {
      options.onError?.(error);
      return sync();
    }
  };

  /**
   * 销毁全屏监听。
   * @returns 无返回值。
   */
  const destroy = () => {
    if (!targetDocument || !started) return;
    targetDocument.removeEventListener('fullscreenchange', handleFullscreenChange);
    started = false;
  };

  return {
    start,
    sync,
    toggle,
    destroy,
  };
}

/**
 * 创建全屏状态控制器（同步本地状态与布局状态）。
 * @param options 全屏状态控制器创建参数。
 * @returns 全屏状态控制器实例。
 */
export function createLayoutFullscreenStateController(
  options: CreateLayoutFullscreenStateControllerOptions
): LayoutFullscreenStateController {
  /**
   * 同步本地全屏状态与布局层全屏状态。
   * @param value 目标全屏状态。
   * @returns 无返回值。
   */
  const syncFullscreenState = (value: boolean) => {
    if (options.getIsFullscreen() !== value) {
      options.setIsFullscreen(value);
    }
    options.setLayoutFullscreen?.(value);
  };

  const runtime = createLayoutFullscreenRuntime({
    targetDocument: options.targetDocument,
    setIsFullscreen: syncFullscreenState,
    onFullscreenToggle: options.onFullscreenToggle,
    onError: options.onError,
  });

  return runtime;
}
