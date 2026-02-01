/**
 * 布局上下文 Hook
 * @description 提供布局状态和方法的 Context
 */

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
import type {
  BasicLayoutProps,
  LayoutContext,
  LayoutState,
  LayoutEvents,
  LayoutComputed,
} from '@admin-core/layout';
import {
  DEFAULT_LAYOUT_STATE,
  DEFAULT_LAYOUT_CONFIG,
  calculateLayoutComputed,
  generateCSSVariables,
  mergeConfig,
  createI18n,
  type SupportedLocale,
} from '@admin-core/layout';

/**
 * 布局上下文类型
 */
interface LayoutContextValue {
  context: LayoutContext;
  computed: LayoutComputed;
  cssVars: Record<string, string>;
  state: LayoutState;
  setState: React.Dispatch<React.SetStateAction<LayoutState>>;
}

/**
 * 布局上下文
 */
const LayoutContextInstance = createContext<LayoutContextValue | null>(null);

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

  // 从 props 中获取初始状态值
  const getInitialState = (): LayoutState => ({
    ...DEFAULT_LAYOUT_STATE,
    // 从 sidebar 配置初始化折叠状态
    sidebarCollapsed: props.sidebar?.collapsed ?? DEFAULT_LAYOUT_STATE.sidebarCollapsed,
    // 从 sidebar 配置初始化 expandOnHover
    sidebarExpandOnHover: props.sidebar?.expandOnHover ?? DEFAULT_LAYOUT_STATE.sidebarExpandOnHover,
    // 从 panel 配置初始化折叠状态
    panelCollapsed: props.panel?.collapsed ?? DEFAULT_LAYOUT_STATE.panelCollapsed,
  });

  // 布局状态（从 props 初始化）
  const [state, setState] = useState<LayoutState>(getInitialState);
  
  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);
  
  // 监听 props 中折叠状态的变化
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // 同步 sidebar.collapsed 到 state
    if (props.sidebar?.collapsed !== undefined) {
      setState(prev => {
        if (prev.sidebarCollapsed !== props.sidebar!.collapsed) {
          return { ...prev, sidebarCollapsed: props.sidebar!.collapsed! };
        }
        return prev;
      });
    }
    
    // 同步 sidebar.expandOnHover 到 state
    if (props.sidebar?.expandOnHover !== undefined) {
      setState(prev => {
        if (prev.sidebarExpandOnHover !== props.sidebar!.expandOnHover) {
          return { ...prev, sidebarExpandOnHover: props.sidebar!.expandOnHover! };
        }
        return prev;
      });
    }
    
    // 同步 panel.collapsed 到 state
    if (props.panel?.collapsed !== undefined) {
      setState(prev => {
        if (prev.panelCollapsed !== props.panel!.collapsed) {
          return { ...prev, panelCollapsed: props.panel!.collapsed! };
        }
        return prev;
      });
    }
  }, [props.sidebar?.collapsed, props.sidebar?.expandOnHover, props.panel?.collapsed]);

  // 国际化实例
  const i18n = useMemo(
    () => createI18n(locale, customMessages),
    [locale, customMessages]
  );

  // 切换侧边栏折叠
  const toggleSidebarCollapse = useCallback(() => {
    setState((prev) => {
      const newCollapsed = !prev.sidebarCollapsed;
      events.onSidebarCollapse?.(newCollapsed);
      return { ...prev, sidebarCollapsed: newCollapsed };
    });
  }, [events]);

  // 切换功能区折叠
  const togglePanelCollapse = useCallback(() => {
    setState((prev) => {
      const newCollapsed = !prev.panelCollapsed;
      events.onPanelCollapse?.(newCollapsed);
      return { ...prev, panelCollapsed: newCollapsed };
    });
  }, [events]);

  // 设置展开的菜单
  const setOpenMenuKeys = useCallback((keys: string[]) => {
    setState((prev) => ({ ...prev, openMenuKeys: keys }));
  }, []);

  // 使用 ref 存储 state，避免 context 因 state 变化而频繁重建
  const stateRef = useRef(state);
  stateRef.current = state;

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

  // Provider 值
  const value: LayoutContextValue = useMemo(
    () => ({
      context,
      computed,
      cssVars,
      state,
      setState,
    }),
    [context, computed, cssVars, state]
  );

  return (
    <LayoutContextInstance.Provider value={value}>
      {children}
    </LayoutContextInstance.Provider>
  );
}

/**
 * 使用布局上下文
 */
export function useLayoutContext(): LayoutContext {
  const value = useContext(LayoutContextInstance);
  if (!value) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return value.context;
}

/**
 * 使用布局计算属性
 */
export function useLayoutComputed(): LayoutComputed {
  const value = useContext(LayoutContextInstance);
  if (!value) {
    throw new Error('useLayoutComputed must be used within a LayoutProvider');
  }
  return value.computed;
}

/**
 * 使用布局 CSS 变量
 */
export function useLayoutCSSVars(): Record<string, string> {
  const value = useContext(LayoutContextInstance);
  if (!value) {
    throw new Error('useLayoutCSSVars must be used within a LayoutProvider');
  }
  return value.cssVars;
}

/**
 * 使用布局状态（带 setter）
 */
export function useLayoutState(): [LayoutState, React.Dispatch<React.SetStateAction<LayoutState>>] {
  const value = useContext(LayoutContextInstance);
  if (!value) {
    throw new Error('useLayoutState must be used within a LayoutProvider');
  }
  return [value.state, value.setState];
}
