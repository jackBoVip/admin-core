<script setup lang="ts">
/**
 * 功能区组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, usePanelState } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 布局上下文
 * @description 提供面板配置、禁用项开关与国际化能力。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 提供头部高度、侧栏宽度及区域显隐计算结果。
 */
const layoutComputed = useLayoutComputed();
/**
 * 面板运行时状态
 * @description 包含折叠状态、宽度、停靠方向及切换方法。
 */
const { collapsed, width, position, toggle } = usePanelState();

/**
 * 面板配置
 * @description 读取 `panel` 配置并提供空对象兜底。
 */
const panelConfig = computed(() => context.props.panel || {});

/**
 * 是否显示面板折叠按钮
 * @description 同时受面板配置与禁用项配置控制。
 */
const showCollapseButton = computed(() => 
  panelConfig.value.collapsedButton !== false && 
  context.props.disabled?.panelCollapseButton !== true
);

/**
 * 面板折叠图标类名
 * @description 根据面板位置与折叠状态决定箭头旋转方向。
 */
const collapseIconClass = computed(() =>
  `layout-panel__collapse-icon transition-transform duration-layout-normal ${
    position.value === 'left'
      ? (!collapsed.value ? 'rotate-180' : '')
      : (collapsed.value ? 'rotate-180' : '')
  }`
);

/**
 * 面板类名集合
 * @description 根据停靠位置与折叠状态生成语义类。
 */
const panelClass = computed(() => [
  'layout-panel',
  `layout-panel--${position.value}`,
  {
    'layout-panel--collapsed': collapsed.value,
  },
]);

/**
 * 面板内联样式
 * @description 计算宽度、顶部偏移，并在左侧停靠时避让主侧栏。
 */
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
