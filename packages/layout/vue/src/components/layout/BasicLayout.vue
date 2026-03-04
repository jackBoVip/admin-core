<script setup lang="ts">
/**
 * 基础布局组件
 * @description 开箱即用的管理后台布局，用户只需传入数据即可使用
 * 内置偏好设置功能，无需用户单独配置
 * 自动响应偏好设置变化（布局类型、主题等）
 */
import { computed, ref, shallowRef, watch, onUnmounted, onMounted, defineComponent, h, isRef, type PropType, type DefineComponent, type VNode } from 'vue';
import type { BasicLayoutProps, LayoutEvents, MenuItem, TabItem, BreadcrumbItem, NotificationItem } from '@admin-core/layout';
import { mapPreferencesToLayoutProps, logger, getCachedMenuPathIndex, getCachedFilteredMenus, resolveMenuNavigation, getCachedHeaderMenus, resolveHeaderActiveKey, LAYOUT_UI_TOKENS } from '@admin-core/layout';
import { createLayoutContext, useResponsive } from '../../composables';
import { 
  PreferencesProvider, 
  PreferencesDrawer,
  initPreferences,
  getPreferencesManager,
  usePreferencesContext,
  type PreferencesDrawerUIConfig,
} from '@admin-core/preferences-vue';
import LayoutHeader from './LayoutHeader.vue';
import LayoutSidebar from './LayoutSidebar.vue';
import LayoutTabbar from './LayoutTabbar.vue';
import LayoutContent from './LayoutContent.vue';
import LayoutFooter from './LayoutFooter.vue';
import LayoutPanel from './LayoutPanel.vue';
import LayoutOverlay from './LayoutOverlay.vue';
import LayoutProgress from './LayoutProgress.vue';
import HorizontalMenu from './HorizontalMenu.vue';
import { HeaderToolbar, Breadcrumb } from '../widgets';
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 空菜单常量
 * @description 作为菜单相关计算的空值兜底，避免重复创建数组实例。
 */
const EMPTY_MENUS: MenuItem[] = [];
/**
 * 空菜单索引缓存
 * @description 无菜单场景下复用的路径索引结果。
 */
const EMPTY_MENU_INDEX = getCachedMenuPathIndex(EMPTY_MENUS);

/**
 * 是否开发环境
 * @description 仅在开发环境输出偏好初始化失败等诊断日志。
 */
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
/**
 * 偏好管理器缓存
 * @description 缓存单例管理器，避免重复初始化。
 */
let preferencesManager: ReturnType<typeof getPreferencesManager> | null = null;

/**
 * 获取偏好设置管理器，若未初始化则尝试自动初始化。
 *
 * @returns 偏好设置管理器实例，初始化失败时返回 null。
 */
const resolvePreferencesManager = () => {
  if (preferencesManager) return preferencesManager;
  try {
    preferencesManager = getPreferencesManager();
  } catch {
    try {
      initPreferences({ namespace: 'admin-core' });
      preferencesManager = getPreferencesManager();
    } catch (initError) {
      if (isDev) {
        logger.warn('Failed to initialize preferences.', initError);
      }
    }
  }
  return preferencesManager;
};

resolvePreferencesManager();

/**
 * 偏好抽屉显示状态
 * @description 控制偏好设置抽屉开关。
 */
const showPreferencesDrawer = ref(false);
/**
 * 悬浮偏好按钮当前位置
 * @description 记录悬浮按钮吸附后的坐标。
 */
const floatingPosition = ref<{ x: number; y: number } | null>(null);
/**
 * 悬浮偏好按钮吸附边
 * @description 记录当前贴靠屏幕的边缘方向。
 */
const floatingEdge = ref<'left' | 'right' | 'top' | 'bottom' | null>(null);
/**
 * 悬浮偏好按钮拖拽状态
 * @description 标记当前是否处于拖拽中。
 */
const floatingDragging = ref(false);
/**
 * 悬浮偏好按钮位置存储键
 * @description 本地持久化悬浮按钮位置时使用的 key。
 */
const floatingStorageKey = 'admin-core:pref-fab-position';
/**
 * 悬浮按钮拖拽过程状态
 * @description 记录拖拽起点与初始坐标，用于计算位移。
 */
