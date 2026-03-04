import {
  createLayoutAutoLockRuntime,
  resolveLockScreenSnapshot,
  type LockScreenConfig,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理锁屏功能配置与自动锁屏运行时。
 * @returns 锁屏状态快照、配置与手动锁屏方法。
 */
export function useLockScreen() {
  const context = useLayoutContext();

  /**
   * 锁屏配置对象。
   */
  const config = useMemo<LockScreenConfig>(() => context.props.lockScreen || {}, [context.props.lockScreen]);
  /**
   * 锁屏派生快照。
   */
  const snapshot = useMemo(() => resolveLockScreenSnapshot(config), [config]);
  const configRef = useRef(config);
  configRef.current = config;

  /**
   * 手动触发锁屏。
   */
  const lock = useCallback(() => {
    context.events.onLockScreen?.();
  }, [context.events]);

  /**
   * 自动锁屏运行时控制器。
   */
  const runtime = useMemo(
    () =>
      createLayoutAutoLockRuntime({
        getConfig: () => configRef.current,
        onLock: lock,
      }),
    [lock]
  );

  useEffect(() => {
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    runtime.sync();
  }, [runtime, config]);

  return {
    isLocked: snapshot.isLocked,
    backgroundImage: snapshot.backgroundImage,
    showUserInfo: snapshot.showUserInfo,
    showClock: snapshot.showClock,
    showDate: snapshot.showDate,
    config,
    lock,
  };
}
