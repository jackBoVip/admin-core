<script setup lang="ts">
/**
 * 侧边栏组件
 * @description 参考 vben admin 实现的混合侧边栏逻辑
 * 
 * 状态说明：
 * - extraVisible: 子菜单面板是否可见（由是否有子菜单决定）
 * - expandOnHover: 是否固定模式（true=固定，false=悬停显示）
 * - extraCollapsed: 子菜单面板是否折叠（折叠后只显示图标列）
 */
import { computed, ref } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import SidebarMenu from './SidebarMenu.vue';
import MixedSidebarMenu, { MixedSidebarSubMenu } from './MixedSidebarMenu.vue';
import { 
  DEFAULT_SIDEBAR_CONFIG, 
  LAYOUT_ICONS, 
  ANIMATION_CLASSES, 
  getIconPath, 
  getIconViewBox,
  type MenuItem,
} from '@admin-core/layout';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const {
  collapsed,
  expandOnHovering,
  extraVisible,
  extraCollapsed,
  expandOnHover,
  width,
  handleMouseEnter,
  handleMouseLeave,
} = useSidebarState();
const { activeKey, handleSelect } = useMenuState();

// 配置 - 直接返回 sidebar 对象引用，确保响应式追踪
const sidebarConfig = computed(() => {
  // 访问 context.props.sidebar 会触发响应式追踪
  const sidebar = context.props.sidebar;
  return sidebar || {};
});
const logoConfig = computed(() => context.props.logo || {});
// 使用 layoutComputed 中计算的主题（考虑 semiDarkSidebar）
const theme = computed(() => layoutComputed.value.sidebarTheme || 'light');

// 是否是混合侧边栏模式（sidebar-mixed-nav 或 header-mixed-nav）
const isMixedMode = computed(() => 
  layoutComputed.value.isSidebarMixedNav || layoutComputed.value.isHeaderMixedNav
);

// 是否允许显示折叠按钮的布局（仅 sidebar-nav 和 header-mixed-nav）
const isCollapseButtonAllowedLayout = computed(() => {
  const layout = layoutComputed.value.currentLayout;
  return layout === 'sidebar-nav' || layout === 'header-mixed-nav';
});

// 当前选中的一级菜单（用于混合模式）
const selectedRootMenu = ref<MenuItem | null>(null);

// 处理 MixedSidebarMenu 的根菜单变化
const onRootMenuChange = (menu: MenuItem | null) => {
  selectedRootMenu.value = menu;
};

// 子菜单（选中一级菜单的children）
const subMenus = computed(() => selectedRootMenu.value?.children || []);
const subMenuTitle = computed(() => selectedRootMenu.value?.name || '');

// 是否显示子菜单面板（固定模式下始终显示，折叠时显示图标）
const showExtraContent = computed(() => {
  if (!subMenus.value.length) return false;
  // 固定模式下始终显示（折叠时显示图标列，展开时显示完整菜单）
  if (expandOnHover.value) return extraVisible.value;
  // 非固定模式下，只有悬停时才显示
  return extraVisible.value && !extraCollapsed.value;
});

// 处理子菜单面板折叠/展开切换（vben 风格：点击同一个按钮切换）
const handleExtraCollapseToggle = () => {
  extraCollapsed.value = !extraCollapsed.value;
};

// 处理固定/取消固定
const handleTogglePin = () => {
  expandOnHover.value = !expandOnHover.value;
};

// 类名
const sidebarClass = computed(() => [
  'layout-sidebar',
  `layout-sidebar--${theme.value}`,
  {
    'layout-sidebar--collapsed': collapsed.value && !expandOnHovering.value,
    'layout-sidebar--expand-on-hover': expandOnHovering.value,
    'layout-sidebar--mixed': isMixedMode.value,
    'layout-sidebar--hidden': sidebarConfig.value.hidden,
    'layout-sidebar--mobile-visible': context.props.isMobile && !collapsed.value,
  },
]);

// 混合模式下的图标列宽度
const mixedWidth = computed(() => sidebarConfig.value.mixedWidth || DEFAULT_SIDEBAR_CONFIG.mixedWidth);

// 子菜单面板折叠宽度
const extraCollapsedWidth = computed(() => sidebarConfig.value.extraCollapsedWidth || DEFAULT_SIDEBAR_CONFIG.extraCollapsedWidth);

// 子菜单面板宽度（vben: sidebarExtraWidth）
const extraWidthValue = computed(() => {
  if (!showExtraContent.value) return 0;
  return extraCollapsed.value ? extraCollapsedWidth.value : (sidebarConfig.value.width || DEFAULT_SIDEBAR_CONFIG.width);
});

// 侧边栏宽度（混合模式下只是图标列宽度，子菜单面板是独立的 fixed 元素）
const sidebarStyle = computed(() => {
  if (isMixedMode.value) {
    return { width: `${mixedWidth.value}px` };
  }
  return { width: `${width.value}px` };
});

// 子菜单面板样式（vben 风格：fixed 定位在主菜单右侧）
const extraStyle = computed(() => ({
  left: `${mixedWidth.value}px`,
  width: showExtraContent.value ? `${extraWidthValue.value}px` : '0px',
}));

