<script setup lang="ts">
/**
 * 功能区组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, usePanelState } from '../../composables';

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

// 类名
const panelClass = computed(() => [
  'layout-panel',
  `layout-panel--${position.value}`,
  {
    'layout-panel--collapsed': collapsed.value,
  },
]);

// 样式
const panelStyle = computed(() => ({
  width: `${width.value}px`,
  top: `${layoutComputed.value.headerHeight}px`,
}));
</script>

<template>
  <aside :class="panelClass" :style="panelStyle">
    <div class="layout-panel__inner flex h-full flex-col">
      <!-- 头部 -->
      <div v-if="$slots.header || showCollapseButton" class="layout-panel__header flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <slot name="header">
          <span class="font-medium">{{ context.t('layout.panel.title') }}</span>
        </slot>
        
        <!-- 折叠按钮 -->
        <button
          v-if="showCollapseButton"
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5"
          :title="collapsed ? context.t('layout.panel.expand') : context.t('layout.panel.collapse')"
          @click="toggle"
        >
          <svg
            class="h-4 w-4 transition-transform duration-layout-normal"
            :class="{ 'rotate-180': position === 'left' ? !collapsed : collapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="layout-panel__content flex-1 overflow-y-auto overflow-x-hidden p-4">
        <slot />
      </div>

      <!-- 底部 -->
      <div v-if="$slots.footer" class="layout-panel__footer shrink-0 border-t border-border px-4 py-3">
        <slot name="footer" />
      </div>
    </div>
  </aside>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
