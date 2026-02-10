<script setup lang="ts">
/**
 * 菜单组件
 * @description 参考常见 admin 布局实现，支持水平/垂直模式、折叠、手风琴等。
 * 行为逻辑（激活/展开/溢出/类名等）统一由 @admin-core/layout 提供的 headless menu-controller 处理。
 */
import { computed, ref, watch, watchEffect, onMounted, onUnmounted, nextTick } from 'vue';
import { createMenuContext, type MenuItemClicked } from './use-menu-context';
import SubMenu from './SubMenu.vue';
import MenuItemComp from './MenuItem.vue';
import {
  LAYOUT_UI_TOKENS,
  rafThrottle,
  calculateVirtualRange,
  shouldVirtualize,
  type MenuItem,
  normalizeMenuKey,
  buildMenuParentPathMap,
  buildActiveParentSet,
  computeOpenedMenusOnOpen,
  computeOpenedMenusOnClose,
  computeOpenedMenusOnCollapseChange,
  isMenuPopup as computeIsMenuPopup,
  computeBaseVisibleMenus,
  computeOverflowMenus,
  getMenuRootClassName,
} from '@admin-core/layout';

interface Props {
  /** 菜单数据 */
  menus?: MenuItem[];
  /** 模式 */
  mode?: 'horizontal' | 'vertical';
  /** 是否折叠（仅垂直模式） */
  collapse?: boolean;
  /** 手风琴模式 */
  accordion?: boolean;
  /** 圆角样式 */
  rounded?: boolean;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 默认激活路径 */
  defaultActive?: string;
  /** 默认展开的菜单 */
  defaultOpeneds?: string[];
  /** 更多菜单文本 */
  moreLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  mode: 'horizontal',
  collapse: false,
  accordion: true,
  rounded: true,
  theme: 'light',
  defaultActive: '',
  defaultOpeneds: () => [],
  moreLabel: 'More',
});

const emit = defineEmits<{
  select: [path: string, parentPaths: string[]];
  open: [path: string, parentPaths: string[]];
  close: [path: string, parentPaths: string[]];
}>();

// 状态
const activePath = ref(normalizeMenuKey(props.defaultActive));
const openedMenus = ref<string[]>(
  props.defaultOpeneds && !props.collapse
    ? props.defaultOpeneds.map((key) => normalizeMenuKey(key)).filter(Boolean)
    : []
);
const openedMenuSet = computed(() => new Set(openedMenus.value));
const parentPathMap = computed(() => buildMenuParentPathMap(props.menus));
const activeParentSet = computed(() => buildActiveParentSet(activePath.value, parentPathMap.value));

// 监听 defaultActive 变化
watch(() => props.defaultActive, (val) => {
  const nextActive = normalizeMenuKey(val);
  if (activePath.value !== nextActive) {
    activePath.value = nextActive;
  }
});

// 折叠时关闭所有菜单
watch(() => props.collapse, (val) => {
  openedMenus.value = computeOpenedMenusOnCollapseChange(openedMenus.value, val);
});

// 是否为弹出模式
const isMenuPopup = computed(() => computeIsMenuPopup(props.mode, props.collapse));

// 打开菜单
const openMenu = (path: string, parentPaths: string[] = []) => {
  const next = computeOpenedMenusOnOpen(openedMenus.value, path, {
    accordion: props.accordion,
    parentPaths,
  });
  if (next === openedMenus.value) return;
  openedMenus.value = next;
  const normalizedTarget = normalizeMenuKey(path);
  const normalizedParents = parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
  if (normalizedTarget) {
    emit('open', normalizedTarget, normalizedParents);
  }
};

// 关闭菜单
const closeMenu = (path: string, parentPaths: string[] = []) => {
  const target = normalizeMenuKey(path);
  if (!target) return;
  const next = computeOpenedMenusOnClose(openedMenus.value, target);
  if (next === openedMenus.value) return;
  openedMenus.value = next;
  emit('close', target, parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean));
};

// 关闭所有菜单
const closeAllMenus = () => {
  if (openedMenus.value.length > 0) {
    openedMenus.value = [];
  }
};

