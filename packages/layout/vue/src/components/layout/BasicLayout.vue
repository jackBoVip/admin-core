<script setup lang="ts">
/**
 * 基础布局组件
 * @description 开箱即用的管理后台布局，用户只需传入数据即可使用
 * 内置偏好设置功能，无需用户单独配置
 * 自动响应偏好设置变化（布局类型、主题等）
 */
import { computed, ref, shallowRef, watch, onUnmounted } from 'vue';
import type { BasicLayoutProps, LayoutEvents, MenuItem, TabItem, BreadcrumbItem, NotificationItem } from '@admin-core/layout';
import { mapPreferencesToLayoutProps, logger } from '@admin-core/layout';
import { createLayoutContext, useResponsive } from '../../composables';
import { 
  PreferencesProvider, 
  PreferencesDrawer,
  initPreferences,
  getPreferencesManager,
} from '@admin-core/preferences-vue';
import LayoutHeader from './LayoutHeader.vue';
import LayoutSidebar from './LayoutSidebar.vue';
import LayoutTabbar from './LayoutTabbar.vue';
import LayoutContent from './LayoutContent.vue';
import LayoutFooter from './LayoutFooter.vue';
import LayoutPanel from './LayoutPanel.vue';
import LayoutOverlay from './LayoutOverlay.vue';
import HorizontalMenu from './HorizontalMenu.vue';
import { HeaderToolbar, Breadcrumb } from '../widgets';

function buildMenuPathIndex(menus: MenuItem[]) {
  const byKey = new Map<string, MenuItem>();
  const byPath = new Map<string, MenuItem>();
  const chainByKey = new Map<string, string[]>();
  const chainByPath = new Map<string, string[]>();
  const pathItems: MenuItem[] = [];
  const stack: string[] = [];

  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.key) {
        byKey.set(item.key, item);
      }
      if (item.path) {
        byPath.set(item.path, item);
        pathItems.push(item);
      }
      const chain = item.key ? [...stack, item.key] : [...stack];
      if (item.key) {
        chainByKey.set(item.key, chain);
      }
      if (item.path) {
        chainByPath.set(item.path, chain);
      }
      if (item.key) {
        stack.push(item.key);
      }
      if (item.children?.length) {
        walk(item.children);
      }
      if (item.key) {
        stack.pop();
      }
    }
  };

  walk(menus);
  pathItems.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
  return { byKey, byPath, chainByKey, chainByPath, pathItems };
}

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
}>(), {
  locale: 'zh-CN',
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
  onThemeToggle: (theme) => emit('theme-toggle', theme),
  onLocaleChange: (locale) => emit('locale-change', locale),
  onLockScreen: () => emit('lock-screen'),
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

// 创建布局上下文（传入 ComputedRef 实现响应式）
const { context, computed: layoutComputed, cssVars, state } = createLayoutContext(
  contextProps,
  events,
  { locale: props.locale, customMessages: props.customMessages }
);

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

// 顶部导航菜单数据（用于 header-nav、mixed-nav、header-mixed-nav 模式）
const headerMenus = computed(() => {
  if (!contextProps.value.menus) return [];
  
  // header-nav 模式：显示完整菜单树
  if (layoutComputed.value.isHeaderNav) {
    return contextProps.value.menus;
  }
  
  // mixed-nav 模式：只显示一级菜单（子菜单在侧边栏显示）
  if (layoutComputed.value.isMixedNav || layoutComputed.value.isHeaderMixedNav) {
    return contextProps.value.menus.map(item => ({
      ...item,
      children: [], // 移除子菜单，只在顶部显示一级
    }));
  }
  
  return [];
});

const headerMenuIndex = computed(() => buildMenuPathIndex(contextProps.value.menus || []));

// 顶部菜单激活的 key
const headerActiveKey = computed(() => {
  const path = typeof contextProps.value.router?.currentPath === 'object' 
    ? contextProps.value.router.currentPath.value 
    : contextProps.value.router?.currentPath;
  
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

// 是否显示顶部菜单
const showHeaderMenu = computed(() => {
  return layoutComputed.value.isHeaderNav || 
         layoutComputed.value.isMixedNav || 
         layoutComputed.value.isHeaderMixedNav;
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
  <PreferencesProvider>
    <div :class="rootClass" :style="rootStyle">
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
            v-if="context.props.breadcrumb?.enable !== false"
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
          <!-- 默认水平菜单（顶部导航模式） -->
          <HorizontalMenu 
            v-if="showHeaderMenu && headerMenus.length > 0"
            :menus="headerMenus"
            :active-key="headerActiveKey"
            :align="headerMenuAlign"
            :theme="headerMenuTheme"
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
          />
        </slot>
      </template>
      <template #extra>
        <slot name="header-extra" />
      </template>
    </LayoutHeader>

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
        v-if="showPreferencesButton && resolvedPreferencesButtonPosition === 'fixed'"
        class="layout-preferences-button"
        title="偏好设置"
        @click="openPreferences"
      >
        <slot name="preferences-button-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </slot>
      </button>
    </div>

    <!-- 偏好设置抽屉（内置） -->
    <PreferencesDrawer 
      v-model:open="showPreferencesDrawer"
      @close="closePreferences(); emit('preferences-close')"
    />
  </PreferencesProvider>
</template>
