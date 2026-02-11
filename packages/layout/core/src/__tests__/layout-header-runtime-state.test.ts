import { describe, expect, it } from 'vitest';
import {
  createLayoutHeaderAutoHideRuntime,
  createLayoutHeaderStateController,
} from '../utils';

class FakeEventTarget {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  scrollY = 0;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      this.listeners.delete(type);
    }
  }

  emit(type: string, event: Event | Record<string, unknown> = {}) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of set) {
      if (typeof listener === 'function') {
        listener(event as Event);
      } else {
        listener.handleEvent(event as Event);
      }
    }
  }

  count(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class FakeScrollTarget extends FakeEventTarget {
  scrollTop = 0;
}

function createRafController() {
  let id = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  return {
    requestFrame: (callback: FrameRequestCallback) => {
      const nextId = ++id;
      callbacks.set(nextId, callback);
      return nextId;
    },
    cancelFrame: (targetId: number) => {
      callbacks.delete(targetId);
    },
    flush: () => {
      const entries = [...callbacks.entries()];
      callbacks.clear();
      entries.forEach(([, callback]) => callback(16));
    },
  };
}

describe('layout-header-runtime-state helpers', () => {
  it('should toggle hidden by auto-scroll mode', () => {
    const target = new FakeEventTarget();
    const content = new FakeScrollTarget();
    const raf = createRafController();

    let mode: 'auto-scroll' | 'fixed' = 'auto-scroll';
    let hidden = false;

    const runtime = createLayoutHeaderAutoHideRuntime({
      eventTarget: target,
      requestFrame: raf.requestFrame,
      cancelFrame: raf.cancelFrame,
      getMode: () => mode,
      getHidden: () => hidden,
      setHidden: (value) => {
        hidden = value;
      },
      getHeaderHeight: () => 60,
      getWindowScrollY: () => target.scrollY,
      getScrollTarget: () => content,
    });

    runtime.start();
    expect(target.count('scroll')).toBe(1);
    expect(content.count('scroll')).toBe(1);
    expect(target.count('mousemove')).toBe(0);

    target.scrollY = 100;
    target.emit('scroll');
    raf.flush();
    expect(hidden).toBe(true);

    target.scrollY = 10;
    target.emit('scroll');
    raf.flush();
    expect(hidden).toBe(false);

    mode = 'fixed';
    runtime.refresh();
    expect(hidden).toBe(false);
    expect(target.count('scroll')).toBe(0);
    expect(content.count('scroll')).toBe(0);

    runtime.destroy();
  });

  it('should toggle hidden by mouse in auto mode', () => {
    const target = new FakeEventTarget();
    const content = new FakeScrollTarget();
    const raf = createRafController();

    let hidden = false;

    const runtime = createLayoutHeaderAutoHideRuntime({
      eventTarget: target,
      requestFrame: raf.requestFrame,
      cancelFrame: raf.cancelFrame,
      getMode: () => 'auto',
      getHidden: () => hidden,
      setHidden: (value) => {
        hidden = value;
      },
      getHeaderHeight: () => 60,
      getWindowScrollY: () => target.scrollY,
      getScrollTarget: () => content,
    });

    runtime.start();
    expect(target.count('mousemove')).toBe(1);

    target.emit('mousemove', { clientY: 100 });
    raf.flush();
    expect(hidden).toBe(true);

    target.emit('mousemove', { clientY: 10 });
    raf.flush();
    expect(hidden).toBe(false);

    runtime.destroy();
  });

  it('should cancel pending raf on destroy', () => {
    const target = new FakeEventTarget();
    const content = new FakeScrollTarget();
    const raf = createRafController();

    let hidden = false;

    const runtime = createLayoutHeaderAutoHideRuntime({
      eventTarget: target,
      requestFrame: raf.requestFrame,
      cancelFrame: raf.cancelFrame,
      getMode: () => 'auto-scroll',
      getHidden: () => hidden,
      setHidden: (value) => {
        hidden = value;
      },
      getHeaderHeight: () => 60,
      getWindowScrollY: () => target.scrollY,
      getScrollTarget: () => content,
    });

    runtime.start();
    target.scrollY = 100;
    target.emit('scroll');
    runtime.destroy();
    raf.flush();
    expect(hidden).toBe(false);
    expect(target.count('scroll')).toBe(0);
    expect(content.count('scroll')).toBe(0);
  });

  it('should create header state controller and sync runtime', () => {
    const target = new FakeEventTarget();
    const content = new FakeScrollTarget();
    const raf = createRafController();

    const state = {
      stateHidden: false,
      configHidden: false,
      mode: 'auto-scroll' as 'auto-scroll' | 'fixed',
      headerHeight: 60,
    };

    const controller = createLayoutHeaderStateController({
      getStateHidden: () => state.stateHidden,
      getConfigHidden: () => state.configHidden,
      getMode: () => state.mode,
      getHeaderHeight: () => state.headerHeight,
      setStateHidden: (value) => {
        state.stateHidden = value;
      },
    });

    // Inject runtime dependencies through global-like behavior by reusing runtime factory defaults.
    const runtime = createLayoutHeaderAutoHideRuntime({
      eventTarget: target,
      requestFrame: raf.requestFrame,
      cancelFrame: raf.cancelFrame,
      getMode: () => controller.getSnapshot().mode,
      getHidden: () => controller.getSnapshot().hidden,
      setHidden: controller.setHidden,
      getHeaderHeight: () => state.headerHeight,
      getWindowScrollY: () => target.scrollY,
      getScrollTarget: () => content,
    });

    runtime.start();
    target.scrollY = 100;
    target.emit('scroll');
    raf.flush();
    expect(controller.getSnapshot().hidden).toBe(true);

    state.mode = 'fixed';
    runtime.refresh();
    expect(controller.getSnapshot().mode).toBe('fixed');

    runtime.destroy();
  });
});