// 处理菜单项点击
const handleMenuItemClick = (data: MenuItemClicked) => {
  const path = normalizeMenuKey(data.path);
  const parentPaths = data.parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
  if (!path) return;
  
  // 弹出模式下点击菜单项关闭所有菜单
  if (isMenuPopup.value) {
    if (openedMenus.value.length > 0) {
      openedMenus.value = [];
    }
  }
  
  if (activePath.value !== path) {
    activePath.value = path;
  }
  emit('select', path, parentPaths);
};

// 创建上下文
createMenuContext({
  props: {
    get mode() { return props.mode; },
    get collapse() { return props.collapse; },
    get accordion() { return props.accordion; },
    get rounded() { return props.rounded; },
    get theme() { return props.theme; },
  },
  activePath,
  activeParentSet,
  openedMenus,
  openedMenuSet,
  openMenu,
  closeMenu,
  closeAllMenus,
  handleMenuItemClick,
  get isMenuPopup() { return isMenuPopup.value; },
});

// 溢出处理（仅水平模式）
const menuRef = ref<HTMLElement | null>(null);
const sliceIndex = ref(-1);
const resizeRaf = ref<number | null>(null);
const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
const renderCount = ref<number>(RENDER_CHUNK);
const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const itemHeight = ref(40);
const VIRTUAL_OVERSCAN = LAYOUT_UI_TOKENS.VIRTUAL_OVERSCAN;
const scrollResizeObserver = ref<ResizeObserver | null>(null);
const itemResizeObserver = ref<ResizeObserver | null>(null);

const baseVisibleMenus = computed(() => {
  return computeBaseVisibleMenus({
    menus: props.menus,
    mode: props.mode,
    sliceIndex: sliceIndex.value,
    renderCount: renderCount.value,
  });
});

const canVirtualize = computed(() =>
  shouldVirtualize({
    enabled: props.mode === 'vertical' && props.collapse,
    viewportHeight: viewportHeight.value,
    itemHeight: itemHeight.value,
    totalItems: props.menus.length,
  })
);
const virtualRange = computed(() =>
  calculateVirtualRange({
    scrollTop: scrollTop.value,
    viewportHeight: viewportHeight.value,
    itemHeight: itemHeight.value,
    totalItems: props.menus.length,
    overscan: VIRTUAL_OVERSCAN,
  })
);
const virtualMenus = computed(() =>
  props.menus.slice(virtualRange.value.startIndex, virtualRange.value.endIndex)
);
const renderMenus = computed(() => (canVirtualize.value ? virtualMenus.value : baseVisibleMenus.value));
const listStyle = computed(() => {
  if (!canVirtualize.value) return undefined;
  return {
    paddingTop: `${virtualRange.value.startIndex * itemHeight.value}px`,
    paddingBottom: `${(props.menus.length - virtualRange.value.endIndex) * itemHeight.value}px`,
  };
});

