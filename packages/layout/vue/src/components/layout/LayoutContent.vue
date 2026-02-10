<script setup lang="ts">
/**
 * 内容区组件
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useLayoutContext, useLayoutComputed, usePageTransition, useSidebarState, usePanelState, useRouter } from '../../composables';
import { DEFAULT_CONTENT_CONFIG } from '@admin-core/layout';
import LayoutRefreshView from './LayoutRefreshView.vue';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed: sidebarCollapsed } = useSidebarState();
const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();
const { enabled: transitionEnabled, transitionName } = usePageTransition();
const { currentPath } = useRouter();
const innerRef = ref<HTMLElement | null>(null);
let transitionTimer: number | null = null;
let transitionRaf: number | null = null;
const transitionPhase = ref<'idle' | 'from' | 'active'>('idle');
const transitionClassName = ref('');

const resolveTransitionDuration = () => {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--admin-duration-normal').trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 300;
};

const clearTransitionTimers = () => {
  if (transitionRaf !== null) {
    window.cancelAnimationFrame(transitionRaf);
    transitionRaf = null;
  }
  if (transitionTimer !== null) {
    window.clearTimeout(transitionTimer);
    transitionTimer = null;
  }
};

const clearTransitionClasses = () => {
  transitionPhase.value = 'idle';
  transitionClassName.value = '';
};

const applyTransitionInlineFrom = (el: HTMLElement, name: string) => {
  if (name === 'fade') {
    el.style.setProperty('opacity', '0', 'important');
    return;
  }
  if (name === 'fade-slide') {
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('transform', 'translateX(10px)', 'important');
    return;
  }
  if (name === 'fade-up') {
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('transform', 'translateY(10px)', 'important');
    return;
  }
  if (name === 'fade-down') {
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('transform', 'translateY(-10px)', 'important');
    return;
  }
  if (name === 'slide-left') {
    el.style.setProperty('transform', 'translateX(100%)', 'important');
    return;
  }
  if (name === 'slide-right') {
    el.style.setProperty('transform', 'translateX(-100%)', 'important');
    return;
  }
};

const clearTransitionInlineFrom = (el: HTMLElement) => {
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');
};

const runTransition = () => {
  if (!transitionEnabled.value || typeof window === 'undefined') return;
  if (!innerRef.value) return;
  const name = transitionName.value || 'fade-slide';
  const el = innerRef.value;
  clearTransitionInlineFrom(el);
  transitionClassName.value = name;
  transitionPhase.value = 'from';
  applyTransitionInlineFrom(el, name);
  void el.offsetWidth;
  transitionRaf = window.requestAnimationFrame(() => {
    clearTransitionInlineFrom(el);
    transitionPhase.value = 'active';
  });
  transitionTimer = window.setTimeout(() => {
    clearTransitionClasses();
  }, resolveTransitionDuration());
};

const transitionTrigger = computed(() => {
  return `${currentPath.value || ''}:${context.state.refreshKey}`;
});

watch(
  [transitionTrigger, transitionEnabled, transitionName],
  () => {
    clearTransitionTimers();
    nextTick(() => runTransition());
  }
);

watch(
  transitionEnabled,
  (enabled) => {
    if (enabled) return;
    clearTransitionClasses();
    if (innerRef.value) {
      clearTransitionInlineFrom(innerRef.value);
    }
  }
);

onBeforeUnmount(() => {
  clearTransitionTimers();
  clearTransitionClasses();
  if (innerRef.value) {
    clearTransitionInlineFrom(innerRef.value);
  }
});

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

const transitionClasses = computed(() => {
  if (!transitionClassName.value || transitionPhase.value === 'idle') return '';
  if (transitionPhase.value === 'from') {
    return `${transitionClassName.value}-enter-active ${transitionClassName.value}-enter-from`;
  }
  return `${transitionClassName.value}-enter-active`;
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
    <div ref="innerRef" class="layout-content__inner" :class="transitionClasses" :style="innerStyle">
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