const floatingDragState = ref<{
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null>(null);
/**
 * 悬浮按钮是否已发生位移
 * @description 用于区分“点击”与“拖拽结束”手势。
 */
const floatingMoved = ref(false);
/**
 * 悬浮按钮节点引用
 * @description 用于定位、尺寸测量与事件绑定。
 */
const floatingButtonRef = ref<HTMLButtonElement | null>(null);

/**
 * 锁屏执行函数引用
 * @description 由偏好模块注入，供布局统一触发锁屏动作。
 */
const preferencesLock = ref<(() => void) | null>(null);

/**
 * 注入偏好设置锁屏执行器。
 *
 * @param lock 锁屏执行函数。
 */
const setPreferencesLock = (lock: () => void) => {
  preferencesLock.value = lock;
};

/**
 * 偏好锁屏桥接组件
 * @description 将 `PreferencesProvider` 内的锁屏方法抛出到布局层。
 */
const PreferencesLockBridge = defineComponent({
  name: 'PreferencesLockBridge',
  emits: ['ready'],
  /**
   * 锁屏桥接组件组合逻辑。
   *
   * @param _props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(_, { emit }) {
    const context = usePreferencesContext();
    onMounted(() => {
      emit('ready', context.lock);
    });
    return () => null;
  },
});

/**
 * 打开偏好设置抽屉。
 */
const openPreferences = () => {
  showPreferencesDrawer.value = true;
};

/**
 * 关闭偏好设置抽屉。
 */
const closePreferences = () => {
  showPreferencesDrawer.value = false;
};

/**
 * 基础布局组件入参
 * @description 融合布局配置与偏好按钮、语言等增强字段。
 */
const props = withDefaults(defineProps<BasicLayoutProps & {
  /** 当前语言 */
  locale?: 'zh-CN' | 'en-US';
  /** 自定义国际化消息 */
  customMessages?: Record<string, Record<string, unknown>>;
  /** 是否显示偏好设置按钮 */
  showPreferencesButton?: boolean;
  /** 偏好设置按钮位置 */
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  /** 偏好设置 UI 配置（控制显示/禁用） */
  preferencesUIConfig?: PreferencesDrawerUIConfig;
}>(), {
  showPreferencesButton: true,
  preferencesButtonPosition: 'auto',
});

/**
 * 偏好映射后的布局属性
 * @description 持有由偏好中心映射得到的布局配置快照。
 */
const preferencesProps = shallowRef<Partial<BasicLayoutProps>>({});
/**
 * 偏好订阅取消函数引用
 * @description 组件卸载时调用，释放偏好变更监听。
 */
const unsubscribeRef = ref<(() => void) | null>(null);

/**
 * 偏好更新计数器
 * @description 用于强制触发依赖重算，保证合并配置实时刷新。
 */
const updateCounter = ref(0);

/**
 * 从偏好设置中心拉取最新配置并同步到布局 props。
 */
const updatePreferencesProps = () => {
  const manager = resolvePreferencesManager();
  if (manager) {
    const prefs = manager.getPreferences();
    /** 创建新对象以确保响应式更新。 */
    preferencesProps.value = { ...mapPreferencesToLayoutProps(prefs) };
    /** 增加计数器以触发依赖重算。 */
    updateCounter.value++;
  }
};

updatePreferencesProps();

/**
 * 当前激活的偏好管理器
 * @description 用于注册偏好变更订阅。
 */
const activeManager = resolvePreferencesManager();
if (activeManager) {
  unsubscribeRef.value = activeManager.subscribe(() => {
    updatePreferencesProps();
  });
}

/**
 * 组件卸载时取消偏好订阅，避免内存泄漏。
 */
onUnmounted(() => {
  unsubscribeRef.value?.();
});

/**
 * 组件挂载后标记平台类型（用于滚动条样式兼容）。
 */
onMounted(() => {
  if (typeof document === 'undefined') return;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })?.userAgentData?.platform ||
    navigator.platform ||
    '';
  const isMac = platform.toLowerCase().includes('mac');
  const value = isMac ? 'macOs' : 'other';
  document.documentElement.setAttribute('data-platform', value);
  document.body?.setAttribute('data-platform', value);
});

/**
 * 合并后的布局入参
 * @description 以偏好配置为基底，用户显式传入字段具有更高优先级。
 */
const mergedProps = computed<BasicLayoutProps>(() => {
  /** 访问更新计数器，确保偏好变化时触发重算。 */
  void updateCounter.value;
  
  /** 用户显式传参优先，否则回退偏好配置。 */
  const result: BasicLayoutProps = {
    ...preferencesProps.value,
  };
  
  /** 仅在用户显式传入 `layout` 时才覆盖偏好布局。 */
  if (props.layout !== undefined) {
    result.layout = props.layout;
  }
  
  /** 合并其余用户传递属性。 */
  if (props.menus) result.menus = props.menus;
  if (props.router) result.router = props.router;
  if (props.userInfo) result.userInfo = props.userInfo;
  if (props.appName) result.appName = props.appName;
  if (props.locale !== undefined) result.locale = props.locale;
  if (props.isMobile !== undefined) result.isMobile = props.isMobile;
  if (props.header) result.header = { ...preferencesProps.value.header, ...props.header };
  if (props.sidebar) result.sidebar = { ...preferencesProps.value.sidebar, ...props.sidebar };
  if (props.tabbar) result.tabbar = { ...preferencesProps.value.tabbar, ...props.tabbar };
  if (props.footer) result.footer = { ...preferencesProps.value.footer, ...props.footer };
  if (props.logo) result.logo = { ...preferencesProps.value.logo, ...props.logo };
  if (props.theme) result.theme = { ...preferencesProps.value.theme, ...props.theme };
  if (props.preferencesButtonPosition) {
    result.preferencesButtonPosition = props.preferencesButtonPosition;
  }
  
  return result;
});

/**
 * 基础布局组件事件
 * @description 对外暴露菜单、标签、主题、偏好等交互事件。
 */
const emit = defineEmits<{
  (e: 'sidebar-collapse', collapsed: boolean): void;
  (e: 'menu-select', item: MenuItem, key: string): void;
  (e: 'tab-select', item: TabItem, key: string): void;
  (e: 'tab-close', item: TabItem, key: string): void;
  (e: 'tab-close-all'): void;
  (e: 'tab-close-other', exceptKey: string): void;
  (e: 'tab-refresh', item: TabItem, key: string): void;
  (e: 'tab-maximize', isMaximized: boolean): void;
  (e: 'breadcrumb-click', item: BreadcrumbItem, key: string): void;
  (e: 'user-menu-select', key: string): void;
  (e: 'notification-click', item: NotificationItem): void;
  (e: 'fullscreen-toggle', isFullscreen: boolean): void;
  (e: 'theme-toggle', theme: string): void;
  (e: 'locale-change', locale: string): void;
  (e: 'lock-screen'): void;
  (e: 'logout'): void;
  (e: 'panel-collapse', collapsed: boolean): void;
  (e: 'global-search', keyword: string): void;
  (e: 'refresh'): void;
  (e: 'tab-favorite-change', menu: MenuItem, favorited: boolean, keys: string[], menus: MenuItem[]): void;
  (e: 'favorites-change', menus: MenuItem[], keys: string[]): void;
  (e: 'preferences-open'): void;
  (e: 'preferences-close'): void;
}>();

/**
 * 响应式断点状态
 * @description 提供当前是否移动端的实时计算结果。
 */
const { isMobile } = useResponsive();

/**
 * 触发锁屏动作，优先使用偏好设置模块提供的锁屏实现。
 */
const handleLockScreen = () => {
  if (preferencesLock.value) {
    preferencesLock.value();
    return;
  }
  emit('lock-screen');
};

/**
 * 布局事件桥接对象
 * @description 将内部交互事件转发为外部事件，并同步偏好状态。
 */
const events: LayoutEvents = {
  onSidebarCollapse: (collapsed) => {
    /** 同步侧边栏折叠状态到偏好设置。 */
    resolvePreferencesManager()?.setPreferences({ sidebar: { collapsed } });
    emit('sidebar-collapse', collapsed);
  },
  onMenuSelect: (item, key) => emit('menu-select', item, key),
  onTabSelect: (item, key) => emit('tab-select', item, key),
  onTabClose: (item, key) => emit('tab-close', item, key),
  onTabCloseAll: () => emit('tab-close-all'),
  onTabCloseOther: (exceptKey) => emit('tab-close-other', exceptKey),
  onTabRefresh: (item, key) => emit('tab-refresh', item, key),
  onTabMaximize: (isMaximized) => emit('tab-maximize', isMaximized),
  onBreadcrumbClick: (item, key) => emit('breadcrumb-click', item, key),
  onUserMenuSelect: (key) => emit('user-menu-select', key),
  onNotificationClick: (item) => emit('notification-click', item),
  onFullscreenToggle: (isFullscreen) => emit('fullscreen-toggle', isFullscreen),
  onThemeToggle: (theme) => {
    /** 同步主题模式到偏好设置。 */
    resolvePreferencesManager()?.setPreferences({ theme: { mode: theme as 'light' | 'dark' } });
    emit('theme-toggle', theme);
  },
  onLocaleChange: (locale) => {
    /** 同步语言设置到偏好配置。 */
    resolvePreferencesManager()?.setPreferences({ app: { locale: locale as 'zh-CN' | 'en-US' } });
    emit('locale-change', locale);
  },
  onLockScreen: handleLockScreen,
  onLogout: () => emit('logout'),
  onPanelCollapse: (collapsed) => {
    /** 同步面板折叠状态到偏好设置。 */
    resolvePreferencesManager()?.setPreferences({ panel: { collapsed } });
    emit('panel-collapse', collapsed);
  },
  onGlobalSearch: (keyword) => emit('global-search', keyword),
  onRefresh: () => emit('refresh'),
  onTabFavoriteChange: (menu, favorited, keys, menus) => emit('tab-favorite-change', menu, favorited, keys, menus),
  onFavoritesChange: (menus, keys) => emit('favorites-change', menus, keys),
};

/**
 * 传入布局上下文的最终属性
 * @description 合并用户配置、偏好配置与移动端状态得到统一上下文属性。
 */
const contextProps = computed<BasicLayoutProps>(() => ({
  ...mergedProps.value,
  isMobile: props.isMobile ?? isMobile.value,
}));

/**
 * 偏好按钮最终位置策略
 * @description 按“显式传参 > 偏好配置 > auto”顺序解析。
 */
const resolvedPreferencesButtonPosition = computed(() => {
  return (
    props.preferencesButtonPosition ??
    contextProps.value.preferencesButtonPosition ??
    'auto'
  );
});

/**
 * 锁屏背景图最终值
 * @description 对空字符串做标准化处理，避免传递无效背景。
 */
const resolvedLockScreenBackground = computed(() => {
  const value = contextProps.value.lockScreen?.backgroundImage;
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
});

/**
 * 布局上下文能力集合
 * @description 包含上下文对象、派生状态、CSS 变量与布局状态容器。
 */
const { context, computed: layoutComputed, cssVars, state } = createLayoutContext(
  contextProps,
  events,
  { locale: contextProps.value.locale, customMessages: props.customMessages }
);

/**
 * 是否显示悬浮偏好按钮
 * @description 仅在全内容模式下显示悬浮入口。
 */
const showFloatingPreferencesButton = computed(() => {
  return props.showPreferencesButton !== false && layoutComputed.value.isFullContent;
});

/**
 * 是否显示固定偏好按钮
 * @description 在非全内容模式且位置策略为 `fixed` 时显示。
 */
const showFixedPreferencesButton = computed(() => {
  return (
    props.showPreferencesButton !== false &&
    resolvedPreferencesButtonPosition.value === 'fixed' &&
    !layoutComputed.value.isFullContent
  );
});

/**
 * 将数值限制在给定区间内。
 *
 * @param value 原始值。
 * @param min 最小值。
 * @param max 最大值。
 * @returns 裁剪后的数值。
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 获取悬浮按钮可拖拽活动边界。
 *
 * @returns 包含最小/最大 X、Y 的边界对象。
 */
const getFloatingBounds = () => {
  if (typeof window === 'undefined') {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  const rect = floatingButtonRef.value?.getBoundingClientRect();
  const width = rect?.width ?? 48;
  const height = rect?.height ?? 48;
  const inset = 8;
  return {
    minX: inset,
    minY: inset,
    maxX: Math.max(inset, window.innerWidth - width - inset),
    maxY: Math.max(inset, window.innerHeight - height - inset),
  };
};

/**
 * 计算悬浮按钮最近边缘吸附位置。
 *
 * @param pos 当前按钮坐标。
 * @returns 吸附后的坐标与边缘方向。
 */
const snapFloatingPosition = (pos: { x: number; y: number }) => {
  const bounds = getFloatingBounds();
  const x = clamp(pos.x, bounds.minX, bounds.maxX);
  const y = clamp(pos.y, bounds.minY, bounds.maxY);
  const distances = [
    { edge: 'left', value: x - bounds.minX },
    { edge: 'right', value: bounds.maxX - x },
    { edge: 'top', value: y - bounds.minY },
    { edge: 'bottom', value: bounds.maxY - y },
  ];
  distances.sort((a, b) => a.value - b.value);
  const nearest = distances[0]?.edge as 'left' | 'right' | 'top' | 'bottom' | undefined;
  if (nearest === 'left') return { x: bounds.minX, y, edge: 'left' as const };
  if (nearest === 'right') return { x: bounds.maxX, y, edge: 'right' as const };
  if (nearest === 'top') return { x, y: bounds.minY, edge: 'top' as const };
  return { x, y: bounds.maxY, edge: 'bottom' as const };
};

/**
 * 初始化悬浮按钮位置，优先读取本地缓存。
 */
const initFloatingPosition = () => {
  if (floatingPosition.value || typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem(floatingStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as { x?: number; y?: number; edge?: typeof floatingEdge.value };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const bounds = getFloatingBounds();
        floatingPosition.value = {
          x: clamp(parsed.x, bounds.minX, bounds.maxX),
          y: clamp(parsed.y, bounds.minY, bounds.maxY),
        };
        floatingEdge.value = parsed.edge ?? null;
        return;
      }
    }
  } catch {}
  const inset = LAYOUT_UI_TOKENS.FLOATING_BUTTON_INSET;
  const size = 48;
  floatingPosition.value = {
    x: window.innerWidth - size - inset,
    y: window.innerHeight - size - inset,
  };
};

/**
 * 监听悬浮按钮可见性并在显示时初始化位置与窗口监听。
 */
watch(showFloatingPreferencesButton, (visible, _, onCleanup) => {
  if (!visible) return;
  initFloatingPosition();
  if (typeof window === 'undefined') return;

  /**
   * 窗口尺寸变化时重新裁剪悬浮按钮位置。
   */
  const handleResize = () => {
    if (!floatingPosition.value) return;
    const bounds = getFloatingBounds();
    floatingPosition.value = {
      x: clamp(floatingPosition.value.x, bounds.minX, bounds.maxX),
      y: clamp(floatingPosition.value.y, bounds.minY, bounds.maxY),
    };
  };
  window.addEventListener('resize', handleResize);
  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });
}, { immediate: true });