watch(
  [canVirtualize, () => props.menus.length, virtualRange, viewportHeight, scrollTop],
  ([enabled, total, , viewHeight, currentTop]) => {
    if (!enabled) return;
    const totalHeight = total * itemHeight.value;
    const maxScrollTop = Math.max(0, totalHeight - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = nextTop;
    }
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
);

const overflowMenus = computed(() =>
  computeOverflowMenus({
    menus: props.menus,
    mode: props.mode,
    sliceIndex: sliceIndex.value,
  })
);

const hasOverflow = computed(() => overflowMenus.value.length > 0);

// 计算菜单项宽度
const calcMenuItemWidth = (item: HTMLElement): number => {
  const style = getComputedStyle(item);
  const marginLeft = parseFloat(style.marginLeft) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  return item.offsetWidth + marginLeft + marginRight;
};

const getMenuKey = (item: MenuItem) => {
  const raw = item.key ?? item.path ?? item.name ?? '';
  return raw === '' ? '' : String(raw);
};

const menuWidthCache = new Map<string, number>();

// 计算切片索引（避免更多按钮闪烁）
const calcSliceIndex = (): number => {
  if (!menuRef.value) return -1;

  const container = menuRef.value;
  const widthTarget = menuRef.value.parentElement ?? menuRef.value;
  const children = Array.from(container.children) as HTMLElement[];
  const items = children.filter((el) => {
    if (!el) return false;
    if (el.classList?.contains('menu__sub-menu--more')) return false;
    if (el.getAttribute?.('data-more') === 'true') return false;
    return true;
  });

  if (items.length === 0) return -1;

  const containerStyle = getComputedStyle(widthTarget);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
  const availableWidth = widthTarget.clientWidth - paddingLeft - paddingRight;

  // 更新已渲染项的宽度缓存
  for (const item of items) {
    const key = item.getAttribute?.('data-key');
    if (!key) continue;
    menuWidthCache.set(key, calcMenuItemWidth(item));
  }

  const orderedKeys = props.menus.map(getMenuKey).filter(Boolean);
  const cachedWidths = orderedKeys.map((key) => menuWidthCache.get(key));
  const hasMissingWidth = cachedWidths.some((width) => width == null);
  const isOverflowing = orderedKeys.length > items.length;

  if (hasMissingWidth && isOverflowing) {
    return sliceIndex.value;
  }

  let totalWidth = 0;
  for (const width of cachedWidths) {
    totalWidth += width ?? 0;
  }

  // 全部可显示，无需溢出
  if (totalWidth <= availableWidth) return -1;

  const moreEl = container.querySelector(':scope > .menu__sub-menu--more, :scope > .menu__sub-menu[data-more="true"]') as HTMLElement | null;
  const moreButtonWidth = moreEl ? calcMenuItemWidth(moreEl) : 50;
  const maxWidth = Math.max(0, availableWidth - moreButtonWidth);

  let visibleWidth = 0;
  let lastVisibleIndex = 0;
  for (let i = 0; i < cachedWidths.length; i++) {
    const width = cachedWidths[i];
    if (width == null) {
      return sliceIndex.value;
    }
    visibleWidth += width;
    if (visibleWidth <= maxWidth) {
      lastVisibleIndex = i + 1;
    }
  }

  return lastVisibleIndex === orderedKeys.length ? -1 : lastVisibleIndex;
};

const handleResize = () => {
  if (resizeRaf.value !== null) return;
  resizeRaf.value = requestAnimationFrame(() => {
    resizeRaf.value = null;
    if (props.mode !== 'horizontal') {
      if (sliceIndex.value !== -1) {
        sliceIndex.value = -1;
      }
      return;
    }
    const nextIndex = calcSliceIndex();
    if (sliceIndex.value !== nextIndex) {
      sliceIndex.value = nextIndex;
    }
  });
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (props.mode === 'horizontal' && menuRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(menuRef.value.parentElement ?? menuRef.value);
    nextTick(handleResize);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (resizeRaf.value !== null) {
    cancelAnimationFrame(resizeRaf.value);
    resizeRaf.value = null;
  }
});

// 监听模式变化
watchEffect(() => {
  if (props.mode === 'horizontal' && menuRef.value) {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(menuRef.value.parentElement ?? menuRef.value);
    }
    nextTick(handleResize);
  } else {
    resizeObserver?.disconnect();
    resizeObserver = null;
    sliceIndex.value = -1;
  }
});

