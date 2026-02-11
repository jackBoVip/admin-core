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
  const initialLocale =
    (initialProps.locale as SupportedLocale | undefined) ??
    options?.locale ??
    'zh-CN';
  
  // 创建响应式状态（从 props 中读取初始值）
  const state = reactive<LayoutState>(getInitialLayoutState(initialProps));

  // 创建国际化实例
  const i18n = createI18n(initialLocale, options?.customMessages);
  const localeRef = ref<SupportedLocale>(initialLocale);

  const syncLocale = (nextLocale?: SupportedLocale) => {
    if (!nextLocale) return;
    if (localeRef.value !== nextLocale) {
      localeRef.value = nextLocale;
    }
    if (i18n.getLocale() !== nextLocale) {
      i18n.setLocale(nextLocale);
    }
  };

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
  const propsSyncController = createLayoutPropsStateSyncController({
    getState: () => state,
    setState: (patch) => {
      applyStatePatchMutable(state, patch);
    },
    onSidebarCollapse: (collapsed) => {
      events.onSidebarCollapse?.(collapsed);
    },
  });

  // 切换侧边栏折叠
  const toggleSidebarCollapse = () => {
    contextActionsController.toggleSidebarCollapse();
  };

  // 切换功能区折叠
  const togglePanelCollapse = () => {
    contextActionsController.togglePanelCollapse();
  };

  // 设置展开的菜单
  const setOpenMenuKeys = (keys: string[]) => {
    contextActionsController.setOpenMenuKeys(keys);
  };

  // 创建响应式 props 代理
  const reactiveProps = reactive<BasicLayoutProps>({} as BasicLayoutProps);
  
  // 创建响应式上下文（整个 context 都是响应式的）
  const context = reactive<LayoutContext>({
    props: reactiveProps,
    state,
    events,
    t: (key, params) => {
      // Touch localeRef to keep translations reactive in templates.
      void localeRef.value;
      return i18n.t(key, params);
    },
    toggleSidebarCollapse,
    togglePanelCollapse,
    setOpenMenuKeys,
  });

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

  // 监听并同步 props 变化（基于 mergedProps 的新引用触发，避免 deep watch 的深层遍历开销）
  watch(
    mergedProps,
    (newProps) => {
      syncTopLevelProps(newProps);
      propsSyncController.syncProps(newProps);
    },
    { immediate: true }
  );

  // 监听 locale 变化并更新 i18n
  watch(
    () => mergedProps.value.locale,
    (nextLocale) => {
      syncLocale(nextLocale as SupportedLocale | undefined);
    },
    { immediate: true }
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