/**
 * 监听悬浮按钮状态变化并持久化位置。
 * @description 仅在可见且存在坐标时写入本地存储。
 */
watch(
  [showFloatingPreferencesButton, floatingPosition, floatingEdge],
  ([visible, pos, edge]) => {
    if (!visible || !pos || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        floatingStorageKey,
        JSON.stringify({ x: pos.x, y: pos.y, edge })
      );
    } catch {}
  }
);

/**
 * 处理悬浮按钮拖拽移动事件。
 *
 * @param event 指针事件。
 */
const handleFloatingPointerMove = (event: PointerEvent) => {
  if (!floatingDragState.value) return;
  const { startX, startY, originX, originY } = floatingDragState.value;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (Math.abs(dx) + Math.abs(dy) > 3) {
    floatingMoved.value = true;
  }
  const bounds = getFloatingBounds();
  floatingPosition.value = {
    x: clamp(originX + dx, bounds.minX, bounds.maxX),
    y: clamp(originY + dy, bounds.minY, bounds.maxY),
  };
};

/**
 * 处理悬浮按钮拖拽结束事件，执行边缘吸附并清理监听。
 */
const handleFloatingPointerUp = () => {
  if (floatingPosition.value) {
    const snapped = snapFloatingPosition(floatingPosition.value);
    floatingPosition.value = { x: snapped.x, y: snapped.y };
    floatingEdge.value = snapped.edge;
  }
  floatingDragging.value = false;
  floatingDragState.value = null;
  window.removeEventListener('pointermove', handleFloatingPointerMove);
  window.removeEventListener('pointerup', handleFloatingPointerUp);
};

