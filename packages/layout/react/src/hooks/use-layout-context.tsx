/**
 * 布局上下文 Hook
 * @description 提供布局状态和方法的 Context
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

interface LayoutStateContextValue {
  state: LayoutState;
  setState: React.Dispatch<React.SetStateAction<LayoutState>>;
}

/**
 * 拆分 Context，避免单一 value 导致全量扇出重渲染
 */
const LayoutContextInstance = createContext<LayoutContext | null>(null);
const LayoutComputedInstance = createContext<LayoutComputed | null>(null);
const LayoutCSSVarsInstance = createContext<Record<string, string> | null>(null);
const LayoutStateInstance = createContext<LayoutStateContextValue | null>(null);

/**
 * 布局 Provider Props
 */
export interface LayoutProviderProps {
  children: ReactNode;
  /** 布局配置 */
  props: BasicLayoutProps;
  /** 布局事件 */
  events: LayoutEvents;
  /** 当前语言 */
  locale?: SupportedLocale;
  /** 自定义国际化消息 */
  customMessages?: Record<string, Record<string, unknown>>;
}

/**
 * 布局 Provider 组件
 */
export function LayoutProvider({
  children,
  props,
  events,
  locale = 'zh-CN',
  customMessages,
}: LayoutProviderProps) {
  // 合并默认配置
  const mergedProps = useMemo(
    () => mergeConfig(DEFAULT_LAYOUT_CONFIG, props),
    [props]
  );

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

  // 从 props 中获取初始状态值
  const getInitialState = (): LayoutState => getInitialLayoutState(props);

  // 布局状态（从 props 初始化）
  const [state, setState] = useState<LayoutState>(getInitialState);

  // 使用 ref 存储 state，避免 context 因 state 变化而频繁重建
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyLayoutStatePatch = useCallback((patch: Partial<LayoutState>) => {
    setState((prev) => applyStatePatch(prev, patch).nextState);
  }, []);

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

  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 监听 props 中折叠状态的变化
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    propsSyncController.syncProps(syncProps);
  }, [syncProps, propsSyncController]);

  // 国际化实例
  const i18n = useMemo(
    () => createI18n(locale, customMessages),
    [locale, customMessages]
  );

  const mergedPropsRef = useRef(mergedProps);
  mergedPropsRef.current = mergedProps;

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

  const toggleSidebarCollapse = useCallback(() => {
    contextActionsController.toggleSidebarCollapse();
  }, [contextActionsController]);

  const togglePanelCollapse = useCallback(() => {
    contextActionsController.togglePanelCollapse();
  }, [contextActionsController]);

  const setOpenMenuKeys = useCallback((keys: string[]) => {
    contextActionsController.setOpenMenuKeys(keys);
  }, [contextActionsController]);

  // 创建上下文 - 只依赖稳定的引用
  const context: LayoutContext = useMemo(
    () => ({
      props: mergedProps,
      // 使用 getter 访问最新 state，避免 context 重建
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

  // 计算布局属性
  const computed = useMemo(
    () => calculateLayoutComputed(mergedProps, state),
    [mergedProps, state]
  );

  // 生成 CSS 变量
  const cssVars = useMemo(
    () => generateCSSVariables(mergedProps, state),
    [mergedProps, state]
  );

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
 * 使用布局上下文
 */
export function useLayoutContext(): LayoutContext {
  const context = useContext(LayoutContextInstance);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}

/**
 * 使用布局计算属性
 */
export function useLayoutComputed(): LayoutComputed {
  const computed = useContext(LayoutComputedInstance);
  if (!computed) {
    throw new Error('useLayoutComputed must be used within a LayoutProvider');
  }
  return computed;
}

/**
 * 使用布局 CSS 变量
 */
export function useLayoutCSSVars(): Record<string, string> {
  const cssVars = useContext(LayoutCSSVarsInstance);
  if (!cssVars) {
    throw new Error('useLayoutCSSVars must be used within a LayoutProvider');
  }
  return cssVars;
}

/**
 * 使用布局状态（带 setter）
 */
export function useLayoutState(): [LayoutState, React.Dispatch<React.SetStateAction<LayoutState>>] {
  const value = useContext(LayoutStateInstance);
  if (!value) {
    throw new Error('useLayoutState must be used within a LayoutProvider');
  }
  return [value.state, value.setState];
}
