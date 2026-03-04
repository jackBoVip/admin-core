/**
 * 布局头部区域状态 Hook（React）。
 * @description 统一管理头部显示模式、滚动联动隐藏状态与显隐控制动作。
 */
import { createLayoutHeaderStateController } from '@admin-core/layout';
import { useEffect, useMemo, useRef } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

/**
 * 头部模式类型。
 * @description 由头部状态控制器快照推导，保持与 core 层实现一致。
 */
type HeaderMode = ReturnType<
  ReturnType<typeof createLayoutHeaderStateController>['getSnapshot']
>['mode'];

/**
 * `useHeaderState` 返回值。
 */
export interface UseHeaderStateReturn {
  /** 头部是否隐藏。 */
  hidden: boolean;
  /** 头部高度（像素）。 */
  height: number;
  /** 头部是否可见。 */
  visible: boolean;
  /** 头部运行模式。 */
  mode: HeaderMode;
  /** 显式设置头部隐藏状态。 */
  setHidden: (value: boolean) => void;
}

/**
 * 管理布局头部区域状态。
 * @returns 头部显隐、模式、高度及状态更新方法。
 */
export function useHeaderState(): UseHeaderStateReturn {
  /**
   * 布局上下文。
   * @description 提供头部配置、事件总线与运行时状态容器。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态。
   * @description 提供头部高度与显隐等计算结果。
   */
  const computed = useLayoutComputed();
  /**
   * 布局运行时状态及写入函数。
   */
  const [state, setState] = useLayoutState();

  /**
   * 头部高度。
   */
  const height = computed.headerHeight;
  /**
   * 头部是否可见。
   */
  const visible = computed.showHeader;

  const stateHiddenRef = useRef(state.headerHidden);
  stateHiddenRef.current = state.headerHidden;
  /**
   * 头部配置隐藏状态引用。
   * @description 缓存最新配置，供控制器稳定读取。
   */
  const configHiddenRef = useRef(context.props.header?.hidden === true);
  configHiddenRef.current = context.props.header?.hidden === true;
  /**
   * 头部模式引用。
   * @description 缓存最新模式，供控制器稳定读取。
   */
  const modeRef = useRef(context.props.header?.mode);
  modeRef.current = context.props.header?.mode;
  /**
   * 头部高度引用。
   * @description 缓存最新高度，供控制器稳定读取。
   */
  const heightRef = useRef(height);
  heightRef.current = height;

  /**
   * 头部状态控制器，负责滚动联动隐藏与模式同步。
   */
  const controller = useMemo(
    () =>
      createLayoutHeaderStateController({
        getStateHidden: () => stateHiddenRef.current,
        getConfigHidden: () => configHiddenRef.current,
        getMode: () => modeRef.current,
        getHeaderHeight: () => heightRef.current,
        setStateHidden: (value: boolean) => {
          setState((prev) => (prev.headerHidden === value ? prev : { ...prev, headerHidden: value }));
        },
      }),
    [setState]
  );

  /**
   * 头部状态快照。
   */
  const snapshot = controller.getSnapshot();
  const hidden = snapshot.hidden;
  const mode = snapshot.mode;

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  useEffect(() => {
    controller.sync();
  }, [controller, mode]);

  return {
    hidden,
    height,
    visible,
    mode,
    setHidden: controller.setHidden,
  };
}