/**
 * 处理悬浮按钮按下事件，初始化拖拽状态。
 *
 * @param event 指针事件。
 */
const handleFloatingPointerDown = (event: PointerEvent) => {
  if (!showFloatingPreferencesButton.value) return;
  event.preventDefault();
  floatingEdge.value = null;
  floatingDragging.value = true;
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture?.(event.pointerId);
  floatingMoved.value = false;
  const rect = target.getBoundingClientRect();
  const originX = floatingPosition.value?.x ?? rect.left;
  const originY = floatingPosition.value?.y ?? rect.top;
  floatingDragState.value = {
    startX: event.clientX,
    startY: event.clientY,
    originX,
    originY,
  };
  window.addEventListener('pointermove', handleFloatingPointerMove);
  window.addEventListener('pointerup', handleFloatingPointerUp);
};

/**
 * 处理悬浮按钮点击，区分拖拽结束与真实点击。
 */
const handleFloatingClick = () => {
  if (floatingMoved.value) {
    floatingMoved.value = false;
    return;
  }
  openPreferences();
};

/**
 * 悬浮按钮内联样式
 * @description 根据当前位置计算 `left/top` 样式。
 */
const floatingButtonStyle = computed(() => {
  if (!floatingPosition.value) return undefined;
  return {
    left: `${floatingPosition.value.x}px`,
    top: `${floatingPosition.value.y}px`,
  };
});

