<script setup lang="ts">
/**
 * 标签栏组件
 * @description 支持拖拽排序、中键关闭、滚轮滚动、最大化、右键菜单等功能
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect, type ComponentPublicInstance } from 'vue';
import { useLayoutContext, useLayoutComputed, useTabsState, useSidebarState } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { generateContextMenuItems, type ContextMenuAction, LAYOUT_UI_TOKENS, LAYOUT_STYLE_CONSTANTS, TABBAR_CHROME_SVG_PATHS, rafThrottle, calculateTabbarScrollOffset } from '@admin-core/layout';

/**
 * 布局上下文
 * @description 提供标签栏配置、国际化方法与布局事件能力。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 提供头部高度、标签栏高度与主区域偏移等计算值。
 */
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

/**
 * 标签栏配置
 * @description 从布局上下文读取标签栏配置并做空对象兜底。
 */
const tabbarConfig = computed(() => context.props.tabbar || {});
/**
 * 标签栏样式类型
 * @description 默认使用 `chrome` 视觉风格。
 */
const styleType = computed(() => tabbarConfig.value.styleType || 'chrome');
/**
 * 头部模式
 * @description 用于判断标签栏采用固定定位还是文档流布局。
 */
const headerMode = computed(() => context.props.header?.mode || 'fixed');
/**
 * 头部是否固定
 * @description 非 `static` 模式时视为固定头部。
 */
const isHeaderFixed = computed(() => headerMode.value !== 'static');
/**
 * 主区域左偏移
 * @description 标签栏固定时用于对齐侧栏宽度偏移。
 */
const leftOffset = computed(() => layoutComputed.value.mainStyle.marginLeft || '0');
/**
 * 面板右偏移
 * @description 标签栏固定时用于规避右侧面板占位。
 */
const panelRightOffset = computed(() => layoutComputed.value.mainStyle.marginRight || '0');

/**
 * 标签拖拽状态
 * @description 记录拖拽中的源索引与目标索引。
 */
const dragState = ref<{
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
}>({
  isDragging: false,
  dragIndex: null,
  dropIndex: null,
});

/**
 * 标签栏最大化状态
 * @description 控制当前内容区域是否处于最大化展示态。
 */
const isMaximized = ref(false);

/**
 * 标签滚动容器引用
 * @description 用于滚动定位与左右滚动能力判断。
 */
const tabsContainerRef = ref<HTMLElement | null>(null);

/**
 * 标签节点引用映射
 * @description 以标签 key 为索引缓存 DOM 节点，用于滚动与 FLIP 动画。
 */
const tabRefs = new Map<string, HTMLElement>();

/**
 * 绑定/解绑标签节点引用，用于滚动定位与 FLIP 动画计算。
 *
 * @param key 标签键。
 * @returns Vue ref 回调。
 */
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

/**
 * FLIP 动画待执行标记
 * @description 记录是否有待执行的位置过渡动画。
 */
const flipPending = ref(false);
/**
 * FLIP 旧位置信息缓存
 * @description 记录排序前各标签矩形位置。
 */
const flipPositions = ref(new Map<string, DOMRect>());

/**
 * 记录当前标签节点位置，用于后续 FLIP 过渡动画。
 */
const recordTabPositions = () => {
  const map = new Map<string, DOMRect>();
  tabRefs.forEach((el, key) => {
    map.set(key, el.getBoundingClientRect());
  });
  flipPositions.value = map;
  flipPending.value = true;
};

/**
 * 执行 FLIP 动画，使拖拽排序后的标签位置过渡更平滑。
 */
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

/**
 * 右键菜单显示状态
 * @description 控制标签右键上下文菜单显隐。
 */
const contextMenuVisible = ref(false);
/**
 * 右键菜单位置
 * @description 记录上下文菜单的屏幕坐标。
 */
const contextMenuPosition = ref({ x: 0, y: 0 });
/**
 * 右键菜单目标标签键
 * @description 标记当前被右键操作的标签。
 */
const contextMenuTargetKey = ref<string | null>(null);
/**
 * 右键菜单节点引用
 * @description 用于菜单弹层位置视口约束计算。
 */