// 折叠按钮 - 仅在 sidebar-nav 和 mixed-nav 布局下显示
const showCollapseButton = computed(() => {
  // 只有 sidebar-nav 和 mixed-nav 布局才允许显示折叠按钮
  const allowedLayout = isCollapseButtonAllowedLayout.value;
  if (!allowedLayout) {
    return false;
  }
  
  // 直接从 sidebar 配置读取 collapsedButton
  const collapsedButton = context.props.sidebar?.collapsedButton;
  const disabled = context.props.disabled?.sidebarCollapseButton;
  
  return collapsedButton !== false && disabled !== true;
});

// 折叠图标配置（根据状态显示不同图标）
const collapseIconName = computed(() => 
  collapsed.value ? (LAYOUT_ICONS.sidebarCollapse.iconCollapsed || LAYOUT_ICONS.sidebarCollapse.icon) : LAYOUT_ICONS.sidebarCollapse.icon
);

const collapseIconProps = computed(() => ({
  className: `${LAYOUT_ICONS.sidebarCollapse.className} ${ANIMATION_CLASSES.iconRotate}`,
  viewBox: getIconViewBox(collapseIconName.value),
  path: getIconPath(collapseIconName.value),
}));

const toggleCollapse = () => {
  context.toggleSidebarCollapse();
};
</script>

<template>
  <aside
    :class="sidebarClass"
    :style="sidebarStyle"
    :data-theme="theme"
    :data-collapsed="collapsed && !expandOnHovering ? 'true' : undefined"
    :data-hidden="sidebarConfig.hidden ? 'true' : undefined"
    :data-mixed="isMixedMode ? 'true' : undefined"
    :data-expand-on-hover="expandOnHovering ? 'true' : undefined"
    :data-mobile-visible="context.props.isMobile && !collapsed ? 'true' : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="layout-sidebar__inner flex h-full flex-col">
      <!-- Logo 区域 -->
      <div v-if="logoConfig.enable !== false && !isMixedMode" class="layout-sidebar__logo shrink-0">
        <slot name="logo">
          <div class="flex h-header items-center justify-center px-3">
            <img
              v-if="logoConfig.source"
              :src="theme === 'dark' && logoConfig.sourceDark ? logoConfig.sourceDark : logoConfig.source"
              :alt="context.props.appName || 'Logo'"
              class="h-8 w-auto object-contain"
              :style="{ objectFit: logoConfig.fit || 'contain' }"
            />
            <span
              v-if="!collapsed || sidebarConfig.collapsedShowTitle"
              class="ml-2 truncate text-lg font-semibold transition-opacity sidebar-collapsed:opacity-80"
            >
              {{ context.props.appName || '' }}
            </span>
          </div>
        </slot>
      </div>

      <!-- 菜单区域 -->
      <div class="layout-sidebar__menu flex-1 overflow-hidden">
        <div class="layout-scroll-container h-full overflow-y-auto overflow-x-hidden scrollbar-elegant">
          <slot name="menu">
            <!-- 混合模式：只显示一级菜单图标 -->
            <MixedSidebarMenu v-if="isMixedMode" @root-menu-change="onRootMenuChange" />
            <!-- 普通模式：显示完整菜单 -->
            <SidebarMenu v-else />
          </slot>
        </div>
      </div>

      <!-- 额外内容插槽 -->
      <div v-if="$slots.extra" class="layout-sidebar__extra-slot shrink-0">
        <slot name="extra" />
      </div>

      <!-- 底部区域 -->
      <div v-if="showCollapseButton" class="layout-sidebar__footer shrink-0 border-t border-border/10">
        <slot name="footer">
          <!-- 折叠按钮 -->
          <button
            type="button"
            class="flex w-full items-center justify-center py-3 transition-colors sidebar-dark:hover:bg-white/5 sidebar-light:hover:bg-black/5"
            :title="collapsed ? context.t('layout.sidebar.expand') : context.t('layout.sidebar.collapse')"
            @click="toggleCollapse"
          >
            <svg
              :class="collapseIconProps.className"
              :viewBox="collapseIconProps.viewBox"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="collapseIconProps.path" />
            </svg>
          </button>
        </slot>
      </div>
    </div>

    <!-- 混合菜单扩展区域（子菜单） -->
    <div
      v-if="isMixedMode"
      class="layout-sidebar__extra"
      :class="{ 'layout-sidebar__extra--visible': showExtraContent }"
      :data-visible="showExtraContent ? 'true' : undefined"
      :style="extraStyle"
    >
      <slot name="mixed-menu">
        <MixedSidebarSubMenu
          v-if="showExtraContent"
          :menus="subMenus"
          :active-key="activeKey"
          :title="subMenuTitle"
          :collapsed="extraCollapsed"
          :pinned="expandOnHover"
          :show-collapse-btn="expandOnHover"
          :show-pin-btn="!extraCollapsed"
          @select="handleSelect"
          @collapse="handleExtraCollapseToggle"
          @toggle-pin="handleTogglePin"
        />
      </slot>
    </div>
  </aside>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