/**
 * 组件卸载时移除悬浮按钮拖拽监听。
 */
onUnmounted(() => {
  window.removeEventListener('pointermove', handleFloatingPointerMove);
  window.removeEventListener('pointerup', handleFloatingPointerUp);
});



/**
 * 规范化路径输入值，兼容字符串与 `Ref<string>` 场景。
 *
 * @param value 原始路径值。
 * @returns 可用路径字符串；无法解析时返回空字符串。
 */
const normalizePath = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'value' in value) {
    const resolved = (value as { value?: unknown }).value;
    return typeof resolved === 'string' ? resolved : '';
  }
  return '';
};

/**
 * 当前路由路径
 * @description 优先读取路由对象路径，回退到 `currentPath` 入参。
 */
const currentPath = computed<string>(() => {
  const router = context.props.router;
  if (!router) {
    return normalizePath(context.props.currentPath) || '';
  }

  const routerPath = router.currentPath;
  if (isRef(routerPath)) {
    return normalizePath(routerPath.value);
  }
  return normalizePath(routerPath) || normalizePath(context.props.currentPath);
});

/**
 * 调用路由导航能力跳转到目标路径。
 *
 * @param path 目标路径。
 * @param options 跳转选项。
 */
const navigate = (
  path: string,
  options?: {
    replace?: boolean;
    params?: Record<string, string | number>;
    query?: Record<string, string | number>;
  }
) => {
  if (context.props.router?.navigate) {
    context.props.router.navigate(path, options);
  }
};

/**
 * 处理菜单项点击并执行内部/外部导航。
 *
 * @param menu 被点击菜单项。
 */
const handleMenuItemClick = (menu: MenuItem) => {
  const action = resolveMenuNavigation(menu, {
    autoActivateChild: context.props.sidebar?.autoActivateChild,
  });

  if (action.type === 'external' && action.url) {
    window.open(action.url, action.target ?? '_blank');
    return;
  }

  if (action.type === 'internal' && action.path) {
    navigate(action.path, {
      params: action.params,
      query: action.query,
    });
  }
};
/**
 * 菜单启动器开关状态
 * @description 控制顶部菜单启动器弹层显隐。
 */
const menuLauncherOpen = ref(false);

/**
 * 监听响应式移动端状态并同步到布局上下文。
 * @description 当未显式传入 `isMobile` 时由断点结果接管，并在移动端默认折叠侧栏。
 */
watch(isMobile, (value) => {
  if (props.isMobile === undefined) {
    context.props.isMobile = value;
    /** 移动端默认折叠侧边栏。 */
    if (value && !state.sidebarCollapsed) {
      state.sidebarCollapsed = true;
    }
  }
});

/**
 * 根节点样式
 * @description 注入布局上下文生成的 CSS 变量。
 */
const rootStyle = computed(() => ({
  ...cssVars.value,
}));

/**
 * 是否为 `header-sidebar-nav` 布局
 * @description 该布局下顶部菜单与侧栏菜单协同策略不同。
 */
const isHeaderSidebarNav = computed(() => layoutComputed.value.currentLayout === 'header-sidebar-nav');
/**
 * 当前菜单集合
 * @description 对菜单数据做空值兜底，保证后续计算稳定。
 */
const menus = computed(() =>
  contextProps.value.menus && contextProps.value.menus.length > 0
    ? contextProps.value.menus
    : EMPTY_MENUS
);

/**
 * 是否显示顶部菜单
 * @description 根据布局类型与 header-sidebar 特殊分支综合判断。
 */
const showHeaderMenu = computed(() => {
  return (layoutComputed.value.isHeaderNav ||
         layoutComputed.value.isMixedNav ||
         layoutComputed.value.isHeaderMixedNav) && !isHeaderSidebarNav.value;
});

/**
 * 菜单启动器是否启用
 * @description 在头部菜单布局且配置允许时启用启动器入口。
 */
const menuLauncherEnabled = computed(() => {
  const isHeaderMenuLayout =
    layoutComputed.value.isHeaderNav || layoutComputed.value.isMixedNav;
  return (
    isHeaderMenuLayout &&
    !layoutComputed.value.isHeaderMixedNav &&
    !!contextProps.value.header?.menuLauncher
  );
});

/**
 * 顶部导航菜单集合
 * @description 根据布局模式从全量菜单中派生顶部菜单数据。
 */
const headerMenus = shallowRef<MenuItem[]>([]);
/**
 * 监听布局模式与菜单变化，重建顶部菜单集合。
 */
