/**
 * 主题与安全能力 - 快捷键 Hook（React）。
 * @description 负责布局快捷键运行时的创建、启停与启用状态同步。
 */
import {
  createLayoutShortcutKeyRuntime,
  createShortcutKeydownHandler,
  resolveShortcutEnabled,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 注册布局全局快捷键监听。
 * @description 将快捷键配置映射为键盘监听运行时，并在启用状态变化时自动同步。
 * @returns 快捷键配置及当前启用状态。
 */
export function useShortcutKeys() {
  /**
   * 布局上下文（配置与事件处理器）。
   */
  const context = useLayoutContext();

  /**
   * 快捷键配置对象。
   */
  const config = useMemo(() => context.props.shortcutKeys || {}, [context.props.shortcutKeys]);
  /**
   * 快捷键功能是否启用。
   */
  const enabled = resolveShortcutEnabled(config);
  /**
   * 启用状态引用缓存。
   * @description 供运行时读取最新开关状态，避免闭包捕获旧值。
   */
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  /**
   * 事件处理器引用缓存。
   * @description 让键盘处理器始终访问最新业务回调。
   */
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  /**
   * `keydown` 事件处理器。
   */
  const keydownHandler = useMemo(
    () =>
      createShortcutKeydownHandler({
        getConfig: () => config,
        getHandlers: () => eventsRef.current,
      }),
    [config]
  );

  /**
   * 快捷键运行时控制器。
   */
  const runtime = useMemo(
    () =>
      createLayoutShortcutKeyRuntime({
        getEnabled: () => enabledRef.current,
        onKeydown: keydownHandler,
      }),
    [keydownHandler]
  );

  useEffect(() => {
    /**
     * 组件挂载时启动快捷键运行时，卸载时销毁监听器。
     */
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    /**
     * 启用状态变化后同步运行时监听开关。
     */
    runtime.sync();
  }, [runtime, enabled]);

  return {
    enabled,
    config,
  };
}
