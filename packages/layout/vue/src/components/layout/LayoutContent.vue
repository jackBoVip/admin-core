<script setup lang="ts">
/**
 * 内容区组件
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useLayoutContext, useLayoutComputed, usePageTransition, useSidebarState, usePanelState, useRouter } from '../../composables';
import { DEFAULT_CONTENT_CONFIG } from '@admin-core/layout';
import LayoutRefreshView from './LayoutRefreshView.vue';

/**
 * 布局上下文
 * @description 提供运行时配置、国际化与跨区域共享状态。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 汇总头部、侧栏、面板、页脚等区域的可见性与尺寸信息。
 */
const layoutComputed = useLayoutComputed();
/**
 * 侧栏折叠状态
 * @description 用于内容区在桌面端的左侧留白计算。
 */
const { collapsed: sidebarCollapsed } = useSidebarState();
/**
 * 功能面板状态
 * @description 提供面板折叠状态与停靠方向，用于内容区边距计算。
 */
const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();
/**
 * 页面转场配置
 * @description 提供转场开关与转场名称。
 */
const { enabled: transitionEnabled, transitionName } = usePageTransition();
/**
 * 当前路由路径
 * @description 与刷新键组合形成转场触发键。
 */
const { currentPath } = useRouter();
/**
 * 内容内层容器引用
 * @description 用于注入转场内联样式与读取布局宽度。
 */
const innerRef = ref<HTMLElement | null>(null);
/**
 * 转场结束定时器句柄
 * @description 在转场持续时长后清理阶段状态。
 */
let transitionTimer: number | null = null;
/**
 * 下一帧任务句柄
 * @description 保障“from -> active”样式切换发生在下一帧。
 */
let transitionRaf: number | null = null;
/**
 * 当前转场阶段
 * @description `idle` 表示无动画，`from` 为初始态，`active` 为过渡中。
 */
const transitionPhase = ref<'idle' | 'from' | 'active'>('idle');
/**
 * 当前转场类名前缀
 * @description 与阶段共同拼接过渡类。
 */
const transitionClassName = ref('');

/**
 * 从 CSS 变量解析页面过渡动画时长（毫秒）。
 *
 * @returns 过渡时长。
 */
const resolveTransitionDuration = () => {
  if (typeof window === 'undefined') return 0;
  const styles = getComputedStyle(document.documentElement);
  const raw = styles.getPropertyValue('--admin-page-transition-duration')
    || styles.getPropertyValue('--admin-duration-normal');
  const value = raw.trim();
  if (!value) return 300;
  if (value.endsWith('ms')) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
  }
  if (value.endsWith('s')) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 300;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
};


/**
 * 清理过渡动画相关定时器与帧任务。
 */
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

/**
 * 重置过渡阶段与过渡类名。
 */
const clearTransitionClasses = () => {
  transitionPhase.value = 'idle';
  transitionClassName.value = '';
};

/**
 * 写入过渡初始态内联样式。
 *
 * @param el 目标元素。
 * @param name 过渡名称。
 */
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
  }
};

/**
 * 清除过渡初始态内联样式。
 *
 * @param el 目标元素。
 */
const clearTransitionInlineFrom = (el: HTMLElement) => {
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');
};

/**
 * 执行一次页面切换过渡动画。
 */
const runTransition = async () => {
  if (!transitionEnabled.value || typeof window === 'undefined') return;
  if (!innerRef.value) return;
  const name = transitionName.value || 'fade-slide';
  const el = innerRef.value;
  transitionClassName.value = name;
  transitionPhase.value = 'from';
  applyTransitionInlineFrom(el, name);
  await nextTick();
  void el.offsetWidth;
  transitionRaf = window.requestAnimationFrame(() => {
    clearTransitionInlineFrom(el);
    transitionPhase.value = 'active';
  });
  transitionTimer = window.setTimeout(() => {
    clearTransitionClasses();
  }, resolveTransitionDuration());
};

/**
 * 转场触发键
 * @description 由“当前路径 + 刷新键”组成，任意一项变化都触发转场。
 */
const transitionTrigger = computed(() => {
  return `${currentPath.value || ''}:${context.state.refreshKey}`;
});