watch(
  [menus, () => layoutComputed.value.currentLayout, () => showHeaderMenu.value],
  ([nextMenus, layout, visible]) => {
    if (!visible) {
      headerMenus.value = EMPTY_MENUS;
      return;
    }
    headerMenus.value = getCachedHeaderMenus(nextMenus, {
      isHeaderNav: layout === 'header-nav',
      isMixedNav: layout === 'mixed-nav',
      isHeaderMixedNav: layout === 'header-mixed-nav',
      isHeaderSidebarNav: layout === 'header-sidebar-nav',
    });
  },
  { immediate: true }
);

/**
 * 是否需要构建顶部菜单索引
 * @description 仅在顶部菜单或启动器相关场景中启用索引计算。
 */
const needHeaderMenuIndex = computed(() => {
  return (
    showHeaderMenu.value ||
    menuLauncherEnabled.value ||
    layoutComputed.value.isMixedNav ||
    layoutComputed.value.isHeaderMixedNav
  );
});
/**
 * 顶部菜单路径索引
 * @description 用于根据当前路径反查激活菜单项。
 */
const headerMenuIndex = computed(() =>
  needHeaderMenuIndex.value ? getCachedMenuPathIndex(menus.value) : EMPTY_MENU_INDEX
);

/**
 * 顶部菜单激活键
 * @description 综合当前路径、混合导航根键与菜单索引解析激活项。
 */
const headerActiveKey = computed(() => {
  const rawPath = typeof contextProps.value.router?.currentPath === 'object' 
    ? contextProps.value.router.currentPath.value 
    : contextProps.value.router?.currentPath;
  return resolveHeaderActiveKey({
    activeMenuKey: contextProps.value.activeMenuKey,
    currentPath: rawPath ? String(rawPath) : '',
    menuIndex: headerMenuIndex.value,
    mixedNavRootKey: state.mixedNavRootKey,
    isMixedNav: layoutComputed.value.isMixedNav,
    isHeaderMixedNav: layoutComputed.value.isHeaderMixedNav,
    isHeaderSidebarNav: isHeaderSidebarNav.value,
  });
});

/**
 * 处理顶部菜单选择，同步混合导航根菜单键。
 *
 * @param item 选中菜单项。
 * @param key 选中键。
 */
const handleHeaderMenuSelect = (item: MenuItem, key: string) => {
  if (!layoutComputed.value.isMixedNav && !layoutComputed.value.isHeaderMixedNav) return;
  const nextKey = item.key ?? item.path ?? key;
  if (!nextKey) return;
  if (context.state.mixedNavRootKey !== String(nextKey)) {
    context.state.mixedNavRootKey = String(nextKey);
  }
};

/**
 * 菜单启动器标题文案
 * @description 由国际化词条 `layout.header.menuLauncher` 提供。
 */
const menuLauncherLabel = computed(() => {
  return context.t('layout.header.menuLauncher');
});

/**
 * 偏好按钮标题文案
 * @description 由国际化词条 `layout.widgetLegacy.preferences.title` 提供。
 */
const preferencesTitle = computed(() => {
  return context.t('layout.widgetLegacy.preferences.title');
});

/**
 * 启动器菜单列表
 * @description 启动器打开时返回过滤后的菜单，否则返回空集合。
 */
const launcherMenus = computed(() => {
  if (!menuLauncherEnabled.value || !menuLauncherOpen.value) return EMPTY_MENUS;
  return getCachedFilteredMenus(menus.value);
});

/**
 * 关闭菜单启动器弹层。
 */
const closeMenuLauncher = () => {
  menuLauncherOpen.value = false;
};

/**
 * 切换菜单启动器弹层开关。
 */
const toggleMenuLauncher = () => {
  menuLauncherOpen.value = !menuLauncherOpen.value;
};

/**
 * 监听启动器能力开关，禁用时自动关闭弹层。
 */
watch(menuLauncherEnabled, (enabled) => {
  if (!enabled) {
    menuLauncherOpen.value = false;
  }
});

/**
 * 监听路由变化，路径切换后关闭启动器弹层。
 */
watch(currentPath, () => {
  if (menuLauncherOpen.value) {
    menuLauncherOpen.value = false;
  }
});

/**
 * 处理启动器菜单项点击并同步混合导航根键。
 *
 * @param item 被点击菜单项。
 */
const handleLauncherItemClick = (item: MenuItem) => {
  if (item.disabled) return;
  handleMenuItemClick(item);
  const rawKey = item.key ?? item.path ?? '';
  if (rawKey !== '') {
    context.events?.onMenuSelect?.(item, String(rawKey));
  }
  if (layoutComputed.value.isMixedNav || layoutComputed.value.isHeaderMixedNav) {
    const chain =
      (item.key ? headerMenuIndex.value.chainByKey.get(item.key) : undefined) ??
      (item.path ? headerMenuIndex.value.chainByPath.get(item.path) : undefined) ??
      [];
    const rootKey = chain.length > 0 ? chain[0] : rawKey;
    if (rootKey) {
      context.state.mixedNavRootKey = String(rootKey);
    }
  }
  menuLauncherOpen.value = false;
};

/**
 * 启动器菜单列表组件属性定义。
 */
interface LauncherMenuListProps {
  /** 当前层级的菜单项列表。 */
  items?: MenuItem[];
  /** 当前递归深度（根层为 0）。 */
  depth?: number;
  /** 当前激活菜单键。 */
  activeKey?: string;
  /** 菜单项点击回调。 */
  onItemClick: (item: MenuItem) => void;
}

/**
 * 启动器菜单递归列表组件
 * @description 负责渲染多级菜单结构并处理子项点击透传。
 */
