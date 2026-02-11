import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutResponsiveRuntime,
  createLayoutResponsiveStateController,
} from '../utils';

class FakeResizeTarget {
  private readonly listeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ) {
    if (type === 'resize') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ) {
    if (type === 'resize') {
      this.listeners.delete(listener);
    }
  }

  emitResize() {
    for (const listener of this.listeners) {
      if (typeof listener === 'function') {
        listener(new Event('resize'));
      } else {
        listener.handleEvent(new Event('resize'));
      }
    }
  }

  get listenerCount() {
    return this.listeners.size;
  }
}

describe('layout-responsive-runtime-state helpers', () => {
  it('should update width on resize with throttle', () => {
    vi.useFakeTimers();

    const target = new FakeResizeTarget();
    let viewportWidth = 1280;
    let width = 1024;

    const runtime = createLayoutResponsiveRuntime({
      target,
      throttleMs: 100,
      getWidth: () => width,
      setWidth: (next) => {
        width = next;
      },
      readWindowWidth: () => viewportWidth,
    });

    runtime.start();
    expect(target.listenerCount).toBe(1);

    viewportWidth = 1200;
    target.emitResize();
    expect(width).toBe(1024);

    vi.advanceTimersByTime(100);
    expect(width).toBe(1200);

    runtime.destroy();
    expect(target.listenerCount).toBe(0);

    vi.useRealTimers();
  });

  it('should throttle burst resize events into one update', () => {
    vi.useFakeTimers();

    const target = new FakeResizeTarget();
    let viewportWidth = 1280;
    let width = 1024;
    const setWidth = vi.fn((next: number) => {
      width = next;
    });

    const runtime = createLayoutResponsiveRuntime({
      target,
      throttleMs: 120,
      getWidth: () => width,
      setWidth,
      readWindowWidth: () => viewportWidth,
    });

    runtime.start();

    viewportWidth = 1100;
    target.emitResize();
    viewportWidth = 1120;
    target.emitResize();
    viewportWidth = 1150;
    target.emitResize();

    expect(setWidth).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(120);
    expect(setWidth).toHaveBeenCalledTimes(1);
    expect(width).toBe(1150);

    runtime.destroy();
    vi.useRealTimers();
  });

  it('should clear pending timer on destroy', () => {
    vi.useFakeTimers();

    const target = new FakeResizeTarget();
    let viewportWidth = 1280;
    let width = 1024;
    const setWidth = vi.fn((next: number) => {
      width = next;
    });

    const runtime = createLayoutResponsiveRuntime({
      target,
      throttleMs: 200,
      getWidth: () => width,
      setWidth,
      readWindowWidth: () => viewportWidth,
    });

    runtime.start();
    viewportWidth = 1300;
    target.emitResize();
    runtime.destroy();

    vi.advanceTimersByTime(300);
    expect(setWidth).toHaveBeenCalledTimes(0);

    vi.useRealTimers();
  });

  it('should resolve responsive snapshot from state controller', () => {
    vi.useFakeTimers();

    const target = new FakeResizeTarget();
    let viewportWidth = 640;
    let width = 640;

    const controller = createLayoutResponsiveStateController({
      target,
      throttleMs: 100,
      getWidth: () => width,
      setWidth: (next) => {
        width = next;
      },
      readWindowWidth: () => viewportWidth,
    });

    controller.start();
    expect(controller.getSnapshot()).toMatchObject({
      width: 640,
      isMobile: true,
      breakpoint: 'sm',
    });

    viewportWidth = 1200;
    target.emitResize();
    vi.advanceTimersByTime(100);
    expect(controller.getSnapshot()).toMatchObject({
      width: 1200,
      isDesktop: true,
      breakpoint: 'lg',
    });

    controller.destroy();
    vi.useRealTimers();
  });
});
