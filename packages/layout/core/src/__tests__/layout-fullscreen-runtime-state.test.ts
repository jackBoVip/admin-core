import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutFullscreenRuntime,
  createLayoutFullscreenStateController,
} from '../utils';

/**
 * 模拟全屏文档测试参数。
 */
interface FakeFullscreenDocumentOptions {
  /** 是否模拟 `requestFullscreen` 失败。 */
  failRequest?: boolean;
}

/**
 * 全屏 API 测试替身。
 * @description 提供 `documentElement.requestFullscreen` 与 `fullscreenchange` 监听能力。
 */
class FakeFullscreenDocument {
  fullscreenElement: Element | null = null;
  private readonly listeners = new Set<EventListenerOrEventListenerObject>();
  private readonly failRequest: boolean;

  /**
   * 创建测试文档实例。
   * @param options 测试参数。
   */
  constructor(options?: FakeFullscreenDocumentOptions) {
    this.failRequest = options?.failRequest === true;
  }

  /**
   * 模拟 `document.documentElement`，提供全屏请求能力。
   */
  readonly documentElement = {
    /**
     * 模拟浏览器进入全屏流程并触发 `fullscreenchange`。
     *
     * @returns 无返回值。
     */
    requestFullscreen: async () => {
      if (this.failRequest) {
        throw new Error('request failed');
      }
      this.fullscreenElement = {} as Element;
      this.emitChange();
    },
  };

  /**
   * 模拟浏览器退出全屏流程并触发 `fullscreenchange`。
   *
   * @returns 无返回值。
   */
  exitFullscreen = async () => {
    this.fullscreenElement = null;
    this.emitChange();
  };

  /**
   * 注册全屏状态变更监听器。
   *
   * @param type 事件类型。
   * @param listener 事件监听器。
   */
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'fullscreenchange') {
      this.listeners.add(listener);
    }
  }

  /**
   * 注销全屏状态变更监听器。
   *
   * @param type 事件类型。
   * @param listener 待移除的事件监听器。
   */
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'fullscreenchange') {
      this.listeners.delete(listener);
    }
  }

  /**
   * 广播一次 `fullscreenchange` 事件。
   */
  private emitChange() {
    for (const listener of this.listeners) {
      if (typeof listener === 'function') {
        listener(new Event('fullscreenchange'));
      } else {
        listener.handleEvent(new Event('fullscreenchange'));
      }
    }
  }

  /**
   * 当前注册的全屏事件监听器数量。
   */
  get listenerCount() {
    return this.listeners.size;
  }
}

describe('layout-fullscreen-runtime-state helpers', () => {
  it('should sync fullscreen state on start and events', async () => {
    const targetDocument = new FakeFullscreenDocument();
    let isFullscreen = false;

    const runtime = createLayoutFullscreenRuntime({
      targetDocument,
      setIsFullscreen: (value) => {
        isFullscreen = value;
      },
    });

    runtime.start();
    expect(targetDocument.listenerCount).toBe(1);
    expect(isFullscreen).toBe(false);

    await targetDocument.documentElement.requestFullscreen();
    expect(isFullscreen).toBe(true);

    runtime.destroy();
    expect(targetDocument.listenerCount).toBe(0);
  });

  it('should toggle and call onFullscreenToggle callback', async () => {
    const targetDocument = new FakeFullscreenDocument();
    let isFullscreen = false;
    const onToggle = vi.fn();

    const runtime = createLayoutFullscreenRuntime({
      targetDocument,
      setIsFullscreen: (value) => {
        isFullscreen = value;
      },
      onFullscreenToggle: onToggle,
    });

    runtime.start();
    await expect(runtime.toggle()).resolves.toBe(true);
    expect(isFullscreen).toBe(true);
    expect(onToggle).toHaveBeenCalledWith(true);

    await expect(runtime.toggle()).resolves.toBe(false);
    expect(isFullscreen).toBe(false);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('should handle toggle errors via onError', async () => {
    const targetDocument = new FakeFullscreenDocument({ failRequest: true });
    let isFullscreen = false;
    const onError = vi.fn();

    const runtime = createLayoutFullscreenRuntime({
      targetDocument,
      setIsFullscreen: (value) => {
        isFullscreen = value;
      },
      onError,
    });

    runtime.start();
    await expect(runtime.toggle()).resolves.toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(isFullscreen).toBe(false);
  });

  it('should sync local and layout fullscreen state via state controller', async () => {
    const targetDocument = new FakeFullscreenDocument();
    const state = {
      localFullscreen: false,
      layoutFullscreen: false,
    };

    const controller = createLayoutFullscreenStateController({
      targetDocument,
      getIsFullscreen: () => state.localFullscreen,
      setIsFullscreen: (value) => {
        state.localFullscreen = value;
      },
      setLayoutFullscreen: (value) => {
        state.layoutFullscreen = value;
      },
    });

    controller.start();
    expect(state.localFullscreen).toBe(false);
    expect(state.layoutFullscreen).toBe(false);

    await expect(controller.toggle()).resolves.toBe(true);
    expect(state.localFullscreen).toBe(true);
    expect(state.layoutFullscreen).toBe(true);
  });
});