const LauncherMenuList: DefineComponent<LauncherMenuListProps> = defineComponent({
  name: 'LauncherMenuList',
  props: {
    items: {
      type: Array as PropType<MenuItem[]>,
      default: () => [],
    },
    depth: {
      type: Number,
      default: 0,
    },
    activeKey: {
      type: String,
      default: '',
    },
    onItemClick: {
      type: Function as PropType<(item: MenuItem) => void>,
      required: true,
    },
  },
  /**
   * 启动器菜单列表组件组合逻辑。
   *
   * @param props 组件属性。
   * @returns 渲染函数。
   */
  setup(props: LauncherMenuListProps) {
    return (): VNode => {
      const depth = props.depth ?? 0;
      const listClass =
        depth > 0 ? 'layout-header__launcher-sublist' : 'layout-header__launcher-list';
      const items = props.items ?? [];
      const children = items
        .filter((item) => !item.hidden)
        .map((item) => {
          const key = String(item.key ?? item.path ?? item.name ?? '');
          const isActive = key !== '' && key === props.activeKey;
          return h(
            'li',
            {
              key,
              class: ['layout-header__launcher-item', item.disabled ? 'is-disabled' : ''],
              'data-active': isActive ? 'true' : undefined,
              'data-disabled': item.disabled ? 'true' : undefined,
            },
            [
              h(
                'button',
                {
                  type: 'button',
                  class: 'layout-header__launcher-item-btn',
                  onClick: () => props.onItemClick(item),
                  disabled: item.disabled,
                  'data-active': isActive ? 'true' : undefined,
                },
                [
                  item.icon
                    ? h('span', { class: 'layout-header__launcher-icon' }, item.icon)
                    : null,
                  h('span', { class: 'layout-header__launcher-text' }, item.name),
                ]
              ),
              item.children?.length
                ? h(LauncherMenuList, {
                    items: item.children,
                    depth: depth + 1,
                    activeKey: props.activeKey,
                    onItemClick: props.onItemClick,
                  })
                : null,
            ]
          );
        });

      return h('ul', { class: listClass, 'data-depth': depth }, children as VNode[]);
    };
  },
});

/**
 * 顶部菜单对齐方式
 * @description 默认回退为 `start`。
 */
const headerMenuAlign = computed(() => {
  return contextProps.value.header?.menuAlign || 'start';
});

/**
 * 顶部菜单主题
 * @description 由布局派生状态计算得到。
 */
const headerMenuTheme = computed(() => {
  return layoutComputed.value.headerTheme;
});

/**
 * 根节点类名集合
 * @description 包含布局类型与移动端、折叠等状态类。
 */
const rootClass = computed(() => [
  'layout-container',
  `layout-${layoutComputed.value.currentLayout}`,
  {
    'layout-mobile': props.isMobile ?? isMobile.value,
    'layout-sidebar-collapsed': state.sidebarCollapsed,
    'layout-header-hidden': state.headerHidden,
    'layout-panel-collapsed': state.panelCollapsed,
  },
]);

/**
 * 向父组件暴露布局控制方法与运行时状态。
 */
defineExpose({
  toggleSidebar: context.toggleSidebarCollapse,
  togglePanel: context.togglePanelCollapse,
  openPreferences,
  closePreferences,
  state,
  layoutComputed,
});
</script>

