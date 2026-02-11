import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutAutoLockRuntime,
  createLayoutCheckUpdatesRuntime,
  createLayoutShortcutKeyRuntime,
  createLayoutThemeSystemRuntime,
  createShortcutKeydownHandler,
  readFullscreenState,
  startAutoLockTimerIfEnabled,
  startCheckUpdatesTimerIfEnabled,
  toggleFullscreenState,
} from '../utils';

describe('layout-runtime-state helpers', () => {
  it('should read and toggle fullscreen state', async () => {
    let fullscreenElement: Element | null = null;
    const documentLike = {
      get fullscreenElement() {
        return fullscreenElement;
      },
      documentElement: {
        requestFullscreen: vi.fn(async () => {
          fullscreenElement = {} as Element;
        }),
      },
      exitFullscreen: vi.fn(async () => {
        fullscreenElement = null;
      }),
    };

    expect(readFullscreenState(documentLike)).toBe(false);
    await expect(toggleFullscreenState(documentLike)).resolves.toBe(true);
    expect(readFullscreenState(documentLike)).toBe(true);
    await expect(toggleFullscreenState(documentLike)).resolves.toBe(false);
    expect(readFullscreenState(documentLike)).toBe(false);
  });

  it('should start auto lock timer only when enabled', () => {
    const onLock = vi.fn();
    expect(startAutoLockTimerIfEnabled({}, onLock)).toBeNull();
    expect(startAutoLockTimerIfEnabled({ autoLockTime: 0 }, onLock)).toBeNull();
    const cleanup = startAutoLockTimerIfEnabled({ autoLockTime: 10 }, onLock);
    expect(typeof cleanup).toBe('function');
    cleanup?.();
  });

  it('should start check updates timer only when enabled', () => {
    const onUpdate = vi.fn();
    const checkFn = vi.fn(async () => true);

    expect(startCheckUpdatesTimerIfEnabled({}, onUpdate, checkFn)).toBeNull();
    expect(
      startCheckUpdatesTimerIfEnabled({ enable: true, interval: 0 }, onUpdate, checkFn)
    ).toBeNull();
    expect(startCheckUpdatesTimerIfEnabled({ enable: true, interval: 10 }, onUpdate)).toBeNull();
    const cleanup = startCheckUpdatesTimerIfEnabled(
      { enable: true, interval: 10 },
      onUpdate,
      checkFn
    );
    expect(typeof cleanup).toBe('function');
    cleanup?.();
  });

  it('should create shortcut keydown handler', () => {
    const onLockScreen = vi.fn();
    const handler = createShortcutKeydownHandler({
      getConfig: () => ({ enable: true, globalLockScreen: true }),
      getHandlers: () => ({ onLockScreen }),
    });

    const event = {
      code: 'KeyL',
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      key: 'l',
      defaultPrevented: false,
      preventDefault: vi.fn(),
      target: undefined,
    } as unknown as KeyboardEvent;
    handler(event);
    expect(onLockScreen).toHaveBeenCalledTimes(1);
  });

  it('should start and stop shortcut runtime by enabled flag', () => {
    let enabled = true;
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const onKeydown = vi.fn();

    const runtime = createLayoutShortcutKeyRuntime({
      getEnabled: () => enabled,
      onKeydown,
      eventTarget: {
        addEventListener,
        removeEventListener,
      },
    });

    runtime.start();
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener.mock.calls[0]?.[0]).toBe('keydown');

    runtime.sync();
    expect(addEventListener).toHaveBeenCalledTimes(1);

    enabled = false;
    runtime.sync();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener.mock.calls[0]?.[0]).toBe('keydown');

    runtime.destroy();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('should sync system dark state in theme runtime', () => {
    let enabled = false;
    let listener: ((event: MediaQueryListEvent) => void) | null = null;
    let systemDark = false;

    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn((type: 'change', cb: (event: MediaQueryListEvent) => void) => {
        if (type === 'change') listener = cb;
      }),
      removeEventListener: vi.fn((type: 'change', cb: (event: MediaQueryListEvent) => void) => {
        if (type === 'change' && listener === cb) listener = null;
      }),
    };

    const runtime = createLayoutThemeSystemRuntime({
      getEnabled: () => enabled,
      setSystemDark: (value) => {
        systemDark = value;
      },
      matchMedia: () => mediaQuery,
    });

    runtime.start();
    expect(mediaQuery.addEventListener).not.toHaveBeenCalled();

    enabled = true;
    runtime.sync();
    expect(mediaQuery.addEventListener).toHaveBeenCalledTimes(1);
    expect(systemDark).toBe(false);

    mediaQuery.matches = true;
    listener?.({ matches: true } as MediaQueryListEvent);
    expect(systemDark).toBe(true);

    enabled = false;
    runtime.sync();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(1);

    runtime.destroy();
  });

  it('should manage auto-lock runtime lifecycle', () => {
    vi.useFakeTimers();

    const docHolder = globalThis as { document?: EventTarget };
    const originalDocument = docHolder.document;
    docHolder.document = new EventTarget();

    let config = {
      autoLockTime: 0.001,
      isLocked: false,
    };
    const onLock = vi.fn();

    const runtime = createLayoutAutoLockRuntime({
      getConfig: () => config,
      onLock,
    });

    runtime.start();
    vi.advanceTimersByTime(70);
    expect(onLock).toHaveBeenCalledTimes(1);

    config = {
      autoLockTime: 0,
      isLocked: false,
    };
    runtime.sync();
    vi.advanceTimersByTime(500);
    expect(onLock).toHaveBeenCalledTimes(1);

    runtime.destroy();
    docHolder.document = originalDocument;
    vi.useRealTimers();
  });

  it('should manage check-updates runtime lifecycle', async () => {
    vi.useFakeTimers();

    let config = {
      enable: true,
      interval: 1,
    };
    const firstCheckFn = vi.fn(async () => true);
    let checkFn: (() => Promise<boolean>) | undefined = firstCheckFn;
    const onUpdate = vi.fn();

    const runtime = createLayoutCheckUpdatesRuntime({
      getConfig: () => config,
      getCheckFn: () => checkFn,
      onUpdate,
    });

    runtime.start();
    await Promise.resolve();
    expect(firstCheckFn).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(true);

    config = {
      enable: false,
      interval: 1,
    };
    runtime.sync();
    vi.advanceTimersByTime(60_000);
    await Promise.resolve();
    expect(firstCheckFn).toHaveBeenCalledTimes(1);

    config = {
      enable: true,
      interval: 1,
    };
    const secondCheckFn = vi.fn(async () => false);
    checkFn = secondCheckFn;
    runtime.sync();
    await Promise.resolve();
    expect(secondCheckFn).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(false);

    runtime.destroy();
    vi.useRealTimers();
  });
});
