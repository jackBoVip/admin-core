/**
 * 布局上下文 Composable
 * @description 提供布局状态和方法的注入/获取
 */

import { inject, provide, reactive, computed, watch, isRef, type InjectionKey, type ComputedRef } from 'vue';
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
} from '@admin-core/layout';
import { createI18n, type SupportedLocale } from '@admin-core/layout';

/**
 * 布局上下文注入键
 */
export const LAYOUT_CONTEXT_KEY: InjectionKey<LayoutContext> = Symbol('layout-context');

/**
 * 布局计算属性注入键
 */
export const LAYOUT_COMPUTED_KEY: InjectionKey<ComputedRef<LayoutComputed>> = Symbol('layout-computed');

/**
 * 布局 CSS 变量注入键
 */
export const LAYOUT_CSS_VARS_KEY: InjectionKey<ComputedRef<Record<string, string>>> = Symbol('layout-css-vars');

/**
 * 创建布局上下文
 * @param propsOrGetter - props 对象、返回 props 的 getter 函数或 ComputedRef（支持响应式更新）
 */
export function createLayoutContext(
  propsOrGetter: BasicLayoutProps | (() => BasicLayoutProps) | ComputedRef<BasicLayoutProps>,
  events: LayoutEvents,
  options?: {
    locale?: SupportedLocale;
    customMessages?: Record<string, Record<string, unknown>>;
  }
): {
  context: LayoutContext;
  computed: ComputedRef<LayoutComputed>;
  cssVars: ComputedRef<Record<string, string>>;
  state: LayoutState;
} {
  // 支持 ComputedRef、getter 函数或直接的 props 对象
  const getProps = isRef(propsOrGetter) 
    ? () => propsOrGetter.value 
    : typeof propsOrGetter === 'function' 
      ? propsOrGetter 
      : () => propsOrGetter;
  
  // 合并默认配置（响应式）
  const mergedProps = computed(() => mergeConfig(DEFAULT_LAYOUT_CONFIG, getProps()));

  // 从 props 中获取初始状态值
  const initialProps = getProps();
  
  // 创建响应式状态（从 props 中读取初始值）
  const state = reactive<LayoutState>({
    ...DEFAULT_LAYOUT_STATE,
    // 从 sidebar 配置初始化折叠状态
    sidebarCollapsed: initialProps.sidebar?.collapsed ?? DEFAULT_LAYOUT_STATE.sidebarCollapsed,
    // 从 sidebar 配置初始化 expandOnHover
    sidebarExpandOnHover: initialProps.sidebar?.expandOnHover ?? DEFAULT_LAYOUT_STATE.sidebarExpandOnHover,
    // 从 panel 配置初始化折叠状态
    panelCollapsed: initialProps.panel?.collapsed ?? DEFAULT_LAYOUT_STATE.panelCollapsed,
  });

  // 创建国际化实例
  const i18n = createI18n(options?.locale || 'zh-CN', options?.customMessages);

  // 切换侧边栏折叠
  const toggleSidebarCollapse = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    events.onSidebarCollapse?.(state.sidebarCollapsed);
  };

  // 切换功能区折叠
  const togglePanelCollapse = () => {
    state.panelCollapsed = !state.panelCollapsed;
    events.onPanelCollapse?.(state.panelCollapsed);
  };

  // 设置展开的菜单
  const setOpenMenuKeys = (keys: string[]) => {
    const prevKeys = state.openMenuKeys;
    if (prevKeys.length === keys.length) {
      let same = true;
      for (let i = 0; i < keys.length; i += 1) {
        if (prevKeys[i] !== keys[i]) {
          same = false;
          break;
        }
      }
      if (same) return;
    }
    state.openMenuKeys = keys;
  };

  // 创建响应式 props 代理
  const reactiveProps = reactive<BasicLayoutProps>({} as BasicLayoutProps);
  
  // 创建响应式上下文（整个 context 都是响应式的）
  const context = reactive<LayoutContext>({
    props: reactiveProps,
    state,
    events,
    t: i18n.t,
    toggleSidebarCollapse,
    togglePanelCollapse,
    setOpenMenuKeys,
  });

  // 监听并同步 props 变化
  // 注意：deep: true 是必要的，因为需要检测嵌套属性（如 sidebar.collapsed）的变化
  // 以正确同步偏好设置更新到布局状态
  watch(
    mergedProps,
    (newProps) => {
      // 使用 Object.assign 直接更新所有顶层属性
      // 这会触发 Vue 的响应式系统，因为每个属性都会被单独赋值
      const propsRecord = reactiveProps as Record<string, unknown>;
      const newPropsRecord = newProps as Record<string, unknown>;
      
      // 更新所有属性（直接替换，不做深度比较）
      for (const key of Object.keys(newPropsRecord)) {
        propsRecord[key] = newPropsRecord[key];
      }
      
      // 删除不再存在的属性
      for (const key of Object.keys(propsRecord)) {
        if (!(key in newPropsRecord)) {
          delete propsRecord[key];
        }
      }
      
      // 同步 sidebar.collapsed 到 state（当 preferences 变化时）
      if (newProps.sidebar?.collapsed !== undefined && state.sidebarCollapsed !== newProps.sidebar.collapsed) {
        state.sidebarCollapsed = newProps.sidebar.collapsed;
      }
      // 同步 sidebar.expandOnHover 到 state
      if (newProps.sidebar?.expandOnHover !== undefined && state.sidebarExpandOnHover !== newProps.sidebar.expandOnHover) {
        state.sidebarExpandOnHover = newProps.sidebar.expandOnHover;
      }
      // 同步 panel.collapsed 到 state
      if (newProps.panel?.collapsed !== undefined && state.panelCollapsed !== newProps.panel.collapsed) {
        state.panelCollapsed = newProps.panel.collapsed;
      }
    },
    { immediate: true, deep: true }
  );

  // 计算布局属性（直接依赖 mergedProps 确保响应式）
  const layoutComputed = computed(() => calculateLayoutComputed(mergedProps.value, state));

  // 生成 CSS 变量（依赖响应式 props）
  const cssVars = computed(() => generateCSSVariables(reactiveProps, state));

  // 注入上下文
  provide(LAYOUT_CONTEXT_KEY, context);
  provide(LAYOUT_COMPUTED_KEY, layoutComputed);
  provide(LAYOUT_CSS_VARS_KEY, cssVars);

  return {
    context,
    computed: layoutComputed,
    cssVars,
    state,
  };
}

/**
 * 使用布局上下文
 */
export function useLayoutContext(): LayoutContext {
  const context = inject(LAYOUT_CONTEXT_KEY);
  if (!context) {
    throw new Error('useLayoutContext must be used within a BasicLayout component');
  }
  return context;
}

/**
 * 使用布局计算属性
 */
export function useLayoutComputed(): ComputedRef<LayoutComputed> {
  const computed = inject(LAYOUT_COMPUTED_KEY);
  if (!computed) {
    throw new Error('useLayoutComputed must be used within a BasicLayout component');
  }
  return computed;
}

/**
 * 使用布局 CSS 变量
 */
export function useLayoutCSSVars(): ComputedRef<Record<string, string>> {
  const cssVars = inject(LAYOUT_CSS_VARS_KEY);
  if (!cssVars) {
    throw new Error('useLayoutCSSVars must be used within a BasicLayout component');
  }
  return cssVars;
}
