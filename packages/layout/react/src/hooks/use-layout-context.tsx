/**
 * 布局上下文 Hook
 * @description 提供布局状态、派生结果、CSS 变量与交互动作的 React Context 实现。
 */

import {
  DEFAULT_LAYOUT_CONFIG,
  applyStatePatch,
  calculateLayoutComputed,
  createLayoutContextActionsController,
  createLayoutPropsStateSyncController,
  createI18n,
  generateCSSVariables,
  getInitialLayoutState,
  mergeConfig,
  type BasicLayoutProps,
  type LayoutComputed,
  type LayoutContext,
  type LayoutEvents,
  type LayoutState,
  type SupportedLocale,
} from '@admin-core/layout';
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

/**
 * 布局状态 Context 的值对象。
 * @description 拆分状态值与写入函数，便于按需订阅并减少无关重渲染。
 */
interface LayoutStateContextValue {
  /** 当前布局状态快照。 */
  state: LayoutState;
  /** 布局状态写入函数，支持直接赋值或基于前值计算。 */
  setState: React.Dispatch<React.SetStateAction<LayoutState>>;
}

/**
 * 拆分 Context，避免单一 value 导致全量扇出重渲染
 */
/** 布局上下文实例（含 props/state/events/动作）。 */
const LayoutContextInstance = createContext<LayoutContext | null>(null);
/** 布局派生计算结果上下文实例。 */
const LayoutComputedInstance = createContext<LayoutComputed | null>(null);
/** 布局 CSS 变量映射上下文实例。 */
const LayoutCSSVarsInstance = createContext<Record<string, string> | null>(null);
/** 布局状态与写入函数上下文实例。 */
const LayoutStateInstance = createContext<LayoutStateContextValue | null>(null);

/**
 * 布局 Provider Props
 * @description `LayoutProvider` 的入参定义，约束布局配置、事件回调和语言能力。
 */
export interface LayoutProviderProps {
  /** 子节点列表。 */
  children: ReactNode;
  /** 布局配置。 */
  props: BasicLayoutProps;
  /** 布局事件。 */
  events: LayoutEvents;
  /** 当前语言。 */
  locale?: SupportedLocale;
  /** 自定义国际化消息。 */
  customMessages?: Record<string, Record<string, unknown>>;
}

/**
 * 布局 Provider 组件
 * @description 负责初始化布局状态、执行 props->state 同步并向下游提供上下文能力。
 * @param props Provider 参数。
 * @returns 布局上下文提供器树。
 */
