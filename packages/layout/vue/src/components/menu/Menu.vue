<script setup lang="ts">
/**
 * 菜单组件
 * @description 参考 vben-admin 实现，支持水平/垂直模式、折叠、手风琴等
 */
import { computed, ref, watch, watchEffect, onMounted, onUnmounted, nextTick } from 'vue';
import { createMenuContext, type MenuItemClicked } from './use-menu-context';
import SubMenu from './SubMenu.vue';
import MenuItemComp from './MenuItem.vue';
import type { MenuItem } from '@admin-core/layout';

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
});

const emit = defineEmits<{
  select: [path: string, parentPaths: string[]];
  open: [path: string, parentPaths: string[]];
  close: [path: string, parentPaths: string[]];
}>();

// 状态
const activePath = ref(props.defaultActive);
const openedMenus = ref<string[]>(
  props.defaultOpeneds && !props.collapse ? [...props.defaultOpeneds] : []
);
const openedMenuSet = computed(() => new Set(openedMenus.value));
const parentPathMap = computed(() => {
  const map = new Map<string, string | null>();
  const visit = (items: MenuItem[], parent: string | null) => {
    for (const menu of items) {
      const keyPath = menu.key || menu.path || '';
      const path = menu.path || '';
      if (keyPath) {
        map.set(keyPath, parent);
      }
      if (path && path !== keyPath) {
        map.set(path, parent);
      }
      if (menu.children?.length) {
        visit(menu.children, keyPath || path || parent);
      }
    }
  };
  visit(props.menus, null);
  return map;
});
const activeParentSet = computed(() => {
  const parentSet = new Set<string>();
  if (!activePath.value) return parentSet;
  let current = activePath.value;
  const visited = new Set<string>();
  while (current && parentPathMap.value.has(current) && !visited.has(current)) {
    visited.add(current);
    const parent = parentPathMap.value.get(current);
    if (!parent) break;
    parentSet.add(parent);
    current = parent;
  }
  return parentSet;
});

// 监听 defaultActive 变化
watch(() => props.defaultActive, (val) => {
  if (activePath.value !== val) {
    activePath.value = val;
  }
});

// 折叠时关闭所有菜单
watch(() => props.collapse, (val) => {
  if (val) {
    if (openedMenus.value.length > 0) {
      openedMenus.value = [];
    }
  }
});

// 是否为弹出模式
const isMenuPopup = computed(() => {
  return props.mode === 'horizontal' || (props.mode === 'vertical' && props.collapse);
});

// 打开菜单
const openMenu = (path: string, parentPaths: string[] = []) => {
  if (openedMenuSet.value.has(path)) return;
  
  // 手风琴模式：关闭同级其他菜单
  if (props.accordion) {
    if (parentPaths.length === 0) {
      openedMenus.value = [];
    } else {
      const nextMenus: string[] = [];
      for (const menu of openedMenus.value) {
        let keep = false;
        for (const parent of parentPaths) {
          if (menu.startsWith(parent)) {
            keep = true;
            break;
          }
        }
        if (keep) nextMenus.push(menu);
      }
      openedMenus.value = nextMenus;
    }
  }
  
  openedMenus.value.push(path);
  emit('open', path, parentPaths);
};

// 关闭菜单
const closeMenu = (path: string, parentPaths: string[] = []) => {
  const index = openedMenus.value.indexOf(path);
  if (index !== -1) {
    openedMenus.value.splice(index, 1);
    emit('close', path, parentPaths);
  }
};

// 关闭所有菜单
const closeAllMenus = () => {
  if (openedMenus.value.length > 0) {
    openedMenus.value = [];
  }
};

