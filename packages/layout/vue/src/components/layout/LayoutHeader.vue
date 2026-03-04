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

/**
 * 布局上下文
 * @description 提供头部配置、小部件开关与国际化方法。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 汇总当前布局类型、头部主题、侧栏可见性等计算结果。
 */
const layoutComputed = useLayoutComputed();
/**
 * 头部运行时状态
 * @description 提供显隐、尺寸与定位模式。
 */
const { hidden, height, mode } = useHeaderState();
/**
 * 侧栏运行时状态
 * @description 提供折叠状态与切换方法，供顶栏按钮联动。
 */
const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarState();

/**
 * 顶栏配置
 * @description 读取 `header` 相关开关与布局参数。
 */
const headerConfig = computed(() => context.props.header || {});
/**
 * Logo 配置
 * @description 读取头部 logo 资源与展示开关。
 */
const logoConfig = computed(() => context.props.logo || {});
/**
 * 顶栏主题
 * @description 根据布局派生状态选择明暗主题。
 */
const theme = computed(() => layoutComputed.value.headerTheme || 'light');
/**
 * 菜单对齐方式
 * @description 决定顶部菜单容器的横向对齐策略。
 */
const menuAlign = computed(() => headerConfig.value.menuAlign || 'start');
/**
 * 是否固定顶栏
 * @description `mode !== static` 时采用 fixed 定位。
 */
const isHeaderFixed = computed(() => mode.value !== 'static');

/**
 * 侧栏切换图标名称
 * @description 根据侧栏折叠状态在展开/收起图标间切换。
 */
const headerToggleIconName = computed(() =>
  sidebarCollapsed.value ? 'sidebar-toggle-collapsed' : 'sidebar-toggle'
);
/**
 * 侧栏切换图标类名
 * @description 组合图标基础类与旋转动画类。
 */
const headerToggleIconClass = computed(
  () => `${LAYOUT_ICONS.headerSidebarToggle.className} ${ANIMATION_CLASSES.iconRotate}`
);

/**
 * 是否在顶栏展示 Logo
 * @description 顶部导航、混合导航模式下在头部展示品牌区。
 */
const showLogoInHeader = computed(() => {
  return layoutComputed.value.isHeaderNav || 
         layoutComputed.value.isMixedNav || 
         layoutComputed.value.isHeaderMixedNav;
});

/**
 * 是否允许显示侧栏切换按钮
 * @description 仅基础侧栏布局允许在头部展示该按钮。
 */
const isCollapseButtonAllowedLayout = computed(() => {
  const layout = layoutComputed.value.currentLayout;
  return layout === 'sidebar-nav';
});

/**
 * 是否显示侧栏切换按钮
 * @description 综合布局模式、侧栏可见性与小部件配置判断。
 */
const showSidebarToggle = computed(() => {
  return isCollapseButtonAllowedLayout.value &&
         layoutComputed.value.showSidebar && 
         context.props.widgets?.sidebarToggle !== false &&
         !layoutComputed.value.isSidebarMixedNav &&
         !layoutComputed.value.isHeaderMixedNav;
});

/**
 * 是否显示刷新按钮
 * @description 读取小部件配置，默认开启。
 */
const showRefresh = computed(() => context.props.widgets?.refresh !== false);

/**
 * 是否 `header-sidebar-nav` 布局
 * @description 该布局使用头部 + 侧栏联动，但不展示顶部菜单条。
 */
const isHeaderSidebarNav = computed(() => layoutComputed.value.currentLayout === 'header-sidebar-nav');

/**
 * 是否显示顶部菜单
 * @description 顶部/混合导航模式显示菜单，`header-sidebar-nav` 例外。
 */
const showHeaderMenu = computed(() => {
  return (layoutComputed.value.isHeaderNav ||
         layoutComputed.value.isMixedNav ||
         layoutComputed.value.isHeaderMixedNav) && !isHeaderSidebarNav.value;
});

/**
 * 顶栏类名集合
 * @description 基于主题、定位模式、侧栏状态生成语义类名。
 */
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

/**
 * 顶栏内联样式
 * @description 根据是否固定与侧栏偏移动态计算定位与宽度。
 */
const headerStyle = computed(() => {
  /** 顶部导航模式下，顶栏占满全宽。 */
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

/**
 * 顶部菜单容器类名
 * @description 包含基础布局类与菜单对齐修饰类。
 */
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

        <!-- 左侧刷新按钮（与常见 admin 布局保持一致位置） -->
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
