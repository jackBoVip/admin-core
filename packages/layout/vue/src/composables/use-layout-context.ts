/**
 * 布局上下文 Composable
 * @description 提供布局状态和方法的注入/获取
 */

import {
  DEFAULT_LAYOUT_CONFIG,
  applyStatePatchMutable,
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
import {
  computed,
  inject,
  isRef,
  provide,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
} from 'vue';

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
 * 创建布局上下文时的附加配置。
 */
export interface CreateLayoutContextOptions {
  /** 初始语言。 */
  locale?: SupportedLocale;
  /** 自定义国际化消息。 */
  customMessages?: Record<string, Record<string, unknown>>;
}

/**
 * 创建布局上下文的返回结果。
 */
export interface CreateLayoutContextResult {
  /** 布局上下文对象。 */
  context: LayoutContext;
  /** 布局计算状态。 */
  computed: ComputedRef<LayoutComputed>;
  /** 计算得到的 CSS 变量集合。 */
  cssVars: ComputedRef<Record<string, string>>;
  /** 响应式布局运行时状态。 */
  state: LayoutState;
}

/**
 * 创建并注入布局上下文。
 *
 * @param propsOrGetter `props` 对象、`props` getter 或 `ComputedRef`（支持响应式更新）。
 * @param events 布局事件回调集合。
 * @param options 上下文初始化选项。
 */
export function createLayoutContext(
  propsOrGetter: BasicLayoutProps | (() => BasicLayoutProps) | ComputedRef<BasicLayoutProps>,
  events: LayoutEvents,
  options?: CreateLayoutContextOptions
): CreateLayoutContextResult {
  /**
   * 标准化 `props` 读取器，兼容对象、getter 与 `ComputedRef`。
   */
  const getProps = isRef(propsOrGetter) 
    ? () => propsOrGetter.value 
    : typeof propsOrGetter === 'function' 
      ? propsOrGetter 
      : () => propsOrGetter;
  
  /**
   * 合并默认配置后的响应式 props。
   */
  const mergedProps = computed(() => mergeConfig(DEFAULT_LAYOUT_CONFIG, getProps()));

  /**
   * 初始化 props 快照。
   */
  const initialProps = getProps();
  /**
   * 初始语言值。
   */
  const initialLocale =
    (initialProps.locale as SupportedLocale | undefined) ??
    options?.locale ??
    'zh-CN';
  
  /**
   * 布局响应式状态（由初始化 props 生成）。
   */
  const state = reactive<LayoutState>(getInitialLayoutState(initialProps));

  /**
   * 国际化实例。
   */
  const i18n = createI18n(initialLocale, options?.customMessages);
  /**
   * 当前语言响应式引用。
   */
  const localeRef = ref<SupportedLocale>(initialLocale);

  /**
   * 同步上下文语言到本地状态与 i18n 实例。
   *
   * @param nextLocale 目标语言。
   */
  const syncLocale = (nextLocale?: SupportedLocale) => {
    if (!nextLocale) return;
    if (localeRef.value !== nextLocale) {
      localeRef.value = nextLocale;
    }
    if (i18n.getLocale() !== nextLocale) {
      i18n.setLocale(nextLocale);
    }
  };

  /**
   * 上下文动作控制器。
   */
  const contextActionsController = createLayoutContextActionsController({
    getProps: () => mergedProps.value,
    getState: () => state,
    setState: (patch) => {
      applyStatePatchMutable(state, patch);
    },
    onSidebarCollapse: (collapsed) => {
      events.onSidebarCollapse?.(collapsed);
    },
    onPanelCollapse: (collapsed) => {
      events.onPanelCollapse?.(collapsed);
    },
  });
  /**
   * props 状态同步控制器。
   */
  const propsSyncController = createLayoutPropsStateSyncController({
    getState: () => state,
    setState: (patch) => {
      applyStatePatchMutable(state, patch);
    },
    onSidebarCollapse: (collapsed) => {
      events.onSidebarCollapse?.(collapsed);
    },
  });

  /**
   * 切换侧边栏折叠状态。
   */
  const toggleSidebarCollapse = () => {
    contextActionsController.toggleSidebarCollapse();
  };

  /**
   * 切换面板折叠状态。
   */
  const togglePanelCollapse = () => {
    contextActionsController.togglePanelCollapse();
  };

  /**
   * 设置当前展开的菜单键集合。
   *
   * @param keys 展开菜单键数组。
   */
  const setOpenMenuKeys = (keys: string[]) => {
    contextActionsController.setOpenMenuKeys(keys);
  };

  /**
   * 响应式 props 代理对象（保持引用稳定）。
   */
  const reactiveProps = reactive<BasicLayoutProps>({} as BasicLayoutProps);
  
  /**
   * 响应式布局上下文对象。
   */
  const context = reactive<LayoutContext>({
    props: reactiveProps,
    state,
    events,
    t: (key, params) => {
      void localeRef.value;
      return i18n.t(key, params);
    },
    toggleSidebarCollapse,
    togglePanelCollapse,
    setOpenMenuKeys,
  });

  /**
   * 同步顶层 props 到响应式代理对象，保持引用稳定并移除过期字段。
   *
   * @param nextProps 最新布局 props。
   */
  const syncTopLevelProps = (nextProps: BasicLayoutProps) => {
    const propsRecord = reactiveProps as Record<string, unknown>;
    const nextRecord = nextProps as Record<string, unknown>;

    for (const key of Object.keys(nextRecord)) {
      const nextValue = nextRecord[key];
      if (propsRecord[key] !== nextValue) {
        propsRecord[key] = nextValue;
      }
    }

    for (const key of Object.keys(propsRecord)) {
      if (!(key in nextRecord)) {
        delete propsRecord[key];
      }
    }
  };

  /**
   * 监听并同步 props 变化（避免 deep watch 深层遍历开销）。
   */
  watch(
    mergedProps,
    (newProps) => {
      syncTopLevelProps(newProps);
      propsSyncController.syncProps(newProps);
    },
    { immediate: true }
  );

  /**
   * 监听 locale 变化并更新 i18n 实例。
   */
  watch(
    () => mergedProps.value.locale,
    (nextLocale) => {
      syncLocale(nextLocale as SupportedLocale | undefined);
    },
    { immediate: true }
  );

  /**
   * 布局派生计算结果。
   */
  const layoutComputed = computed(() => calculateLayoutComputed(mergedProps.value, state));

  /**
   * 布局 CSS 变量映射。
   */
  const cssVars = computed(() => generateCSSVariables(reactiveProps, state));

  /**
   * 注入布局上下文与派生结果。
   */
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
 * 获取当前组件树中的布局上下文。
 *
 * @returns 布局上下文对象。
 * @throws 当未在 `BasicLayout` 组件上下文中调用时抛出错误。
 */
export function useLayoutContext(): LayoutContext {
  const context = inject(LAYOUT_CONTEXT_KEY);
  if (!context) {
    throw new Error('useLayoutContext must be used within a BasicLayout component');
  }
  return context;
}

/**
 * 获取布局派生计算状态。
 *
 * @returns 布局计算状态 `ComputedRef`。
 * @throws 当未在 `BasicLayout` 组件上下文中调用时抛出错误。
 */
export function useLayoutComputed(): ComputedRef<LayoutComputed> {
  const computed = inject(LAYOUT_COMPUTED_KEY);
  if (!computed) {
    throw new Error('useLayoutComputed must be used within a BasicLayout component');
  }
  return computed;
}

/**
 * 获取布局 CSS 变量集合。
 *
 * @returns CSS 变量映射 `ComputedRef`。
 * @throws 当未在 `BasicLayout` 组件上下文中调用时抛出错误。
 */
export function useLayoutCSSVars(): ComputedRef<Record<string, string>> {
  const cssVars = inject(LAYOUT_CSS_VARS_KEY);
  if (!cssVars) {
    throw new Error('useLayoutCSSVars must be used within a BasicLayout component');
  }
  return cssVars;
}
