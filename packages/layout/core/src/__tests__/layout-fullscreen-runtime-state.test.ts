import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutFullscreenRuntime,
  createLayoutFullscreenStateController,
} from '../utils';

class FakeFullscreenDocument {
  fullscreenElement: Element | null = null;
  private readonly listeners = new Set<EventListenerOrEventListenerObject>();
  private readonly failRequest: boolean;

  constructor(options?: { failRequest?: boolean }) {
    this.failRequest = options?.failRequest === true;
  }

  readonly documentElement = {
    requestFullscreen: async () => {
      if (this.failRequest) {
        throw new Error('request failed');
      }
      this.fullscreenElement = {} as Element;
      this.emitChange();
    },
  };

  exitFullscreen = async () => {
    this.fullscreenElement = null;
    this.emitChange();
  };

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'fullscreenchange') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'fullscreenchange') {
      this.listeners.delete(listener);
    }
  }

  private emitChange() {
    for (const listener of this.listeners) {
      if (typeof listener === 'function') {
        listener(new Event('fullscreenchange'));
      } else {
        listener.handleEvent(new Event('fullscreenchange'));
      }
    }
  }

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