const contextMenuRef = ref<HTMLElement | null>(null);

/**
 * 更多菜单显示状态
 * @description 控制“更多”下拉菜单显隐。
 */
const moreMenuVisible = ref(false);
/**
 * 更多菜单位置
 * @description 记录“更多”菜单弹层坐标。
 */
const moreMenuPosition = ref({ x: 0, y: 0 });
/**
 * 更多菜单锚点节点引用
 * @description 用于计算弹层初始位置。
 */
const moreMenuAnchorRef = ref<HTMLElement | null>(null);
/**
 * 更多菜单节点引用
 * @description 用于视口边界内位置修正。
 */
const moreMenuRef = ref<HTMLElement | null>(null);

/**
 * 当前悬停标签键
 * @description 用于 hover 态按钮显隐与样式控制。
 */
const hoveredKey = ref<string | null>(null);
/**
 * 标签分批渲染批次大小
 * @description 控制标签列表渐进渲染步长。
 */
const TAB_RENDER_CHUNK = LAYOUT_UI_TOKENS.TAB_RENDER_CHUNK;
/**
 * 当前已渲染标签数量
 * @description 与分批渲染逻辑配合，避免初次渲染卡顿。
 */
const tabRenderCount = ref<number>(TAB_RENDER_CHUNK);
/**
 * Chrome 风格角标尺寸
 * @description 用于渲染标签角装饰时的尺寸常量。
 */
const chromeCornerSize = LAYOUT_UI_TOKENS.TABBAR_CHROME_CORNER_SIZE;
/**
 * 标签索引映射
 * @description 提供 `key -> index` 快速查询。
 */
const tabIndexMap = computed(() => {
  const map = new Map<string, number>();
  tabs.value.forEach((tab, index) => map.set(tab.key, index));
  return map;
});
/**
 * 标签实体映射
 * @description 提供 `key -> tab` 快速查询。
 */
const tabMap = computed(() => {
  const map = new Map<string, (typeof tabs.value)[0]>();
  tabs.value.forEach((tab) => map.set(tab.key, tab));
  return map;
});

/**
 * 标签栏根类名集合
 * @description 根据样式类型、侧栏状态与移动端状态生成。
 */
const tabbarClass = computed(() => [
  'layout-tabbar',
  `layout-tabbar--${styleType.value}`,
  {
    'layout-tabbar--with-sidebar': layoutComputed.value.showSidebar && !context.props.isMobile,
    'layout-tabbar--collapsed': sidebarCollapsed.value && !context.props.isMobile,
  },
]);

/**
 * 可见标签集合
 * @description 按渲染计数截取当前应渲染的标签项。
 */
const visibleTabs = computed(() => tabs.value.slice(0, tabRenderCount.value));
/**
 * 是否显示左右滚动按钮
 * @description 当任一方向可滚动时显示滚动控制按钮。
 */
const showScrollButtons = computed(() => canScrollLeft.value || canScrollRight.value);

/**
 * 标签栏样式对象
 * @description 按头部模式与左右偏移生成定位与尺寸样式。
 */
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

/**
 * 是否可向左滚动
 * @description 由滚动容器当前位置实时计算。
 */
const canScrollLeft = ref(false);
/**
 * 是否可向右滚动
 * @description 由滚动容器剩余可滚动距离计算。
 */
const canScrollRight = ref(false);

/**
 * 同步标签栏左右滚动可用状态。
 */
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
/**
 * 滚动状态更新节流函数
 * @description 对滚动状态计算做 `raf` 节流，降低频繁回流开销。
 */
const updateScrollStateThrottled = rafThrottle(updateScrollState);

/**
 * 按方向滚动标签栏。
 *
 * @param direction 方向，`1` 为向右，`-1` 为向左。
 */
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

/**
 * 处理标签点击并切换激活项。
 *
 * @param key 标签键。
 */
const onTabClick = (key: string) => {
  handleSelect(key);
};

/**
 * 处理标签鼠标移入，更新悬停态。
 *
 * @param key 标签键。
 */
