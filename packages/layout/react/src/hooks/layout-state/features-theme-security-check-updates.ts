import {
  createLayoutCheckUpdatesRuntime,
  resolveCheckUpdatesEnabled,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理“检查更新”功能状态。
 * @description 负责初始化定时检查运行时并维护是否存在更新的状态。
 * @param checkFn 自定义检查更新函数，返回是否存在新版本。
 * @returns 检查更新配置、启用状态与最新检查结果。
 */
export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  const context = useLayoutContext();

  /**
   * 检查更新配置。
   */
  const config = useMemo(() => context.props.checkUpdates || {}, [context.props.checkUpdates]);
  /**
   * 检查更新功能是否启用。
   */
  const enabled = resolveCheckUpdatesEnabled(config);
  const [hasUpdate, setHasUpdate] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;
  const checkFnRef = useRef(checkFn);
  checkFnRef.current = checkFn;

  /**
   * 检查更新运行时控制器。
   */
  const runtime = useMemo(
    () =>
      createLayoutCheckUpdatesRuntime({
        getConfig: () => configRef.current,
        getCheckFn: () => checkFnRef.current,
        onUpdate: (nextValue) => {
          setHasUpdate(nextValue);
        },
      }),
    []
  );

  useEffect(() => {
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    runtime.sync();
  }, [runtime, enabled, checkFn, config]);

  return {
    enabled,
    hasUpdate,
    config,
  };
}
