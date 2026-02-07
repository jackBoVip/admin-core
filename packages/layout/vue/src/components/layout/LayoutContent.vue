<script setup lang="ts">
/**
 * 内容区组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState, usePanelState } from '../../composables';
import { DEFAULT_CONTENT_CONFIG } from '@admin-core/layout';
import LayoutRefreshView from './LayoutRefreshView.vue';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed: sidebarCollapsed } = useSidebarState();
const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();

// 配置
const contentCompact = computed(() => context.props.contentCompact || DEFAULT_CONTENT_CONFIG.contentCompact);
const contentCompactWidth = computed(() => context.props.contentCompactWidth || DEFAULT_CONTENT_CONFIG.contentCompactWidth);
const keepAliveEnabled = computed(() => context.props.tabbar?.keepAlive !== false);
const keepAliveInclude = computed(() => context.state.keepAliveIncludes || []);
const keepAliveExclude = computed(() => context.state.keepAliveExcludes || []);
const footerOffset = computed(() => {
  return layoutComputed.value.showFooter && context.props.footer?.fixed
    ? layoutComputed.value.footerHeight
    : 0;
});

// 类名
const contentClass = computed(() => [
  'layout-content',
  {
    'layout-content--compact': contentCompact.value === 'compact',
    'layout-content--collapsed': sidebarCollapsed.value && !context.props.isMobile,
    'layout-content--with-panel': layoutComputed.value.showPanel,
    'layout-content--panel-left': layoutComputed.value.showPanel && panelPosition.value === 'left',
    'layout-content--panel-right': layoutComputed.value.showPanel && panelPosition.value === 'right',
    'layout-content--panel-collapsed': panelCollapsed.value,
  },
]);

// 样式
const contentStyle = computed(() => {
  const { mainStyle } = layoutComputed.value;
  const paddingBase = context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding;
  const paddingBottom = (context.props.contentPaddingBottom ?? paddingBase) + footerOffset.value;
  return {
    marginLeft: mainStyle.marginLeft,
    marginRight: mainStyle.marginRight,
    marginTop: mainStyle.marginTop,
    paddingTop: `${context.props.contentPaddingTop ?? paddingBase}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: `${context.props.contentPaddingLeft ?? paddingBase}px`,
    paddingRight: `${context.props.contentPaddingRight ?? paddingBase}px`,
  };
});

// 内容容器样式
const innerStyle = computed(() => {
  if (contentCompact.value === 'compact') {
    return {
      maxWidth: `${contentCompactWidth.value}px`,
      margin: '0 auto',
    };
  }
  return {};
});
</script>

<template>
  <main
    :class="contentClass"
    :style="contentStyle"
    :data-compact="contentCompact === 'compact' ? 'true' : undefined"
    :data-collapsed="sidebarCollapsed && !context.props.isMobile ? 'true' : undefined"
    :data-with-panel="layoutComputed.showPanel ? 'true' : undefined"
    :data-panel-position="layoutComputed.showPanel ? panelPosition : undefined"
    :data-panel-collapsed="panelCollapsed ? 'true' : undefined"
    :data-mobile="context.props.isMobile ? 'true' : undefined"
  >
    <!-- 内容头部 -->
    <div v-if="$slots.header" class="layout-content__header mb-4">
      <slot name="header" />
    </div>

    <!-- 面包屑 -->
    <div v-if="$slots.breadcrumb && layoutComputed.showBreadcrumb" class="layout-content__breadcrumb mb-4">
      <slot name="breadcrumb" />
    </div>

    <!-- 主内容 -->
    <div class="layout-content__inner" :style="innerStyle">
      <LayoutRefreshView>
        <KeepAlive v-if="keepAliveEnabled" :include="keepAliveInclude" :exclude="keepAliveExclude">
          <slot />
        </KeepAlive>
        <slot v-else />
      </LayoutRefreshView>
    </div>

    <!-- 内容底部 -->
    <div v-if="$slots.footer" class="layout-content__footer mt-4">
      <slot name="footer" />
    </div>

    <!-- 内容遮罩层 -->
    <div v-if="$slots.overlay" class="layout-content__overlay">
      <slot name="overlay" />
    </div>
  </main>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
