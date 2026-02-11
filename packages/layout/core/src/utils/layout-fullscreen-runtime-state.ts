/**
 * 全屏运行时状态公共工具
 * @description 提供 React/Vue 共用的全屏状态同步与切换逻辑
 */

import { readFullscreenState, toggleFullscreenState, type FullscreenDocumentLike } from './layout-runtime-state';

interface FullscreenEventTargetLike {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

export interface FullscreenDocumentWithEvents
  extends FullscreenDocumentLike,
    FullscreenEventTargetLike {}

export interface CreateLayoutFullscreenRuntimeOptions {
  targetDocument?: FullscreenDocumentWithEvents | null;
  setIsFullscreen: (value: boolean) => void;
  onFullscreenToggle?: (value: boolean) => void;
  onError?: (error: unknown) => void;
}

export interface LayoutFullscreenRuntimeController {
  start: () => void;
  sync: () => boolean;
  toggle: () => Promise<boolean>;
  destroy: () => void;
}

export interface CreateLayoutFullscreenStateControllerOptions {
  targetDocument?: FullscreenDocumentWithEvents | null;
  getIsFullscreen: () => boolean;
  setIsFullscreen: (value: boolean) => void;
  setLayoutFullscreen?: (value: boolean) => void;
  onFullscreenToggle?: (value: boolean) => void;
  onError?: (error: unknown) => void;
}

export interface LayoutFullscreenStateController extends LayoutFullscreenRuntimeController {}

function resolveDocument(
  targetDocument?: FullscreenDocumentWithEvents | null
): FullscreenDocumentWithEvents | null {
  if (targetDocument) return targetDocument;
  if (typeof document !== 'undefined') return document as unknown as FullscreenDocumentWithEvents;
  return null;
}

/**
 * 创建全屏运行时控制器
 */
export function createLayoutFullscreenRuntime(
  options: CreateLayoutFullscreenRuntimeOptions
): LayoutFullscreenRuntimeController {
  const targetDocument = resolveDocument(options.targetDocument);
  let started = false;

  const sync = () => {
    if (!targetDocument) return false;
    const nextValue = readFullscreenState(targetDocument);
    options.setIsFullscreen(nextValue);
    return nextValue;
  };

  const handleFullscreenChange: EventListener = () => {
    sync();
  };

  const start = () => {
    if (!targetDocument || started) return;
    targetDocument.addEventListener('fullscreenchange', handleFullscreenChange);
    started = true;
    sync();
  };

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
 * 创建全屏状态控制器（同步本地状态与布局状态）
 */
export function createLayoutFullscreenStateController(
  options: CreateLayoutFullscreenStateControllerOptions
): LayoutFullscreenStateController {
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
