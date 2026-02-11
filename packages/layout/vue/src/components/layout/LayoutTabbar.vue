<script setup lang="ts">
/**
 * 标签栏组件
 * @description 支持拖拽排序、中键关闭、滚轮滚动、最大化、右键菜单等功能
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect, type ComponentPublicInstance } from 'vue';
import { useLayoutContext, useLayoutComputed, useTabsState, useSidebarState } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { generateContextMenuItems, type ContextMenuAction, LAYOUT_UI_TOKENS, LAYOUT_STYLE_CONSTANTS, TABBAR_CHROME_SVG_PATHS, rafThrottle, calculateTabbarScrollOffset } from '@admin-core/layout';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const {
  tabs,
  activeKey,
  handleSelect,
  handleClose,
  handleCloseAll,
  handleCloseOther,
  handleCloseLeft,
  handleCloseRight,
  handleRefresh,
  handleToggleAffix,
  handleOpenInNewWindow,
  handleToggleFavorite,
  handleSort,
  isFavorite,
  canFavorite,
} = useTabsState();
const { collapsed: sidebarCollapsed } = useSidebarState();

// 配置
const tabbarConfig = computed(() => context.props.tabbar || {});
const styleType = computed(() => tabbarConfig.value.styleType || 'chrome');
const headerMode = computed(() => context.props.header?.mode || 'fixed');
const isHeaderFixed = computed(() => headerMode.value !== 'static');
const leftOffset = computed(() => layoutComputed.value.mainStyle.marginLeft || '0');
const panelRightOffset = computed(() => layoutComputed.value.mainStyle.marginRight || '0');

// 拖拽相关状态
const dragState = ref<{
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
}>({
  isDragging: false,
  dragIndex: null,
  dropIndex: null,
});

// 最大化状态
const isMaximized = ref(false);

// 标签列表容器引用
const tabsContainerRef = ref<HTMLElement | null>(null);

// 标签元素引用
const tabRefs = new Map<string, HTMLElement>();
const setTabRef = (key: string) => (el: Element | ComponentPublicInstance | null) => {
  if (!el) {
    tabRefs.delete(key);
    return;
  }
  const node = el instanceof HTMLElement ? el : (el as ComponentPublicInstance).$el;
  if (node instanceof HTMLElement) {
    tabRefs.set(key, node);
  }
};

const flipPending = ref(false);
const flipPositions = ref(new Map<string, DOMRect>());

const recordTabPositions = () => {
  const map = new Map<string, DOMRect>();
  tabRefs.forEach((el, key) => {
    map.set(key, el.getBoundingClientRect());
  });
  flipPositions.value = map;
  flipPending.value = true;
};

const animateTabPositions = () => {
  if (!flipPending.value) return;
  const prevPositions = flipPositions.value;
  flipPending.value = false;
  const movements: Array<{ el: HTMLElement; dx: number; dy: number }> = [];
  tabRefs.forEach((el, key) => {
    const prevRect = prevPositions.get(key);
    if (!prevRect) return;
    const nextRect = el.getBoundingClientRect();
    const dx = prevRect.left - nextRect.left;
    const dy = prevRect.top - nextRect.top;
    if (dx || dy) {
      movements.push({ el, dx, dy });
    }
  });
  if (!movements.length) return;
  for (const { el, dx, dy } of movements) {
    el.style.transition = 'transform 0s';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  requestAnimationFrame(() => {
    movements.forEach(({ el }) => {
      el.style.transition = 'transform 300ms var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1))';
      el.style.transform = '';
    });
    window.setTimeout(() => {
      movements.forEach(({ el }) => {
        el.style.transition = '';
      });
    }, LAYOUT_UI_TOKENS.TABBAR_SCROLL_DELAY);
  });
};

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuTargetKey = ref<string | null>(null);
const contextMenuRef = ref<HTMLElement | null>(null);

// 更多菜单
const moreMenuVisible = ref(false);
const moreMenuPosition = ref({ x: 0, y: 0 });
const moreMenuAnchorRef = ref<HTMLElement | null>(null);
const moreMenuRef = ref<HTMLElement | null>(null);

// 悬停状态
const hoveredKey = ref<string | null>(null);
const TAB_RENDER_CHUNK = LAYOUT_UI_TOKENS.TAB_RENDER_CHUNK;
const tabRenderCount = ref<number>(TAB_RENDER_CHUNK);
const chromeCornerSize = LAYOUT_UI_TOKENS.TABBAR_CHROME_CORNER_SIZE;
const tabIndexMap = computed(() => {
  const map = new Map<string, number>();
  tabs.value.forEach((tab, index) => map.set(tab.key, index));
  return map;
});
const tabMap = computed(() => {
  const map = new Map<string, (typeof tabs.value)[0]>();
  tabs.value.forEach((tab) => map.set(tab.key, tab));
  return map;
});

// 类名
const tabbarClass = computed(() => [
  'layout-tabbar',
  `layout-tabbar--${styleType.value}`,
  {
    'layout-tabbar--with-sidebar': layoutComputed.value.showSidebar && !context.props.isMobile,
    'layout-tabbar--collapsed': sidebarCollapsed.value && !context.props.isMobile,
  },
]);

const visibleTabs = computed(() => tabs.value.slice(0, tabRenderCount.value));
const showScrollButtons = computed(() => canScrollLeft.value || canScrollRight.value);

// 样式
const tabbarStyle = computed(() => {
  const style: Record<string, string> = {
    height: `${layoutComputed.value.tabbarHeight}px`,
  };

  if (isHeaderFixed.value) {
    style.position = 'fixed';
    style.top = `${layoutComputed.value.headerHeight}px`;
    style.left = leftOffset.value;
    if (panelRightOffset.value !== '0') {
      style.right = panelRightOffset.value;
    }
  } else {
    style.position = 'static';
    if (leftOffset.value !== '0') {
      style.marginLeft = leftOffset.value;
    }
    if (panelRightOffset.value !== '0') {
      style.marginRight = panelRightOffset.value;
    }
    if (leftOffset.value !== '0' || panelRightOffset.value !== '0') {
      const leftValue = leftOffset.value !== '0' ? leftOffset.value : LAYOUT_STYLE_CONSTANTS.ZERO_PX;
      const rightValue = panelRightOffset.value !== '0' ? panelRightOffset.value : LAYOUT_STYLE_CONSTANTS.ZERO_PX;
      style.width = `calc(100% - ${leftValue} - ${rightValue})`;
    }
  }

  return style;
});

watch([tabs, activeKey], () => {
  const activeIndex = tabIndexMap.value.get(activeKey.value) ?? -1;
  if (activeIndex >= 0) {
    tabRenderCount.value = Math.min(tabs.value.length, Math.max(TAB_RENDER_CHUNK, activeIndex + 1));
  } else {
    tabRenderCount.value = Math.min(TAB_RENDER_CHUNK, tabs.value.length);
  }
}, { immediate: true });

watch(tabs, () => {
  animateTabPositions();
}, { flush: 'post' });

watchEffect((onCleanup) => {
  if (tabRenderCount.value >= tabs.value.length) return;
  const frame = requestAnimationFrame(() => {
    tabRenderCount.value = Math.min(tabRenderCount.value + TAB_RENDER_CHUNK, tabs.value.length);
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

// 滚动状态
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const updateScrollState = () => {
  const container = tabsContainerRef.value;
  if (!container) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = container;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
};
const updateScrollStateThrottled = rafThrottle(updateScrollState);

const scrollTabsBy = (direction: number) => {
  const container = tabsContainerRef.value;
  if (!container) return;
  const offset = calculateTabbarScrollOffset(container.clientWidth);
  container.scrollBy({ left: offset * direction, behavior: 'smooth' });
  updateScrollStateThrottled();
};

watch([tabs, tabRenderCount], () => {
  void nextTick(() => updateScrollStateThrottled());
}, { immediate: true });

watch(activeKey, () => {
  void nextTick(() => {
    const el = tabRefs.get(activeKey.value);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
});

onMounted(() => {
  window.addEventListener('resize', updateScrollStateThrottled);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollStateThrottled);
  updateScrollStateThrottled.cancel?.();
});

// 处理标签点击
const onTabClick = (key: string) => {
  handleSelect(key);
};

const onTabMouseEnter = (key: string) => {
  if (hoveredKey.value !== key) {
    hoveredKey.value = key;
  }
};

const onTabMouseLeave = () => {
  if (hoveredKey.value !== null) {
    hoveredKey.value = null;
  }
};

// 处理标签关闭
const onTabClose = (e: Event, key: string) => {
  e.stopPropagation();
  handleClose(key);
};

// 处理右键菜单
const onContextMenu = (e: MouseEvent, key: string) => {
  e.preventDefault();
  contextMenuTargetKey.value = key;
  contextMenuPosition.value = { x: e.clientX, y: e.clientY };
  contextMenuVisible.value = true;
  moreMenuVisible.value = false;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuTargetKey.value = null;
};

const closeMoreMenu = () => {
  moreMenuVisible.value = false;
};

const openMoreMenu = () => {
  if (!moreMenuAnchorRef.value) return;
  const rect = moreMenuAnchorRef.value.getBoundingClientRect();
  moreMenuPosition.value = {
    x: rect.left,
    y: rect.bottom + 6,
  };
  moreMenuVisible.value = !moreMenuVisible.value;
  contextMenuVisible.value = false;
};

const clampMenuPosition = (position: { x: number; y: number }, el: HTMLElement | null) => {
  if (!el || typeof window === 'undefined') return position;
  const margin = 8;
  const rect = el.getBoundingClientRect();
  let x = position.x;
  let y = position.y;
  const maxX = window.innerWidth - rect.width - margin;
  const maxY = window.innerHeight - rect.height - margin;
  if (rect.left < margin) x = margin;
  if (rect.right > window.innerWidth - margin) x = Math.max(margin, maxX);
  if (rect.top < margin) y = margin;
  if (rect.bottom > window.innerHeight - margin) y = Math.max(margin, maxY);
  return { x, y };
};

watch(
  () => contextMenuVisible.value,
  async (visible) => {
    if (!visible) return;
    await nextTick();
    contextMenuPosition.value = clampMenuPosition(contextMenuPosition.value, contextMenuRef.value);
  }
);

watch(
  () => moreMenuVisible.value,
  async (visible) => {
    if (!visible) return;
    await nextTick();
    moreMenuPosition.value = clampMenuPosition(moreMenuPosition.value, moreMenuRef.value);
  }
);

const handleMenuAction = (action: ContextMenuAction | string, targetKey: string | null) => {
  if (!targetKey) return;
  switch (action) {
    case 'reload':
    case 'refresh':
      handleRefresh(targetKey);
      break;
    case 'close':
      handleClose(targetKey);
      break;
    case 'closeOther':
      handleCloseOther(targetKey);
      break;
    case 'closeLeft':
      handleCloseLeft(targetKey);
      break;
    case 'closeRight':
      handleCloseRight(targetKey);
      break;
    case 'closeAll':
      handleCloseAll();
      break;
    case 'pin':
    case 'unpin':
      handleToggleAffix(targetKey);
      break;
    case 'openInNewWindow':
      handleOpenInNewWindow(targetKey);
      break;
    case 'favorite':
    case 'unfavorite':
      handleToggleFavorite(targetKey);
      break;
    case 'maximize':
      if (!isMaximized.value) {
        if (targetKey !== activeKey.value) {
          handleSelect(targetKey);
        }
        toggleMaximize();
      }
      break;
    case 'restoreMaximize':
      if (isMaximized.value) toggleMaximize();
      break;
    default:
      break;
  }
};

const contextMenuItems = computed(() => {
  const key = contextMenuTargetKey.value;
  if (!key) return [];
  const tab = tabMap.value.get(key);
  if (!tab) return [];
  const items = generateContextMenuItems(
    tab,
    tabs.value,
    activeKey.value,
    context.t,
    tabIndexMap.value,
    { isMaximized: isMaximized.value, isFavorite: isFavorite(tab), canFavorite: canFavorite(tab) }
  );
  return items.filter((item) => {
    if (item.key === 'maximize' || item.key === 'restoreMaximize') {
      return tabbarConfig.value.showMaximize !== false;
    }
    return true;
  });
});

const moreMenuItems = computed(() => {
  const key = activeKey.value || tabs.value[0]?.key || '';
  if (!key) return [];
  const tab = tabMap.value.get(key);
  if (!tab) return [];
  const items = generateContextMenuItems(
    tab,
    tabs.value,
    activeKey.value,
    context.t,
    tabIndexMap.value,
    { isMaximized: isMaximized.value, isFavorite: isFavorite(tab), canFavorite: canFavorite(tab) }
  );
  return items.filter((item) => {
    if (item.key === 'maximize' || item.key === 'restoreMaximize') {
      return tabbarConfig.value.showMaximize !== false;
    }
    return true;
  });
});

const getTabTitle = (tab: typeof tabs.value[0]) => {
  const meta = tab.meta as Record<string, unknown> | undefined;
  const title = (meta?.newTabTitle as string | undefined) || (meta?.title as string | undefined) || tab.name;
  return context.t(title);
};

// ==================== 拖拽排序功能 ====================
const onDragStart = (e: DragEvent, index: number) => {
  if (!tabbarConfig.value.draggable) return;
  const tab = tabs.value[index];
  if (tab?.affix) {
    e.preventDefault();
    return;
  }
  dragState.value = {
    isDragging: true,
    dragIndex: index,
    dropIndex: null,
  };
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }
};

const onDragOver = (e: DragEvent, index: number) => {
  if (!tabbarConfig.value.draggable || !dragState.value.isDragging) return;
  e.preventDefault();
  const tab = tabs.value[index];
  if (tab?.affix) return;
  const fromIndex = dragState.value.dragIndex;
  dragState.value.dropIndex = index;
  if (fromIndex === null || fromIndex === index) return;
  const targetKey = tab.key;
  const targetEl = tabRefs.get(targetKey);
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const midpoint = rect.left + rect.width / 2;
  const shouldMove =
    (fromIndex < index && e.clientX > midpoint) ||
    (fromIndex > index && e.clientX < midpoint);
  if (!shouldMove) return;
  recordTabPositions();
  handleSort(fromIndex, index);
  dragState.value.dragIndex = index;
};

const onDragLeave = () => {
  dragState.value.dropIndex = null;
};

const onDrop = (e: DragEvent, toIndex: number) => {
  if (!tabbarConfig.value.draggable) return;
  e.preventDefault();
  const fromIndex = dragState.value.dragIndex;
  if (fromIndex !== null && fromIndex !== toIndex) {
    const targetTab = tabs.value[toIndex];
    if (!targetTab?.affix) {
      recordTabPositions();
      handleSort(fromIndex, toIndex);
    }
  }
  dragState.value = {
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  };
};

const onDragEnd = () => {
  dragState.value = {
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  };
};

// ==================== 中键关闭功能 ====================
const onMouseDown = (e: MouseEvent, tab: typeof tabs.value[0]) => {
  if (e.button === 1 && tabbarConfig.value.middleClickToClose !== false) {
    e.preventDefault();
    if (tab.closable !== false && !tab.affix) {
      handleClose(tab.key);
    }
  }
};

// ==================== 滚轮滚动 ====================
const onWheel = (e: WheelEvent) => {
  if (!tabbarConfig.value.wheelable) return;
  const container = tabsContainerRef.value;
  if (!container) return;
  if (container.scrollWidth <= container.clientWidth) return;
  e.preventDefault();
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  container.scrollLeft += delta;
  updateScrollStateThrottled();
};

// ==================== 最大化功能 ====================
const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  context.events?.onTabMaximize?.(isMaximized.value);
  if (isMaximized.value) {
    document.body.classList.add('layout-content-maximized');
    document.body.dataset.contentMaximized = 'true';
  } else {
    document.body.classList.remove('layout-content-maximized');
    delete document.body.dataset.contentMaximized;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    toggleMaximize();
  }
};

const syncKeydownListener = (enabled: boolean) => {
  document.removeEventListener('keydown', handleKeyDown);
  if (enabled) {
    document.addEventListener('keydown', handleKeyDown);
  }
};

watch(isMaximized, (value) => {
  syncKeydownListener(value);
}, { immediate: true });

onUnmounted(() => {
  syncKeydownListener(false);
  document.body.classList.remove('layout-content-maximized');
  delete document.body.dataset.contentMaximized;
});
</script>

<template>
  <div
    :class="tabbarClass"
    :style="tabbarStyle"
    :data-with-sidebar="layoutComputed.showSidebar && !context.props.isMobile ? 'true' : undefined"
    :data-collapsed="sidebarCollapsed && !context.props.isMobile ? 'true' : undefined"
    :data-style="styleType"
    @click="() => { closeContextMenu(); closeMoreMenu(); }"
  >
    <div class="layout-tabbar__inner flex h-full">
      <!-- 左侧插槽 -->
      <div v-if="$slots.left" class="layout-tabbar__left shrink-0 px-2">
        <slot name="left" />
      </div>

      <!-- 左侧滚动按钮 -->
      <button
        v-if="showScrollButtons"
        type="button"
        class="layout-tabbar__scroll-btn layout-tabbar__scroll-btn--left"
        :data-disabled="canScrollLeft ? 'false' : 'true'"
        :disabled="!canScrollLeft"
        @click.stop="canScrollLeft && scrollTabsBy(-1)"
      >
        <LayoutIcon name="tabbar-scroll-left" size="sm" />
      </button>

      <!-- 标签列表 -->
      <div
        ref="tabsContainerRef"
        class="layout-tabbar__tabs layout-scroll-container flex h-full flex-1 overflow-x-auto scrollbar-none"
        :data-dragging="dragState.isDragging ? 'true' : undefined"
        @wheel="onWheel"
        @scroll="updateScrollStateThrottled"
      >
        <slot>
          <div
            v-for="(tab, index) in visibleTabs"
            :key="tab.key"
            :ref="setTabRef(tab.key)"
            :class="[
              'data-active:text-primary',
              'group',
              'layout-tabbar__tab',
              `layout-tabbar__tab--${styleType}`,
              {
                'layout-tabbar__tab--active': tab.key === activeKey,
                'layout-tabbar__tab--affix': !!tab.affix,
                'layout-tabbar__tab--dragging': dragState.isDragging && dragState.dragIndex === index,
                'layout-tabbar__tab--drop-target': dragState.isDragging && dragState.dropIndex === index,
              },
            ]"
            :data-index="index"
            :data-state="tab.key === activeKey ? 'active' : 'inactive'"
            :data-style="styleType"
            :data-hovered="hoveredKey === tab.key ? 'true' : undefined"
            :data-affix="tab.affix ? 'true' : undefined"
            :data-dragging="dragState.isDragging && dragState.dragIndex === index ? 'true' : undefined"
            :data-drop-target="dragState.isDragging && dragState.dropIndex === index ? 'true' : undefined"
            :draggable="tabbarConfig.draggable && !tab.affix"
            @click="onTabClick(tab.key)"
            @contextmenu="onContextMenu($event, tab.key)"
            @mouseenter="onTabMouseEnter(tab.key)"
            @mouseleave="onTabMouseLeave"
            @mousedown="onMouseDown($event, tab)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <template v-if="styleType === 'chrome'">
              <div class="layout-tabbar__chrome">
                <div class="layout-tabbar__chrome-divider" />
                <div class="layout-tabbar__chrome-bg">
                  <div class="layout-tabbar__chrome-bg-content" />
                  <svg
                    class="layout-tabbar__chrome-bg-before"
                    :height="chromeCornerSize"
                    :width="chromeCornerSize"
                    viewBox="0 0 7 7"
                  >
                    <path :d="TABBAR_CHROME_SVG_PATHS.before" />
                  </svg>
                  <svg
                    class="layout-tabbar__chrome-bg-after"
                    :height="chromeCornerSize"
                    :width="chromeCornerSize"
                    viewBox="0 0 7 7"
                  >
                    <path :d="TABBAR_CHROME_SVG_PATHS.after" />
                  </svg>
                </div>
                <div class="layout-tabbar__chrome-main">
                  <!-- 图标 -->
                  <span v-if="tabbarConfig.showIcon && tab.icon" class="layout-tabbar__tab-icon">
                    <slot name="tab-icon" :tab="tab">
                      <span class="text-sm">{{ tab.icon }}</span>
                    </slot>
                  </span>

                  <!-- 名称 -->
                  <span class="layout-tabbar__tab-name truncate">
                    {{ getTabTitle(tab) }}
                  </span>
                </div>
                <div class="layout-tabbar__chrome-extra">
                  <!-- 固定图标 -->
                  <button
                    v-if="tab.affix"
                    type="button"
                    class="layout-tabbar__tab-pin"
                    @click.stop="handleToggleAffix(tab.key)"
                  >
                    <LayoutIcon name="tabbar-pin" size="xs" />
                  </button>

                  <!-- 关闭按钮 -->
                  <button
                    v-if="tab.closable !== false && !tab.affix"
                    type="button"
                    class="layout-tabbar__tab-close"
                    @click="onTabClose($event, tab.key)"
                  >
                    <LayoutIcon name="tabbar-close" size="xs" />
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="layout-tabbar__tab-content">
                <div class="layout-tabbar__tab-extra">
                  <!-- 关闭按钮 -->
                  <button
                    v-if="tab.closable !== false && !tab.affix"
                    type="button"
                    class="layout-tabbar__tab-close"
                    @click="onTabClose($event, tab.key)"
                  >
                    <LayoutIcon name="tabbar-close" size="xs" />
                  </button>

                  <!-- 固定图标 -->
                  <button
                    v-if="tab.affix"
                    type="button"
                    class="layout-tabbar__tab-pin"
                    @click.stop="handleToggleAffix(tab.key)"
                  >
                    <LayoutIcon name="tabbar-pin" size="xs" />
                  </button>
                </div>
                <div class="layout-tabbar__tab-main">
                  <!-- 图标 -->
                  <span v-if="tabbarConfig.showIcon && tab.icon" class="layout-tabbar__tab-icon">
                    <slot name="tab-icon" :tab="tab">
                      <span class="text-sm">{{ tab.icon }}</span>
                    </slot>
                  </span>

                  <!-- 名称 -->
                  <span class="layout-tabbar__tab-name truncate">
                    {{ getTabTitle(tab) }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </slot>
      </div>

      <!-- 右侧滚动按钮 -->
      <button
        v-if="showScrollButtons"
        type="button"
        class="layout-tabbar__scroll-btn layout-tabbar__scroll-btn--right"
        :data-disabled="canScrollRight ? 'false' : 'true'"
        :disabled="!canScrollRight"
        @click.stop="canScrollRight && scrollTabsBy(1)"
      >
        <LayoutIcon name="tabbar-scroll-right" size="sm" />
      </button>

      <!-- 右侧插槽 -->
      <div v-if="$slots.right" class="layout-tabbar__right shrink-0 px-2">
        <slot name="right" />
      </div>

      <!-- 最大化按钮 -->
      <button
        v-if="tabbarConfig.showMaximize"
        type="button"
        class="layout-tabbar__tool-btn"
        :title="isMaximized ? context.t('layout.tabbar.restore') : context.t('layout.tabbar.maximize')"
        @click.stop="toggleMaximize"
      >
        <LayoutIcon v-if="!isMaximized" name="tabbar-maximize" size="sm" />
        <LayoutIcon v-else name="tabbar-restore" size="sm" />
      </button>

      <!-- 更多操作 -->
      <div v-if="tabbarConfig.showMore !== false" class="layout-tabbar__more">
        <slot name="extra">
          <button
            ref="moreMenuAnchorRef"
            type="button"
            class="layout-tabbar__tool-btn"
            :title="context.t('layout.common.more')"
            @click.stop="openMoreMenu"
          >
            <LayoutIcon name="tabbar-more" size="sm" />
          </button>
        </slot>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        ref="contextMenuRef"
        class="layout-tabbar__context-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
        :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
      >
        <template v-for="item in contextMenuItems" :key="item.key">
          <div v-if="item.divider" class="my-1 h-px bg-border" />
          <button
            v-else
            type="button"
            class="layout-tabbar__menu-item flex w-full items-center px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="item.disabled"
            @click="() => { handleMenuAction(item.key, contextMenuTargetKey); closeContextMenu(); }"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </Teleport>

    <!-- 点击空白关闭菜单的遮罩 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="fixed inset-0 z-layout-overlay"
        @click="closeContextMenu"
      />
    </Teleport>

    <!-- 更多菜单 -->
    <Teleport to="body">
      <div
        v-if="moreMenuVisible"
        ref="moreMenuRef"
        class="layout-tabbar__more-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
        :style="{ left: `${moreMenuPosition.x}px`, top: `${moreMenuPosition.y}px` }"
      >
        <template v-for="item in moreMenuItems" :key="item.key">
          <div v-if="item.divider" class="my-1 h-px bg-border" />
          <button
            v-else
            type="button"
            class="layout-tabbar__menu-item flex w-full items-center px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="item.disabled"
            @click="() => { handleMenuAction(item.key, activeKey || tabs[0]?.key || null); closeMoreMenu(); }"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="moreMenuVisible"
        class="fixed inset-0 z-layout-overlay"
        @click="closeMoreMenu"
      />
    </Teleport>
  </div>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