watch(
  [transitionTrigger, transitionEnabled, transitionName],
  () => {
    clearTransitionTimers();
    runTransition();
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

/**
 * 内容区密度模式
 * @description 读取内容区紧凑模式配置，缺省回退核心默认值。
 */
const contentCompact = computed(() => context.props.contentCompact || DEFAULT_CONTENT_CONFIG.contentCompact);
/**
 * 紧凑模式最大宽度
 * @description 在 `compact` 模式下用于限制内容最大宽度。
 */
const contentCompactWidth = computed(() => context.props.contentCompactWidth || DEFAULT_CONTENT_CONFIG.contentCompactWidth);
/**
 * KeepAlive 开关
 * @description 当标签页设置显式关闭缓存时禁用 KeepAlive。
 */
const keepAliveEnabled = computed(() => context.props.tabbar?.keepAlive !== false);
/**
 * KeepAlive 最大缓存数
 * @description 结合 `tabbar.maxCount` 与 `autoTab.maxCount` 计算，0 表示不限制。
 */
const keepAliveMax = computed(() => {
  const max = context.props.tabbar?.maxCount ?? context.props.autoTab?.maxCount ?? 0;
  return max > 0 ? max : undefined;
});
/**
 * KeepAlive include 列表
 * @description 指定需要缓存的组件名集合。
 */
const keepAliveInclude = computed(() => context.state.keepAliveIncludes || []);
/**
 * KeepAlive exclude 列表
 * @description 指定需要排除缓存的组件名集合。
 */
const keepAliveExclude = computed(() => context.state.keepAliveExcludes || []);
/**
 * 内容区底部额外留白
 * @description 当页脚固定时，为避免遮挡内容在底部追加页脚高度。
 */
const footerPaddingOffset = computed(() => {
  return layoutComputed.value.showFooter && context.props.footer?.fixed
    ? layoutComputed.value.footerHeight
    : 0;
});
/**
 * 视口页脚偏移
 * @description 供视口高度类计算使用，表示当前页脚占位高度。
 */
const viewportFooterOffset = computed(() => {
  return layoutComputed.value.showFooter ? layoutComputed.value.footerHeight : 0;
});

/**
 * 将数字或像素字符串解析为数值。
 *
 * @param value 待解析值。
 * @returns 解析后的数值；非法输入返回 `0`。
 */
const parsePxValue = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/**
 * 内容区类名集合
 * @description 根据紧凑模式、侧栏/面板状态生成语义类。
 */
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

/**
 * 内容区外层样式
 * @description 统一计算边距、内边距以及视口偏移 CSS 变量。
 */
const contentStyle = computed(() => {
  const { mainStyle } = layoutComputed.value;
  const paddingBase = context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding;
  const paddingBottom = (context.props.contentPaddingBottom ?? paddingBase) + footerPaddingOffset.value;
  const viewportTopOffset = parsePxValue(mainStyle.marginTop);
  const viewportOffset = viewportTopOffset + viewportFooterOffset.value;
  return {
    marginLeft: mainStyle.marginLeft,
    marginRight: mainStyle.marginRight,
    marginTop: mainStyle.marginTop,
    paddingTop: `${context.props.contentPaddingTop ?? paddingBase}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: `${context.props.contentPaddingLeft ?? paddingBase}px`,
    paddingRight: `${context.props.contentPaddingRight ?? paddingBase}px`,
    '--admin-content-viewport-top-offset': `${viewportTopOffset}px`,
    '--admin-content-viewport-footer-offset': `${viewportFooterOffset.value}px`,
    '--admin-content-viewport-offset': `${viewportOffset}px`,
  };
});

/**
 * 内容区内层样式
 * @description 仅在紧凑模式下追加最大宽度与居中规则。
 */
const innerStyle = computed(() => {
  const style: Record<string, string | number> = {};
  if (contentCompact.value === 'compact') {
    style.maxWidth = `${contentCompactWidth.value}px`;
    style.margin = '0 auto';
  }
  return style;
});

/**
 * 转场内联样式
 * @description 依据转场名称与阶段计算 opacity/transform/transition 属性。
 */
const transitionStyle = computed(() => {
  if (!transitionEnabled.value) return {};
  const style: Record<string, string | number> = {
    width: '100%',
  };
  const name = transitionName.value || 'fade-slide';
  const isSlide = name === 'slide-left' || name === 'slide-right';
  style.transitionProperty = isSlide ? 'transform' : 'opacity, transform';
  style.transitionDuration = 'var(--admin-page-transition-duration, var(--admin-duration-normal, 300ms))';
  style.transitionTimingFunction = 'var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1))';
  if (transitionPhase.value === 'from') {
    if (name === 'fade') {
      style.opacity = 0;
    } else if (name === 'fade-slide') {
      style.opacity = 0;
      style.transform = 'translateX(10px)';
    } else if (name === 'fade-up') {
      style.opacity = 0;
      style.transform = 'translateY(10px)';
    } else if (name === 'fade-down') {
      style.opacity = 0;
      style.transform = 'translateY(-10px)';
    } else if (name === 'slide-left') {
      style.transform = 'translateX(100%)';
    } else if (name === 'slide-right') {
      style.transform = 'translateX(-100%)';
    }
  }
  return style;
});

/**
 * 转场类名
 * @description 将阶段映射为 enter 相关类名，配合内联样式完成过渡。
 */
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
    <div class="layout-content__inner" :style="innerStyle">
      <div
        ref="innerRef"
        class="layout-content__transition"
        :class="transitionClasses"
        :style="transitionStyle"
      >
        <LayoutRefreshView>
          <KeepAlive
            v-if="keepAliveEnabled"
            :max="keepAliveMax"
            :include="keepAliveInclude"
            :exclude="keepAliveExclude"
          >
            <slot />
          </KeepAlive>
          <slot v-else />
        </LayoutRefreshView>
      </div>
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
