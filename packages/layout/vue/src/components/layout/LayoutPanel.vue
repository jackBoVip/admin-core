<script setup lang="ts">
/**
 * 功能区组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, usePanelState } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed, width, position, toggle } = usePanelState();

// 配置
const panelConfig = computed(() => context.props.panel || {});

// 是否显示折叠按钮
const showCollapseButton = computed(() => 
  panelConfig.value.collapsedButton !== false && 
  context.props.disabled?.panelCollapseButton !== true
);

const collapseIconClass = computed(() =>
  `layout-panel__collapse-icon transition-transform duration-layout-normal ${
    position.value === 'left'
      ? (!collapsed.value ? 'rotate-180' : '')
      : (collapsed.value ? 'rotate-180' : '')
  }`
);

// 类名
const panelClass = computed(() => [
  'layout-panel',
  `layout-panel--${position.value}`,
  {
    'layout-panel--collapsed': collapsed.value,
  },
]);

// 样式
const panelStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${width.value}px`,
    top: `${layoutComputed.value.headerHeight}px`,
  };
  if (position.value === 'left' && layoutComputed.value.showSidebar && !context.props.isMobile) {
    style.left = `${layoutComputed.value.sidebarWidth}px`;
  }
  return style;
});
</script>

<template>
  <aside
    :class="panelClass"
    :style="panelStyle"
    :data-position="position"
    :data-collapsed="collapsed ? 'true' : undefined"
  >
    <div class="layout-panel__inner flex h-full flex-col">
      <!-- 内容 -->
      <div class="layout-panel__content layout-scroll-container flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div v-if="$slots.header" class="layout-panel__header-content mb-3">
          <slot name="header" />
        </div>
        <slot />
      </div>

      <!-- 底部 -->
      <div v-if="$slots.footer" class="layout-panel__footer shrink-0 border-t border-border px-4 py-3">
        <slot name="footer" />
      </div>
    </div>

    <!-- 折叠按钮（附着在靠内容区一侧边框） -->
    <button
      v-if="showCollapseButton"
      type="button"
      class="layout-panel__collapse-btn"
      :title="collapsed ? context.t('layout.panel.expand') : context.t('layout.panel.collapse')"
      :aria-label="collapsed ? context.t('layout.panel.expand') : context.t('layout.panel.collapse')"
      @click="toggle"
    >
      <LayoutIcon
        name="panel-collapse"
        size="sm"
        :class-name="collapseIconClass"
      />
    </button>
  </aside>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