watchEffect((onCleanup) => {
  if (props.mode !== 'vertical' || !props.collapse) return;
  const menuEl = menuRef.value;
  if (!menuEl) return;
  const container = menuEl.closest('.layout-scroll-container') as HTMLElement | null;
  if (!container) return;
  scrollContainer.value = container;

  const handleScroll = rafThrottle(() => {
    const nextTop = container.scrollTop;
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  });
  const updateItemHeight = () => {
    const computedStyle = getComputedStyle(menuEl);
    const heightValue = parseFloat(computedStyle.getPropertyValue('--menu-item-height'));
    if (!Number.isNaN(heightValue) && heightValue > 0) {
      itemHeight.value = heightValue;
    }
    const firstItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
    if (firstItem) {
      const measuredHeight = firstItem.getBoundingClientRect().height;
      if (measuredHeight > 0 && measuredHeight !== itemHeight.value) {
        itemHeight.value = measuredHeight;
      }
    }
  };
  const updateMetrics = rafThrottle(() => {
    const nextHeight = container.clientHeight;
    if (viewportHeight.value !== nextHeight) {
      viewportHeight.value = nextHeight;
    }
    updateItemHeight();
  });

  updateMetrics();
  handleScroll();
  container.addEventListener('scroll', handleScroll, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    scrollResizeObserver.value = new ResizeObserver(updateMetrics);
    scrollResizeObserver.value.observe(container);
  } else {
    window.addEventListener('resize', updateMetrics);
  }
  if (typeof ResizeObserver !== 'undefined') {
    let observedItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
    if (observedItem) {
      itemResizeObserver.value?.disconnect();
      itemResizeObserver.value = new ResizeObserver(() => {
        const currentItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
        if (!currentItem) return;
        if (currentItem !== observedItem) {
          if (observedItem) {
            itemResizeObserver.value?.unobserve(observedItem);
          }
          itemResizeObserver.value?.observe(currentItem);
          observedItem = currentItem;
        }
        const measuredHeight = currentItem.getBoundingClientRect().height;
        if (measuredHeight > 0 && measuredHeight !== itemHeight.value) {
          itemHeight.value = measuredHeight;
        }
      });
      itemResizeObserver.value.observe(observedItem);
    }
  }
  onCleanup(() => {
    container.removeEventListener('scroll', handleScroll);
    if (scrollResizeObserver.value) {
      scrollResizeObserver.value.disconnect();
      scrollResizeObserver.value = null;
  } else {
    window.removeEventListener('resize', updateMetrics);
    }
    if (itemResizeObserver.value) {
      itemResizeObserver.value.disconnect();
      itemResizeObserver.value = null;
    }
  });
});

watch([() => props.menus, () => props.mode, canVirtualize], () => {
  const nextCount =
    props.mode !== 'vertical' || canVirtualize.value
      ? props.menus.length
      : Math.min(RENDER_CHUNK, props.menus.length);
  if (renderCount.value !== nextCount) {
    renderCount.value = nextCount;
  }
}, { deep: true, immediate: true });

watchEffect((onCleanup) => {
  if (props.mode !== 'vertical' || canVirtualize.value || renderCount.value >= props.menus.length) return;
  const frame = requestAnimationFrame(() => {
    renderCount.value = Math.min(renderCount.value + RENDER_CHUNK, props.menus.length);
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

// 监听菜单变化
watch(() => props.menus, () => {
  if (props.mode === 'horizontal') {
    nextTick(handleResize);
  }
}, { deep: true });

// 菜单类名
const menuClass = computed(() =>
  getMenuRootClassName({
    mode: props.mode,
    theme: props.theme,
    collapse: props.collapse,
    rounded: props.rounded,
  })
);
</script>

<template>
  <ul
    ref="menuRef"
    :class="menuClass"
    :data-mode="props.mode"
    :data-theme="props.theme"
    :data-rounded="props.rounded ? 'true' : undefined"
    :data-collapse="props.collapse ? 'true' : undefined"
    :style="listStyle"
  >
    <template v-for="item in renderMenus" :key="item.key">
      <!-- 有子菜单 -->
      <SubMenu
        v-if="item.children && item.children.length > 0"
        :item="item"
        :level="0"
        :data-key="getMenuKey(item)"
      />
      <!-- 无子菜单 -->
      <MenuItemComp
        v-else
        :item="item"
        :level="0"
        :data-key="getMenuKey(item)"
      />
    </template>
    
    <!-- 更多按钮（溢出菜单） -->
    <SubMenu
      v-if="hasOverflow"
      :item="{ key: '__more__', name: props.moreLabel, children: overflowMenus }"
      :level="0"
      is-more
    />
  </ul>
</template>

<style>
/* 样式在 CSS 文件中定义 */
</style>