export function LayoutProvider({
  children,
  props,
  events,
  locale = 'zh-CN',
  customMessages,
}: LayoutProviderProps) {
  /**
   * 合并默认配置后的布局属性。
   */
  const mergedProps = useMemo(
    () => mergeConfig(DEFAULT_LAYOUT_CONFIG, props),
    [props]
  );

  /**
   * 参与运行时同步的精简 props 片段。
   */
  const syncProps = useMemo(
    () =>
      ({
        layout: props.layout,
        isMobile: props.isMobile,
        sidebar: {
          collapsed: props.sidebar?.collapsed,
          expandOnHover: props.sidebar?.expandOnHover,
        },
        panel: {
          collapsed: props.panel?.collapsed,
        },
      } as BasicLayoutProps),
    [
      props.layout,
      props.isMobile,
      props.sidebar?.collapsed,
      props.sidebar?.expandOnHover,
      props.panel?.collapsed,
    ]
  );

  /**
   * 计算布局初始状态。
   *
   * @returns 初始布局状态。
   */
  const getInitialState = (): LayoutState => getInitialLayoutState(props);

  /**
   * 布局状态（由 props 初始化）。
   */
  const [state, setState] = useState<LayoutState>(getInitialState);

  /**
   * 最新布局状态引用，用于控制器读取，避免 context 因状态变化重建。
   */
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * 应用布局状态补丁。
   *
   * @param patch 状态补丁。
   */
  const applyLayoutStatePatch = useCallback((patch: Partial<LayoutState>) => {
    setState((prev) => applyStatePatch(prev, patch).nextState);
  }, []);

  /**
   * props 同步控制器。
   */
  const propsSyncController = useMemo(
    () =>
      createLayoutPropsStateSyncController({
        getState: () => stateRef.current,
        setState: applyLayoutStatePatch,
        onSidebarCollapse: (collapsed) => {
          events.onSidebarCollapse?.(collapsed);
        },
      }),
    [events, applyLayoutStatePatch]
  );

  /**
   * 首次渲染标记，用于跳过首次 props 同步副作用。
   */
  const isFirstRender = useRef(true);

  /**
   * 监听折叠状态等关键 props 变化并同步到运行时状态。
   */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    propsSyncController.syncProps(syncProps);
  }, [syncProps, propsSyncController]);

  /**
   * 国际化实例。
   */
  const i18n = useMemo(
    () => createI18n(locale, customMessages),
    [locale, customMessages]
  );

  /**
   * 最新合并 props 引用，供控制器读取。
   */
  const mergedPropsRef = useRef(mergedProps);
  mergedPropsRef.current = mergedProps;

  /**
   * 上下文动作控制器。
   */
  const contextActionsController = useMemo(
    () =>
      createLayoutContextActionsController({
        getProps: () => mergedPropsRef.current,
        getState: () => stateRef.current,
        setState: applyLayoutStatePatch,
        onSidebarCollapse: (collapsed) => {
          events.onSidebarCollapse?.(collapsed);
        },
        onPanelCollapse: (collapsed) => {
          events.onPanelCollapse?.(collapsed);
        },
      }),
    [events, applyLayoutStatePatch]
  );

  /**
   * 切换侧边栏折叠状态。
   */
  const toggleSidebarCollapse = useCallback(() => {
    contextActionsController.toggleSidebarCollapse();
  }, [contextActionsController]);

  /**
   * 切换面板折叠状态。
   */
  const togglePanelCollapse = useCallback(() => {
    contextActionsController.togglePanelCollapse();
  }, [contextActionsController]);

  /**
   * 写入展开菜单键集合。
   *
   * @param keys 展开菜单键数组。
   */
  const setOpenMenuKeys = useCallback((keys: string[]) => {
    contextActionsController.setOpenMenuKeys(keys);
  }, [contextActionsController]);

  /**
   * 布局上下文对象。
   */
  const context: LayoutContext = useMemo(
    () => ({
      props: mergedProps,
      get state() {
        return stateRef.current;
      },
      events,
      t: i18n.t,
      toggleSidebarCollapse,
      togglePanelCollapse,
      setOpenMenuKeys,
    }),
    [mergedProps, events, i18n.t, toggleSidebarCollapse, togglePanelCollapse, setOpenMenuKeys]
  );

  /**
   * 布局派生计算结果。
   */
  const computed = useMemo(
    () => calculateLayoutComputed(mergedProps, state),
    [mergedProps, state]
  );

  /**
   * 布局 CSS 变量映射。
   */
  const cssVars = useMemo(
    () => generateCSSVariables(mergedProps, state),
    [mergedProps, state]
  );

  /**
   * 可订阅布局状态值（含 setState）。
   */
  const stateValue = useMemo<LayoutStateContextValue>(
    () => ({
      state,
      setState,
    }),
    [state]
  );

  return (
    <LayoutContextInstance.Provider value={context}>
      <LayoutComputedInstance.Provider value={computed}>
        <LayoutCSSVarsInstance.Provider value={cssVars}>
          <LayoutStateInstance.Provider value={stateValue}>
            {children}
          </LayoutStateInstance.Provider>
        </LayoutCSSVarsInstance.Provider>
      </LayoutComputedInstance.Provider>
    </LayoutContextInstance.Provider>
  );
}

/**
 * 使用布局上下文。
 * @description 返回包含布局 props、运行态、事件与动作方法的完整上下文对象。
 * @throws 当未在 `LayoutProvider` 内调用时抛错。
 * @returns 布局上下文对象。
 */
export function useLayoutContext(): LayoutContext {
  const context = useContext(LayoutContextInstance);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}

/**
 * 使用布局计算属性。
 * @description 返回根据 props/state 计算出的布局可见性与尺寸派生结果。
 * @throws 当未在 `LayoutProvider` 内调用时抛错。
 * @returns 布局派生计算结果。
 */
export function useLayoutComputed(): LayoutComputed {
  const computed = useContext(LayoutComputedInstance);
  if (!computed) {
    throw new Error('useLayoutComputed must be used within a LayoutProvider');
  }
  return computed;
}

/**
 * 使用布局 CSS 变量。
 * @description 返回当前布局态对应的 CSS 变量映射，可直接透传到样式系统。
 * @throws 当未在 `LayoutProvider` 内调用时抛错。
 * @returns CSS 变量键值对。
 */
export function useLayoutCSSVars(): Record<string, string> {
  const cssVars = useContext(LayoutCSSVarsInstance);
  if (!cssVars) {
    throw new Error('useLayoutCSSVars must be used within a LayoutProvider');
  }
  return cssVars;
}

/**
 * 使用布局状态（带 setter）。
 * @description 返回 `[state, setState]` 元组，供高级场景直接驱动布局状态。
 * @throws 当未在 `LayoutProvider` 内调用时抛错。
 * @returns 布局状态与写入函数。
 */
export function useLayoutState(): [LayoutState, React.Dispatch<React.SetStateAction<LayoutState>>] {
  const value = useContext(LayoutStateInstance);
  if (!value) {
    throw new Error('useLayoutState must be used within a LayoutProvider');
  }
  return [value.state, value.setState];
}
