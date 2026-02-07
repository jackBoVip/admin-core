<script setup lang="ts">
/**
 * 顶栏组件
 * @description 支持水平菜单显示
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, useHeaderState, useSidebarState } from '../../composables';
import { LAYOUT_ICONS, ANIMATION_CLASSES } from '@admin-core/layout';
import LayoutIcon from '../common/LayoutIcon.vue';
import { RefreshButton } from '../widgets';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { hidden, height, mode } = useHeaderState();
const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarState();

// 配置
const headerConfig = computed(() => context.props.header || {});
const logoConfig = computed(() => context.props.logo || {});
const theme = computed(() => layoutComputed.value.headerTheme || 'light');
const menuAlign = computed(() => headerConfig.value.menuAlign || 'start');
const isHeaderFixed = computed(() => mode.value !== 'static');

// 折叠图标配置（根据状态显示不同图标）
const headerToggleIconName = computed(() =>
  sidebarCollapsed.value ? 'sidebar-toggle-collapsed' : 'sidebar-toggle'
);
const headerToggleIconClass = computed(
  () => `${LAYOUT_ICONS.headerSidebarToggle.className} ${ANIMATION_CLASSES.iconRotate}`
);

// 是否在顶栏显示 Logo
const showLogoInHeader = computed(() => {
  return layoutComputed.value.isHeaderNav || 
         layoutComputed.value.isMixedNav || 
         layoutComputed.value.isHeaderMixedNav;
});

// 是否允许显示折叠按钮的布局（仅 sidebar-nav）
const isCollapseButtonAllowedLayout = computed(() => {
  const layout = layoutComputed.value.currentLayout;
  return layout === 'sidebar-nav';
});

// 是否显示侧边栏切换按钮（根据偏好设置开关控制）
const showSidebarToggle = computed(() => {
  return isCollapseButtonAllowedLayout.value &&
         layoutComputed.value.showSidebar && 
         context.props.widgets?.sidebarToggle !== false &&
         !layoutComputed.value.isSidebarMixedNav &&
         !layoutComputed.value.isHeaderMixedNav;
});

// 是否显示刷新按钮（左侧）
const showRefresh = computed(() => context.props.widgets?.refresh !== false);

const isHeaderSidebarNav = computed(() => layoutComputed.value.currentLayout === 'header-sidebar-nav');

// 是否显示顶部菜单（顶部导航模式）
const showHeaderMenu = computed(() => {
  return (layoutComputed.value.isHeaderNav ||
         layoutComputed.value.isMixedNav ||
         layoutComputed.value.isHeaderMixedNav) && !isHeaderSidebarNav.value;
});

// 类名
const headerClass = computed(() => [
  'layout-header',
  `layout-header--${theme.value}`,
  `layout-header--${mode.value}`,
  {
    'layout-header--hidden': hidden.value,
    'layout-header--with-sidebar': layoutComputed.value.showSidebar && !context.props.isMobile,
    'layout-header--collapsed': sidebarCollapsed.value && !context.props.isMobile,
    'layout-header--header-nav': layoutComputed.value.isHeaderNav,
    'layout-header--mixed-nav': layoutComputed.value.isMixedNav,
    'layout-header--header-mixed-nav': layoutComputed.value.isHeaderMixedNav,
  },
]);

// 样式
const headerStyle = computed(() => {
  // 顶部导航模式下，顶栏占满全宽
  const isFullWidth = layoutComputed.value.isHeaderNav || 
                      layoutComputed.value.isMixedNav || 
                      layoutComputed.value.isHeaderMixedNav ||
                      layoutComputed.value.currentLayout === 'header-sidebar-nav';

  const sidebarOffset =
    !isFullWidth && layoutComputed.value.showSidebar && !context.props.isMobile
      ? layoutComputed.value.sidebarWidth
      : 0;

  const style: Record<string, string> = {
    height: `${height.value}px`,
  };

  if (isHeaderFixed.value) {
    style.position = 'fixed';
    style.left = sidebarOffset ? `${sidebarOffset}px` : '0';
  } else {
    style.position = 'static';
    if (sidebarOffset) {
      style.marginLeft = `${sidebarOffset}px`;
      style.width = `calc(100% - ${sidebarOffset}px)`;
    }
  }

  return style;
});

// 菜单容器样式
const menuContainerClass = computed(() => [
  'layout-header__menu flex-1 min-w-0 flex items-center overflow-hidden',
  `header-menu--align-${menuAlign.value}`,
]);
</script>

<template>
  <header
    :class="headerClass"
    :style="headerStyle"
    :data-theme="theme"
    :data-hidden="hidden ? 'true' : undefined"
    :data-mode="mode"
    :data-with-sidebar="layoutComputed.showSidebar && !context.props.isMobile ? 'true' : undefined"
    :data-collapsed="sidebarCollapsed && !context.props.isMobile ? 'true' : undefined"
    :data-header-nav="layoutComputed.isHeaderNav ? 'true' : undefined"
    :data-mixed-nav="layoutComputed.isMixedNav ? 'true' : undefined"
    :data-header-mixed-nav="layoutComputed.isHeaderMixedNav ? 'true' : undefined"
  >
    <div class="layout-header__inner flex h-full items-center px-4">
      <!-- Logo（仅顶部导航模式） -->
      <div v-if="showLogoInHeader && logoConfig.enable !== false" class="layout-header__logo mr-4 shrink-0">
        <slot name="logo">
          <div class="flex items-center">
            <img
              v-if="logoConfig.source"
              :src="theme === 'dark' && logoConfig.sourceDark ? logoConfig.sourceDark : logoConfig.source"
              :alt="context.props.appName || 'Logo'"
              class="h-8 w-auto"
            />
            <span class="ml-2 text-lg font-semibold">
              {{ context.props.appName || '' }}
            </span>
          </div>
        </slot>
      </div>

      <!-- 左侧按钮组（统一间距） -->
      <div class="layout-header__left-actions flex items-center gap-1 shrink-0">
        <!-- 侧边栏切换按钮 -->
        <button
          v-if="showSidebarToggle"
          type="button"
          class="header-widget-btn"
          @click="toggleSidebar"
        >
          <LayoutIcon :name="headerToggleIconName" size="md" :className="headerToggleIconClass" />
        </button>

        <!-- 左侧刷新按钮（与 vben 保持一致位置） -->
        <RefreshButton v-if="showRefresh" />
      </div>

      <!-- 左侧插槽 -->
      <div v-if="$slots.left" class="layout-header__left shrink-0 ml-3">
        <slot name="left" />
      </div>

      <!-- 菜单区域（顶部导航模式） -->
      <div v-if="showHeaderMenu" :class="menuContainerClass" :data-align="menuAlign">
        <slot name="menu">
          <!-- 顶部菜单默认内容 - 由 BasicLayout 提供 HorizontalMenu 组件 -->
        </slot>
      </div>
      <!-- 非顶部菜单模式下的占位符，将右侧内容推到右边 -->
      <div v-else class="flex-1" />

      <!-- 中间插槽 -->
      <div v-if="$slots.center" class="layout-header__center flex-1">
        <slot name="center" />
      </div>

      <!-- 右侧插槽 -->
      <div v-if="$slots.right" class="layout-header__right shrink-0">
        <slot name="right" />
      </div>

      <!-- 操作区域 -->
      <div class="layout-header__actions flex shrink-0 items-center gap-1">
        <slot name="actions">
          <!-- 默认操作按钮由用户通过插槽或小部件配置提供 -->
        </slot>
      </div>

      <!-- 额外内容 -->
      <div v-if="$slots.extra" class="layout-header__extra ml-2 shrink-0">
        <slot name="extra" />
      </div>
    </div>
  </header>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