// 处理菜单项点击
const handleMenuItemClick = (data: MenuItemClicked) => {
  const { path, parentPaths } = data;
  
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
const RENDER_CHUNK = 80;
const renderCount = ref(RENDER_CHUNK);
const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const itemHeight = ref(40);
const VIRTUAL_OVERSCAN = 4;
const scrollResizeObserver = ref<ResizeObserver | null>(null);
const itemResizeObserver = ref<ResizeObserver | null>(null);

const baseVisibleMenus = computed(() => {
  if (props.mode === 'horizontal') {
    if (sliceIndex.value === -1) {
      return props.menus;
    }
    return props.menus.slice(0, sliceIndex.value);
  }
  if (props.mode === 'vertical') {
    return props.menus.slice(0, renderCount.value);
  }
  return props.menus;
});

const canVirtualize = computed(() =>
  props.mode === 'vertical' && props.collapse && viewportHeight.value > 0 && itemHeight.value > 0
);
const virtualStartIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - VIRTUAL_OVERSCAN)
);
const virtualEndIndex = computed(() =>
  Math.min(
    props.menus.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + VIRTUAL_OVERSCAN
  )
);
const virtualMenus = computed(() =>
  props.menus.slice(virtualStartIndex.value, virtualEndIndex.value)
);
const renderMenus = computed(() => (canVirtualize.value ? virtualMenus.value : baseVisibleMenus.value));
const listStyle = computed(() => {
  if (!canVirtualize.value) return undefined;
  return {
    paddingTop: `${virtualStartIndex.value * itemHeight.value}px`,
    paddingBottom: `${(props.menus.length - virtualEndIndex.value) * itemHeight.value}px`,
  };
});

watch(
  [canVirtualize, () => props.menus.length, virtualEndIndex, virtualStartIndex, viewportHeight, scrollTop],
  ([enabled, total, , , viewHeight, currentTop]) => {
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

const overflowMenus = computed(() => {
  if (props.mode !== 'horizontal' || sliceIndex.value === -1) {
    return [];
  }
  return props.menus.slice(sliceIndex.value);
});

const hasOverflow = computed(() => overflowMenus.value.length > 0);

// 计算菜单项宽度
const calcMenuItemWidth = (item: HTMLElement): number => {
  const style = getComputedStyle(item);
  const marginLeft = parseFloat(style.marginLeft) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  return item.offsetWidth + marginLeft + marginRight;
};

// 计算切片索引
const calcSliceIndex = (): number => {
  if (!menuRef.value) return -1;
  
  const container = menuRef.value;
  const items = Array.from(container.querySelectorAll(':scope > .menu__item, :scope > .menu__sub-menu')) as HTMLElement[];
  
  if (items.length === 0) return -1;
  
  const moreButtonWidth = 50;
  const containerStyle = getComputedStyle(container);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
  const availableWidth = container.clientWidth - paddingLeft - paddingRight;
  
  let totalWidth = 0;
  let lastVisibleIndex = 0;
  
  for (let i = 0; i < items.length; i++) {
    const itemWidth = calcMenuItemWidth(items[i]);
    totalWidth += itemWidth;
    
    if (totalWidth <= availableWidth - moreButtonWidth) {
      lastVisibleIndex = i + 1;
    }
  }
  
  return lastVisibleIndex === items.length ? -1 : lastVisibleIndex;
};

const handleResize = () => {
  if (resizeRaf.value !== null) return;
  resizeRaf.value = requestAnimationFrame(() => {
    resizeRaf.value = null;
    sliceIndex.value = -1;
    nextTick(() => {
      sliceIndex.value = calcSliceIndex();
    });
  });
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (props.mode === 'horizontal' && menuRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(menuRef.value);
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
      resizeObserver.observe(menuRef.value);
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

  const handleScroll = () => {
    const nextTop = container.scrollTop;
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  };
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
  const updateMetrics = () => {
    const nextHeight = container.clientHeight;
    if (viewportHeight.value !== nextHeight) {
      viewportHeight.value = nextHeight;
    }
    updateItemHeight();
  };

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
const menuClass = computed(() => [
  'menu',
  `menu--${props.mode}`,
  `menu--${props.theme}`,
  {
    'menu--collapse': props.collapse,
    'menu--rounded': props.rounded,
  },
]);
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
      />
      <!-- 无子菜单 -->
      <MenuItemComp
        v-else
        :item="item"
        :level="0"
      />
    </template>
    
    <!-- 更多按钮（溢出菜单） -->
    <SubMenu
      v-if="hasOverflow"
      :item="{ key: '__more__', name: '更多', children: overflowMenus }"
      :level="0"
      is-more
    />
  </ul>
</template>

<style>
/* 样式在 CSS 文件中定义 */
</style>
