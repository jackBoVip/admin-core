<script setup lang="ts">
/**
 * 基础布局组件
 * @description 开箱即用的管理后台布局，用户只需传入数据即可使用
 * 内置偏好设置功能，无需用户单独配置
 * 自动响应偏好设置变化（布局类型、主题等）
 */
import { computed, ref, shallowRef, watch, onUnmounted, onMounted, defineComponent, h, isRef, type PropType, type DefineComponent, type VNode } from 'vue';
import type { BasicLayoutProps, LayoutEvents, MenuItem, TabItem, BreadcrumbItem, NotificationItem } from '@admin-core/layout';
import { mapPreferencesToLayoutProps, logger, buildMenuPathIndex, filterHiddenMenus, resolveMenuNavigation } from '@admin-core/layout';
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

// 自动初始化偏好设置（如果尚未初始化）
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
let preferencesManager: ReturnType<typeof getPreferencesManager> | null = null;
try {
  preferencesManager = getPreferencesManager();
} catch (error) {
  try {
    initPreferences({ namespace: 'admin-core' });
    preferencesManager = getPreferencesManager();
  } catch (initError) {
    if (isDev) {
      logger.warn('Failed to initialize preferences.', initError);
    }
  }
}

// 偏好设置抽屉状态
const showPreferencesDrawer = ref(false);
const floatingPosition = ref<{ x: number; y: number } | null>(null);
const floatingEdge = ref<'left' | 'right' | 'top' | 'bottom' | null>(null);
const floatingDragging = ref(false);
const floatingStorageKey = 'admin-core:pref-fab-position';
const floatingDragState = ref<{
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null>(null);
const floatingMoved = ref(false);
const floatingButtonRef = ref<HTMLButtonElement | null>(null);

const preferencesLock = ref<(() => void) | null>(null);
const setPreferencesLock = (lock: () => void) => {
  preferencesLock.value = lock;
};

const PreferencesLockBridge = defineComponent({
  name: 'PreferencesLockBridge',
  emits: ['ready'],
  setup(_, { emit }) {
    const context = usePreferencesContext();
    onMounted(() => {
      emit('ready', context.lock);
    });
    return () => null;
  },
});

// 打开偏好设置
const openPreferences = () => {
  showPreferencesDrawer.value = true;
};

// 关闭偏好设置
const closePreferences = () => {
  showPreferencesDrawer.value = false;
};

// Props 定义
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

// 从偏好设置获取配置（使用 shallowRef 确保整个对象替换时触发更新）
const preferencesProps = shallowRef<Partial<BasicLayoutProps>>({});
const unsubscribeRef = ref<(() => void) | null>(null);

// 用于强制更新的计数器
const updateCounter = ref(0);

// 更新偏好设置配置
const updatePreferencesProps = () => {
  if (preferencesManager) {
    const prefs = preferencesManager.getPreferences();
    // 创建新对象确保响应式更新
    preferencesProps.value = { ...mapPreferencesToLayoutProps(prefs) };
    // 强制增加计数器触发依赖更新
    updateCounter.value++;
  }
};

// 初始化
updatePreferencesProps();

// 订阅偏好设置变化
if (preferencesManager) {
  unsubscribeRef.value = preferencesManager.subscribe(() => {
    updatePreferencesProps();
  });
}

// 组件卸载时取消订阅
onUnmounted(() => {
  unsubscribeRef.value?.();
});

// 标记平台类型（用于滚动条样式兼容）
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

// 合并后的配置（preferences 为底，用户 props 优先）
const mergedProps = computed<BasicLayoutProps>(() => {
  // 访问 updateCounter 确保 preferences 变化时重新计算
  void updateCounter.value;
  
  // 用户明确传递的 props 优先，否则使用 preferences 的值
  const result: BasicLayoutProps = {
    ...preferencesProps.value,
  };
  
  // 只有用户明确传递了 layout 时才覆盖
  if (props.layout !== undefined) {
    result.layout = props.layout;
  }
  
  // 合并其他用户传递的属性
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

// 事件定义
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
  (e: 'preferences-open'): void;
  (e: 'preferences-close'): void;
}>();

// 响应式
const { isMobile } = useResponsive();

// 构建事件对象（同步偏好设置）
const handleLockScreen = () => {
  if (preferencesLock.value) {
    preferencesLock.value();
    return;
  }
  emit('lock-screen');
};

const events: LayoutEvents = {
  onSidebarCollapse: (collapsed) => {
    // 同步更新偏好设置
    preferencesManager?.setPreferences({ sidebar: { collapsed } });
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
    // 同步更新偏好设置
    preferencesManager?.setPreferences({ theme: { mode: theme as 'light' | 'dark' } });
    emit('theme-toggle', theme);
  },
  onLocaleChange: (locale) => {
    // 同步更新偏好设置
    preferencesManager?.setPreferences({ app: { locale: locale as 'zh-CN' | 'en-US' } });
    emit('locale-change', locale);
  },
  onLockScreen: handleLockScreen,
  onLogout: () => emit('logout'),
  onPanelCollapse: (collapsed) => {
    // 同步更新偏好设置
    preferencesManager?.setPreferences({ panel: { collapsed } });
    emit('panel-collapse', collapsed);
  },
  onGlobalSearch: (keyword) => emit('global-search', keyword),
  onRefresh: () => emit('refresh'),
};

// 最终传递给布局上下文的 props（直接使用 computed 确保响应式）
const contextProps = computed<BasicLayoutProps>(() => ({
  ...mergedProps.value,
  isMobile: props.isMobile ?? isMobile.value,
}));

const resolvedPreferencesButtonPosition = computed(() => {
  return (
    props.preferencesButtonPosition ??
    contextProps.value.preferencesButtonPosition ??
    'auto'
  );
});

const resolvedLockScreenBackground = computed(() => {
  const value = contextProps.value.lockScreen?.backgroundImage;
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
});

// 创建布局上下文（传入 ComputedRef 实现响应式）
const { context, computed: layoutComputed, cssVars, state } = createLayoutContext(
  contextProps,
  events,
  { locale: contextProps.value.locale, customMessages: props.customMessages }
);

const showFloatingPreferencesButton = computed(() => {
  return props.showPreferencesButton !== false && layoutComputed.value.isFullContent;
});

const showFixedPreferencesButton = computed(() => {
  return (
    props.showPreferencesButton !== false &&
    resolvedPreferencesButtonPosition.value === 'fixed' &&
    !layoutComputed.value.isFullContent
  );
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
  const inset = 24;
  const size = 48;
  floatingPosition.value = {
    x: window.innerWidth - size - inset,
    y: window.innerHeight - size - inset,
  };
};

watch(showFloatingPreferencesButton, (visible, _, onCleanup) => {
  if (!visible) return;
  initFloatingPosition();
  if (typeof window === 'undefined') return;
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

const handleFloatingClick = () => {
  if (floatingMoved.value) {
    floatingMoved.value = false;
    return;
  }
  openPreferences();
};

const floatingButtonStyle = computed(() => {
  if (!floatingPosition.value) return undefined;
  return {
    left: `${floatingPosition.value.x}px`,
    top: `${floatingPosition.value.y}px`,
  };
});

onUnmounted(() => {
  window.removeEventListener('pointermove', handleFloatingPointerMove);
  window.removeEventListener('pointerup', handleFloatingPointerUp);
});



const normalizePath = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'value' in value) {
    const resolved = (value as { value?: unknown }).value;
    return typeof resolved === 'string' ? resolved : '';
  }
  return '';
};

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
const menuLauncherOpen = ref(false);

// 监听移动端状态变化
watch(isMobile, (value) => {
  if (props.isMobile === undefined) {
    context.props.isMobile = value;
    // 移动端默认折叠侧边栏
    if (value && !state.sidebarCollapsed) {
      state.sidebarCollapsed = true;
    }
  }
});

// 计算根元素样式
const rootStyle = computed(() => ({
  ...cssVars.value,
}));

const isHeaderSidebarNav = computed(() => layoutComputed.value.currentLayout === 'header-sidebar-nav');

// 顶部导航菜单数据（用于 header-nav、mixed-nav、header-mixed-nav 模式）
const headerMenus = shallowRef<MenuItem[]>([]);
watch(
  [() => contextProps.value.menus, () => layoutComputed.value.currentLayout],
  ([menus, layout]) => {
    if (!menus || layout === 'header-sidebar-nav') {
      headerMenus.value = [];
      return;
    }
    if (layout === 'header-nav') {
      headerMenus.value = menus;
      return;
    }
    if (layout === 'mixed-nav' || layout === 'header-mixed-nav') {
      headerMenus.value = menus.map(item => ({
        ...item,
        children: undefined,
      }));
      return;
    }
    headerMenus.value = [];
  },
  { immediate: true }
);

const headerMenuIndex = computed(() => buildMenuPathIndex(contextProps.value.menus || []));

// 顶部菜单激活的 key
const headerActiveKey = computed(() => {
  if (isHeaderSidebarNav.value) return '';
  if ((layoutComputed.value.isMixedNav || layoutComputed.value.isHeaderMixedNav) && state.mixedNavRootKey) {
    return state.mixedNavRootKey;
  }
  const rawPath = typeof contextProps.value.router?.currentPath === 'object' 
    ? contextProps.value.router.currentPath.value 
    : contextProps.value.router?.currentPath;
  const path = rawPath ? String(rawPath).split('?')[0] : '';
  
  if (!path) return '';
  const index = headerMenuIndex.value;
  let menu =
    index.byPath.get(path) ??
    index.byKey.get(path);
  if (!menu) {
    for (const item of index.pathItems) {
      if (item.path && path.startsWith(item.path)) {
        menu = item;
        break;
      }
    }
  }
  if (!menu) return '';
  const chain =
    (menu.key ? index.chainByKey.get(menu.key) : undefined) ??
    (menu.path ? index.chainByPath.get(menu.path) : undefined) ??
    [];
  if (layoutComputed.value.isMixedNav || layoutComputed.value.isHeaderMixedNav) {
    return chain[0] || '';
  }
  return menu.key || '';
});

const handleHeaderMenuSelect = (item: MenuItem, key: string) => {
  if (!layoutComputed.value.isMixedNav && !layoutComputed.value.isHeaderMixedNav) return;
  const nextKey = item.key ?? item.path ?? key;
  if (!nextKey) return;
  if (context.state.mixedNavRootKey !== String(nextKey)) {
    context.state.mixedNavRootKey = String(nextKey);
  }
};

// 是否显示顶部菜单
const showHeaderMenu = computed(() => {
  return (layoutComputed.value.isHeaderNav ||
         layoutComputed.value.isMixedNav ||
         layoutComputed.value.isHeaderMixedNav) && !isHeaderSidebarNav.value;
});

const menuLauncherEnabled = computed(() => {
  const isHeaderMenuLayout =
    layoutComputed.value.isHeaderNav || layoutComputed.value.isMixedNav;
  return (
    isHeaderMenuLayout &&
    !layoutComputed.value.isHeaderMixedNav &&
    !!contextProps.value.header?.menuLauncher
  );
});

const menuLauncherLabel = computed(() => {
  return context.t('layout.header.menuLauncher');
});

const preferencesTitle = computed(() => {
  return context.t('layout.widgetLegacy.preferences.title');
});

const launcherMenus = computed(() => {
  return filterHiddenMenus(contextProps.value.menus || []);
});

const closeMenuLauncher = () => {
  menuLauncherOpen.value = false;
};

const toggleMenuLauncher = () => {
  menuLauncherOpen.value = !menuLauncherOpen.value;
};

watch(menuLauncherEnabled, (enabled) => {
  if (!enabled) {
    menuLauncherOpen.value = false;
  }
});

watch(currentPath, () => {
  if (menuLauncherOpen.value) {
    menuLauncherOpen.value = false;
  }
});

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

interface LauncherMenuListProps {
  items?: MenuItem[];
  depth?: number;
  activeKey?: string;
  onItemClick: (item: MenuItem) => void;
}

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

// 顶部菜单对齐方式
const headerMenuAlign = computed(() => {
  return contextProps.value.header?.menuAlign || 'start';
});

// 顶部菜单主题
const headerMenuTheme = computed(() => {
  return layoutComputed.value.headerTheme;
});

// 计算根元素类名
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

// 暴露方法
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