<template>
  <PreferencesProvider
    :show-trigger="false"
    :ui-config="props.preferencesUIConfig"
    :avatar="contextProps.userInfo?.avatar"
    :username="contextProps.userInfo?.displayName || contextProps.userInfo?.username"
    :lock-screen-background="resolvedLockScreenBackground"
    @lock="emit('lock-screen')"
    @logout="emit('logout')"
    @search="emit('global-search', '')"
  >
    <PreferencesLockBridge @ready="setPreferencesLock" />
    <div :class="rootClass" :style="rootStyle">
      <LayoutProgress />
      <!-- 侧边栏 -->
      <LayoutSidebar v-if="layoutComputed.showSidebar">
      <template #logo>
        <slot name="sidebar-logo" />
      </template>
      <template #menu>
        <slot name="sidebar-menu" />
      </template>
      <template #mixed-menu>
        <slot name="sidebar-mixed-menu" />
      </template>
      <template #extra>
        <slot name="sidebar-extra" />
      </template>
      <template #footer>
        <slot name="sidebar-footer" />
      </template>
    </LayoutSidebar>

    <!-- 顶栏 -->
    <LayoutHeader v-if="layoutComputed.showHeader">
      <template #logo>
        <slot name="header-logo" />
      </template>
      <template #left>
        <slot name="header-left">
          <!-- 默认面包屑 -->
          <Breadcrumb 
            v-if="layoutComputed.showBreadcrumb"
            :show-icon="context.props.breadcrumb?.showIcon"
            :show-home="context.props.breadcrumb?.showHome"
          />
        </slot>
      </template>
      <template #center>
        <slot name="header-center" />
      </template>
      <template #menu>
        <slot name="header-menu">
          <!-- 菜单启动器模式 -->
          <div v-if="menuLauncherEnabled" class="layout-header__menu-launcher">
            <button
              type="button"
              class="layout-header__launcher-btn"
              :aria-expanded="menuLauncherOpen"
              :aria-label="menuLauncherLabel"
              @click="toggleMenuLauncher"
            >
              <LayoutIcon name="menu-launcher" size="sm" />
              <span>{{ menuLauncherLabel }}</span>
            </button>
          </div>

          <!-- 默认水平菜单（顶部导航模式） -->
          <HorizontalMenu 
            v-else-if="showHeaderMenu && headerMenus.length > 0"
            :menus="headerMenus"
            :active-key="headerActiveKey"
            :align="headerMenuAlign"
            :theme="headerMenuTheme"
            @select="handleHeaderMenuSelect"
          />
        </slot>
      </template>
      <template #right>
        <slot name="header-right" />
      </template>
      <template #actions>
        <slot name="header-actions">
          <!-- 默认顶栏工具栏 -->
          <HeaderToolbar
            :show-preferences-button="showPreferencesButton"
            :preferences-button-position="resolvedPreferencesButtonPosition"
            :on-open-preferences="openPreferences"
          >
            <template v-if="$slots['header-user']" #user>
              <slot name="header-user" />
            </template>
            <template v-if="$slots['user-dropdown-menu']" #user-menu>
              <slot name="user-dropdown-menu" />
            </template>
          </HeaderToolbar>
        </slot>
      </template>
      <template #extra>
        <slot name="header-extra" />
      </template>
    </LayoutHeader>

    <div
      v-if="menuLauncherEnabled && menuLauncherOpen"
      class="layout-header__launcher-overlay"
      role="dialog"
      aria-modal="true"
      @click="closeMenuLauncher"
    >
      <div class="layout-header__launcher-panel" @click.stop>
        <div v-if="launcherMenus.length > 0" class="layout-header__launcher-grid">
          <div
            v-for="menu in launcherMenus"
            :key="String(menu.key ?? menu.path ?? menu.name ?? '')"
            class="layout-header__launcher-group"
          >
            <button
              type="button"
              :class="[
                'layout-header__launcher-title',
                menu.children?.length ? 'layout-header__launcher-title--group' : 'is-single',
              ]"
              :disabled="menu.disabled"
              :data-active="String(menu.key ?? menu.path ?? '') === String(headerActiveKey || '') ? 'true' : undefined"
              @click="handleLauncherItemClick(menu)"
            >
              <span v-if="menu.icon" class="layout-header__launcher-icon">{{ menu.icon }}</span>
              <span class="layout-header__launcher-text">{{ menu.name }}</span>
            </button>
            <LauncherMenuList
              v-if="menu.children?.length"
              :items="menu.children"
              :depth="0"
              :active-key="String(headerActiveKey || '')"
              :on-item-click="handleLauncherItemClick"
            />
          </div>
        </div>
        <div v-else class="layout-header__launcher-empty">
          {{ context.t('layout.common.noData') }}
        </div>
      </div>
    </div>

    <!-- 标签栏 -->
    <LayoutTabbar v-if="layoutComputed.showTabbar">
      <template #left>
        <slot name="tabbar-left" />
      </template>
      <template #default>
        <slot name="tabbar" />
      </template>
      <template #right>
        <slot name="tabbar-right" />
      </template>
      <template #extra>
        <slot name="tabbar-extra" />
      </template>
    </LayoutTabbar>

    <!-- 主内容区 -->
    <LayoutContent>
      <template #header>
        <slot name="content-header" />
      </template>
      <template #breadcrumb>
        <slot name="breadcrumb" />
      </template>
      <template #default>
        <slot name="content">
          <slot />
        </slot>
      </template>
      <template #footer>
        <slot name="content-footer" />
      </template>
      <template #overlay>
        <slot name="content-overlay" />
      </template>
    </LayoutContent>

    <!-- 页脚 -->
    <LayoutFooter v-if="layoutComputed.showFooter">
      <template #left>
        <slot name="footer-left" />
      </template>
      <template #center>
        <slot name="footer-center" />
      </template>
      <template #right>
        <slot name="footer-right" />
      </template>
    </LayoutFooter>

    <!-- 功能区 -->
    <LayoutPanel v-if="layoutComputed.showPanel">
      <template #header>
        <slot name="panel-header" />
      </template>
      <template #default>
        <slot name="panel" />
      </template>
      <template #footer>
        <slot name="panel-footer" />
      </template>
    </LayoutPanel>

      <!-- 遮罩层（移动端） -->
      <LayoutOverlay />

      <!-- 额外内容插槽 -->
      <slot name="extra" />
      
      <!-- 内置偏好设置按钮（固定位置） -->
      <button
        v-if="showFixedPreferencesButton"
        class="layout-preferences-button"
        :title="preferencesTitle"
        @click="openPreferences"
      >
        <slot name="preferences-button-icon">
          <LayoutIcon name="settings" size="md" />
        </slot>
      </button>

      <!-- 全屏内容布局：可拖拽的偏好设置按钮 -->
      <button
        v-if="showFloatingPreferencesButton"
        ref="floatingButtonRef"
        :class="['layout-preferences-button', 'layout-preferences-button--floating', floatingDragging ? 'layout-preferences-button--dragging' : '']"
        :title="preferencesTitle"
        :style="floatingButtonStyle"
        :data-edge="floatingEdge || undefined"
        @pointerdown="handleFloatingPointerDown"
        @click="handleFloatingClick"
      >
        <slot name="preferences-button-icon">
          <LayoutIcon name="settings" size="md" />
        </slot>
      </button>
    </div>

    <!-- 偏好设置抽屉（内置） -->
    <PreferencesDrawer 
      v-model:open="showPreferencesDrawer"
      :ui-config="props.preferencesUIConfig"
      @close="closePreferences(); emit('preferences-close')"
    />
  </PreferencesProvider>
</template>