const onTabMouseEnter = (key: string) => {
  if (hoveredKey.value !== key) {
    hoveredKey.value = key;
  }
};

/**
 * 处理标签鼠标移出，清除悬停态。
 */
const onTabMouseLeave = () => {
  if (hoveredKey.value !== null) {
    hoveredKey.value = null;
  }
};

/**
 * 处理标签关闭按钮点击。
 *
 * @param e 原始事件。
 * @param key 标签键。
 */
const onTabClose = (e: Event, key: string) => {
  e.stopPropagation();
  handleClose(key);
};

/**
 * 打开标签右键菜单。
 *
 * @param e 鼠标事件。
 * @param key 目标标签键。
 */
const onContextMenu = (e: MouseEvent, key: string) => {
  e.preventDefault();
  contextMenuTargetKey.value = key;
  contextMenuPosition.value = { x: e.clientX, y: e.clientY };
  contextMenuVisible.value = true;
  moreMenuVisible.value = false;
};

/**
 * 关闭右键菜单并清空目标标签。
 */
const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuTargetKey.value = null;
};

/**
 * 关闭“更多”菜单。
 */
const closeMoreMenu = () => {
  moreMenuVisible.value = false;
};

/**
 * 打开/关闭“更多”菜单并计算弹层锚点位置。
 */
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

/**
 * 将菜单弹层位置限制在视口范围内。
 *
 * @param position 原始位置。
 * @param el 菜单容器元素。
 * @returns 修正后的位置。
 */
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

/**
 * 执行标签上下文菜单动作。
 *
 * @param action 菜单动作标识。
 * @param targetKey 目标标签键。
 */
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

/**
 * 标签右键菜单项集合
 * @description 基于目标标签、激活键和配置动态生成可用操作。
 */
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

/**
 * “更多”菜单项集合
 * @description 基于当前激活标签生成通用操作菜单。
 */
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

/**
 * 获取标签展示标题并执行国际化转换。
 *
 * @param tab 标签对象。
 * @returns 标签显示文案。
 */
const getTabTitle = (tab: typeof tabs.value[0]) => {
  const meta = tab.meta as Record<string, unknown> | undefined;
  const title = (meta?.newTabTitle as string | undefined) || (meta?.title as string | undefined) || tab.name;
  return context.t(title);
};

/**
 * 拖拽排序功能区。
 */
/**
 * 处理标签拖拽开始事件。
 *
 * @param e 拖拽事件。
 * @param index 被拖拽标签索引。
 */
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

/**
 * 处理拖拽经过事件并在达到阈值时执行排序。
 *
 * @param e 拖拽事件。
 * @param index 当前经过标签索引。
 */
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

/**
 * 处理拖拽离开事件。
 */
const onDragLeave = () => {
  dragState.value.dropIndex = null;
};

/**
 * 处理拖拽释放并提交最终排序结果。
 *
 * @param e 拖拽事件。
 * @param toIndex 释放目标索引。
 */
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

/**
 * 处理拖拽结束并重置状态。
 */
const onDragEnd = () => {
  dragState.value = {
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  };
};

/**
 * 中键关闭功能区。
 */
/**
 * 处理中键点击关闭标签。
 *
 * @param e 鼠标事件。
 * @param tab 当前标签。
 */
const onMouseDown = (e: MouseEvent, tab: typeof tabs.value[0]) => {
  if (e.button === 1 && tabbarConfig.value.middleClickToClose !== false) {
    e.preventDefault();
    if (tab.closable !== false && !tab.affix) {
      handleClose(tab.key);
    }
  }
};

/**
 * 滚轮滚动功能区。
 */
/**
 * 处理标签栏滚轮滚动。
 *
 * @param e 滚轮事件。
 */
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

/**
 * 最大化功能区。
 */
/**
 * 切换内容区域最大化状态，并同步 body 样式标记。
 */
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

/**
 * 处理全局快捷键，支持 `Escape` 退出最大化。
 *
 * @param e 键盘事件。
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    toggleMaximize();
  }
};

/**
 * 同步全局 `keydown` 监听状态。
 *
 * @param enabled 是否启用监听。
 */
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
