<script setup lang="ts">
/**
 * 侧边栏菜单组件
 * @description 自动渲染菜单数据，支持多级嵌套
 * 折叠状态下支持悬停弹出子菜单（类似 vben）
 */
import { computed, ref, onMounted, onUnmounted, watch, watchEffect, nextTick } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import type { MenuItem } from '@admin-core/layout';
import {
  hasChildren,
  getMenuItemClassName,
  getMenuId,
  isMenuActive,
  LAYOUT_UI_TOKENS,
  rafThrottle,
} from '@admin-core/layout';
import LayoutIcon from '../common/LayoutIcon.vue';
import MenuIcon from '../common/MenuIcon.vue';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed, expandOnHovering } = useSidebarState();
const { openKeys, activeKey, handleSelect, handleOpenChange } = useMenuState();

// 侧边栏主题（用于弹出菜单）
const sidebarTheme = computed(() => layoutComputed.value.sidebarTheme || 'light');

// 菜单数据
const allMenus = computed<MenuItem[]>(() => context.props.menus || []);
const isMixedNav = computed(() => layoutComputed.value.isMixedNav);
const normalizeKey = (value: unknown) => (value == null || value === '' ? '' : String(value));
const menuMatchesKey = (menu: MenuItem, key: string) => {
  const target = normalizeKey(key);
  if (!target) return false;
  const menuKey = normalizeKey(menu.key ?? '');
  const menuPath = normalizeKey(menu.path ?? '');
  const menuId = normalizeKey(getMenuId(menu));
  return (
    (menuKey && menuKey === target) ||
    (menuPath && menuPath === target) ||
    (menuId && menuId === target)
  );
};
const menuContainsKey = (menu: MenuItem, key: string): boolean => {
  if (menuMatchesKey(menu, key)) return true;
  if (!menu.children?.length) return false;
  const stack = [...menu.children];
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    if (menuMatchesKey(item, key)) return true;
    if (item.children?.length) {
      for (let i = item.children.length - 1; i >= 0; i -= 1) {
        stack.push(item.children[i]);
      }
    }
  }
  return false;
};
const findRootMenuByKey = (key: string) => {
  if (!key) return null;
  for (const item of allMenus.value) {
    if (item.hidden) continue;
    if (menuContainsKey(item, key)) return item;
  }
  return null;
};
const derivedRootMenu = computed(() => {
  if (!isMixedNav.value) return null;
  const candidateKey = context.state.mixedNavRootKey || activeKey.value;
  if (!candidateKey) return null;
  return findRootMenuByKey(candidateKey);
});
const fallbackRootMenu = computed(() => {
  if (!isMixedNav.value) return null;
  for (const item of allMenus.value) {
    if (!item.hidden) return item;
  }
  return null;
});
const rootMenu = computed(() => derivedRootMenu.value || fallbackRootMenu.value);

watch(
  [isMixedNav, rootMenu],
  ([mixed, root]) => {
    if (!mixed || !root) return;
    const rootKey = normalizeKey(root.key ?? root.path ?? '');
    if (!rootKey || context.state.mixedNavRootKey === rootKey) return;
    context.state.mixedNavRootKey = rootKey;
  },
  { immediate: true }
);

const menus = computed<MenuItem[]>(() => {
  return isMixedNav.value ? (rootMenu.value?.children ?? []) : allMenus.value;
});
const filteredMenus = computed(() => {
  const result: MenuItem[] = [];
  for (const item of menus.value) {
    if (!item.hidden) result.push(item);
  }
  return result;
});
const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
const renderCount = ref<number>(RENDER_CHUNK);
const SUB_RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
const subRenderCount = ref<number>(SUB_RENDER_CHUNK);
const menuItemHeight = ref<number>(LAYOUT_UI_TOKENS.MENU_ITEM_HEIGHT);
const menuItemResizeObserver = ref<ResizeObserver | null>(null);
const MENU_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
const menuRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
let scrollContainer: HTMLElement | null = null;
let scrollResizeObserver: ResizeObserver | null = null;
const popupRef = ref<HTMLElement | null>(null);
const popupContentRef = ref<HTMLElement | null>(null);
const popupScrollTop = ref(0);
const popupContentTop = ref(0);
const popupViewportHeight = ref(0);
const popupItemHeight = ref<number>(LAYOUT_UI_TOKENS.POPUP_MENU_ITEM_HEIGHT);
const POPUP_OVERSCAN = LAYOUT_UI_TOKENS.POPUP_OVERSCAN;
const POPUP_VIRTUAL_MIN_ITEMS = 50;
const popupResizeObserver = ref<ResizeObserver | null>(null);
let popupWheelCleanup: (() => void) | null = null;

const shouldVirtualize = computed(() => collapsed.value && !expandOnHovering.value);

watch([filteredMenus, shouldVirtualize], ([list, virtualized]) => {
  const nextCount = virtualized ? list.length : Math.min(RENDER_CHUNK, list.length);
  if (renderCount.value !== nextCount) {
    renderCount.value = nextCount;
  }
}, { immediate: true });

watch(menus, (list) => {
  const nextCount = Math.min(SUB_RENDER_CHUNK, list.length);
  if (subRenderCount.value !== nextCount) {
    subRenderCount.value = nextCount;
  }
}, { immediate: true });

watchEffect((onCleanup) => {
  if (shouldVirtualize.value || renderCount.value >= filteredMenus.value.length) return;
  const frame = requestAnimationFrame(() => {
    renderCount.value = Math.min(renderCount.value + RENDER_CHUNK, filteredMenus.value.length);
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

watchEffect((onCleanup) => {
  if (subRenderCount.value >= menus.value.length) return;
  const frame = requestAnimationFrame(() => {
    subRenderCount.value = Math.min(subRenderCount.value + SUB_RENDER_CHUNK, menus.value.length);
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

const visibleMenus = computed(() => filteredMenus.value.slice(0, renderCount.value));
const virtualTotalHeight = computed(() => filteredMenus.value.length * menuItemHeight.value);
const virtualViewportHeight = computed(() => viewportHeight.value || 0);
const virtualStartIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / menuItemHeight.value) - MENU_OVERSCAN)
);
const virtualEndIndex = computed(() =>
  Math.min(
    filteredMenus.value.length,
    Math.ceil((scrollTop.value + virtualViewportHeight.value) / menuItemHeight.value) + MENU_OVERSCAN
  )
);
const virtualMenus = computed(() =>
  filteredMenus.value.slice(virtualStartIndex.value, virtualEndIndex.value)
);
const renderMenus = computed(() =>
  shouldVirtualize.value ? virtualMenus.value : visibleMenus.value
);
const menuStyle = computed(() => {
  if (!shouldVirtualize.value) return undefined;
  const height = Math.max(virtualTotalHeight.value, virtualViewportHeight.value);
  return { position: 'relative' as const, height: `${height}px` };
});

watch(
  [shouldVirtualize, virtualTotalHeight, virtualViewportHeight, scrollTop],
  ([enabled, totalHeight, viewHeight, currentTop]) => {
    if (!enabled) return;
    const maxScrollTop = Math.max(0, totalHeight - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (scrollContainer) {
      scrollContainer.scrollTop = nextTop;
    }
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
);

// 弹出菜单状态（折叠时使用）
const popupMenu = ref<{
  item: MenuItem | null;
  visible: boolean;
  top: number;
  left: number;
}>({
  item: null,
  visible: false,
  top: 0,
  left: 0,
});

// 弹出菜单展开状态
const popupExpandedKeys = ref<Set<string>>(new Set());

const popupChildren = computed(() => popupMenu.value.item?.children ?? []);
const popupShouldVirtualize = computed(
  () => popupExpandedKeys.value.size === 0 && popupChildren.value.length >= POPUP_VIRTUAL_MIN_ITEMS
);
const popupContentScrollTop = computed(() =>
  Math.max(0, popupScrollTop.value - popupContentTop.value)
);
const popupTotalHeight = computed(() => popupChildren.value.length * popupItemHeight.value);
const popupStartIndex = computed(() =>
  Math.max(0, Math.floor(popupContentScrollTop.value / popupItemHeight.value) - POPUP_OVERSCAN)
);
const popupEndIndex = computed(() =>
  Math.min(
    popupChildren.value.length,
    Math.ceil((popupContentScrollTop.value + popupViewportHeight.value) / popupItemHeight.value) + POPUP_OVERSCAN
  )
);
const visiblePopupChildren = computed(() =>
  popupShouldVirtualize.value
    ? popupChildren.value.slice(popupStartIndex.value, popupEndIndex.value)
    : popupChildren.value
);

watch(
  [popupShouldVirtualize, popupTotalHeight, popupViewportHeight, popupContentTop, popupScrollTop],
  ([enabled, total, viewHeight, contentTopValue, currentTop]) => {
    if (!enabled) return;
    const maxScrollTop = Math.max(0, total - viewHeight - contentTopValue);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (popupRef.value) {
      popupRef.value.scrollTop = nextTop;
    }
    popupScrollTop.value = nextTop;
  }
);

const updatePopupMetrics = rafThrottle(() => {
  const container = popupRef.value;
  const content = popupContentRef.value;
  if (!container || !content) return;
  const offset = content.offsetTop;
  popupContentTop.value = offset;
  popupViewportHeight.value = Math.max(0, container.clientHeight - offset);
  const firstItem = container.querySelector('.sidebar-menu__popup-item') as HTMLElement | null;
  if (firstItem) {
    const height = firstItem.getBoundingClientRect().height;
    if (height > 0) {
      popupItemHeight.value = height;
    }
  }
});

const handlePopupScroll = (e: Event) => {
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  popupScrollTop.value = target.scrollTop;
};
const getVisibleChildren = (children?: MenuItem[]) => {
  const result: MenuItem[] = [];
  if (!children?.length) return result;
  for (const item of children) {
    if (item.hidden) continue;
    result.push(item);
    if (result.length >= subRenderCount.value) break;
  }
  return result;
};

// 展开的菜单
const expandedKeys = ref<Set<string>>(new Set(openKeys.value));
watch(openKeys, (keys) => {
  if (expandedKeys.value.size === keys.length) {
    let same = true;
    for (const key of keys) {
      if (!expandedKeys.value.has(key)) {
        same = false;
        break;
      }
    }
    if (same) return;
  }
  expandedKeys.value = new Set(keys);
}, { immediate: true });

// 悬停定时器
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;
let popupRaf: number | null = null;
let sidebarRectRaf: number | null = null;
const sidebarRect = ref<DOMRect | null>(null);

// 切换菜单展开
const toggleExpand = (key: string) => {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key);
  } else {
    expandedKeys.value.add(key);
  }
  const nextKeys = Array.from(expandedKeys.value);
  if (nextKeys.length !== openKeys.value.length) {
    handleOpenChange(nextKeys);
    return;
  }
  let same = true;
  for (let i = 0; i < nextKeys.length; i += 1) {
    if (nextKeys[i] !== openKeys.value[i]) {
      same = false;
      break;
    }
  }
  if (!same) {
    handleOpenChange(nextKeys);
  }
};

// 切换弹出菜单展开
const togglePopupExpand = (key: string) => {
  if (!popupMenuItemMap.value.has(key)) return;
  if (popupExpandedKeys.value.has(key)) {
    popupExpandedKeys.value.delete(key);
  } else {
    popupExpandedKeys.value.add(key);
  }
};

const expandPopupItem = (key: string) => {
  if (!popupMenuItemMap.value.has(key)) return;
  if (!popupExpandedKeys.value.has(key)) {
    popupExpandedKeys.value.add(key);
  }
};

const handlePopupItemHover = (item: MenuItem) => {
  if (!hasChildren(item)) return;
  expandPopupItem(getMenuId(item));
};

// 判断菜单是否展开
const isExpanded = (key: string) => expandedKeys.value.has(key);
const isPopupExpanded = (key: string) => popupExpandedKeys.value.has(key);

const parentPathMap = computed(() => {
  const map = new Map<string, string | null>();
  const visit = (items: MenuItem[], parent: string | null) => {
    for (const menu of items) {
      const id = getMenuId(menu);
      const rawKey = menu.key ?? '';
      const keyPath = rawKey === '' ? '' : String(rawKey);
      const rawPath = menu.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      if (keyPath) map.set(keyPath, parent);
      if (path && path !== keyPath) map.set(path, parent);
      if (id && id !== keyPath && id !== path) map.set(id, parent);
      if (menu.children?.length) {
        visit(menu.children, id || parent);
      }
    }
  };
  visit(menus.value, null);
  return map;
});
const activeParentSet = computed(() => {
  const parentSet = new Set<string>();
  if (!activeKey.value) return parentSet;
  let current = activeKey.value;
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

// 判断是否激活
const isActive = (item: MenuItem) => isMenuActive(item, activeKey.value);

// 判断是否有激活的子菜单
const hasActiveChildItem = (item: MenuItem) =>
  activeParentSet.value.has(getMenuId(item));

// 处理菜单点击
const onMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    if (collapsed.value && !expandOnHovering.value) {
      // 折叠状态下，点击有子菜单的项不做任何操作（由悬停处理）
      return;
    }
    toggleExpand(getMenuId(item));
  } else {
    handleSelect(getMenuId(item));
    hidePopupMenu();
  }
};

// 处理弹出菜单项点击
const popupMenuItemMap = computed(() => {
  const map = new Map<string, MenuItem>();
  const stack = [...(popupMenu.value.item?.children ?? [])].reverse();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    map.set(getMenuId(current), current);
    if (current.children?.length) {
      for (let i = current.children.length - 1; i >= 0; i -= 1) {
        stack.push(current.children[i]);
      }
    }
  }
  return map;
});

const onPopupMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    togglePopupExpand(getMenuId(item));
  } else {
    handleSelect(getMenuId(item));
    hidePopupMenu();
  }
};

const handlePopupItemClick = (e: MouseEvent) => {
  const key = (e.currentTarget as HTMLElement | null)?.dataset?.key;
  if (!key) return;
  const item = popupMenuItemMap.value.get(key);
  if (item) {
    onPopupMenuClick(item);
  }
};

const updateSidebarRect = () => {
  const sidebar = document.querySelector('.layout-sidebar') as HTMLElement | null;
  if (sidebar) {
    sidebarRect.value = sidebar.getBoundingClientRect();
  }
};

// 显示弹出菜单
const showPopupMenu = (item: MenuItem, event: MouseEvent) => {
  if (!collapsed.value || expandOnHovering.value) return;
  if (!hasChildren(item)) return;
  
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  
  if (popupRaf !== null) return;
  const target = event.currentTarget as HTMLElement;

  popupRaf = requestAnimationFrame(() => {
    popupRaf = null;
    const rect = target.getBoundingClientRect();
    const cachedSidebarRect = sidebarRect.value;
    const left = cachedSidebarRect ? cachedSidebarRect.right : rect.right;

    popupMenu.value = {
      item,
      visible: true,
      top: rect.top,
      left,
    };
  });
  
  // 自动展开激活链上的子菜单
  const nextKeys = new Set<string>();
  if (item.children) {
    const stack = [...item.children].reverse();
    while (stack.length > 0) {
      const child = stack.pop();
      if (!child) continue;
      const childId = getMenuId(child);
      const isActiveItem = isMenuActive(child, activeKey.value);
      if ((childId && activeParentSet.value.has(childId)) || isActiveItem) {
        nextKeys.add(childId);
        if (child.children?.length) {
          for (let i = child.children.length - 1; i >= 0; i -= 1) {
            stack.push(child.children[i]);
          }
        }
      }
    }
  }
  let isSame = nextKeys.size === popupExpandedKeys.value.size;
  if (isSame) {
    for (const key of nextKeys) {
      if (!popupExpandedKeys.value.has(key)) {
        isSame = false;
        break;
      }
    }
  }
  if (!isSame) {
    popupExpandedKeys.value = nextKeys;
  }
};

// 隐藏弹出菜单
const hidePopupMenu = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  leaveTimer = setTimeout(() => {
    popupMenu.value.visible = false;
    popupMenu.value.item = null;
  }, 100);
};

// 取消隐藏
const cancelHidePopup = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
};

// 获取菜单项类名
const getItemClass = (item: MenuItem, level: number) => {
  return getMenuItemClassName(item, {
    level,
    isActive: isActive(item),
    isExpanded: isExpanded(getMenuId(item)),
    hasActiveChild: hasActiveChildItem(item),
  });
};

// 获取弹出菜单项类名
const getPopupItemClass = (item: MenuItem, level: number) => {
  const classes = ['sidebar-menu__popup-item'];
  if (isActive(item)) classes.push('sidebar-menu__popup-item--active');
  if (hasActiveChildItem(item)) classes.push('sidebar-menu__popup-item--has-active-child');
  if (level > 0) classes.push(`sidebar-menu__popup-item--level-${level}`);
  return classes.join(' ');
};

onMounted(() => {
  const menuEl = menuRef.value;
  if (menuEl) {
    scrollContainer = menuEl.closest('.layout-scroll-container') as HTMLElement | null;
  }
  if (scrollContainer) {
    const syncScroll = () => {
      const nextTop = scrollContainer?.scrollTop ?? 0;
      if (scrollTop.value !== nextTop) {
        scrollTop.value = nextTop;
      }
    };
    const syncHeight = () => {
      const nextHeight = scrollContainer?.clientHeight ?? 0;
      if (viewportHeight.value !== nextHeight) {
        viewportHeight.value = nextHeight;
      }
    };
    const handleScroll = rafThrottle(syncScroll);
    const updateHeight = rafThrottle(syncHeight);

    syncHeight();
    syncScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      scrollResizeObserver = new ResizeObserver(updateHeight);
      scrollResizeObserver.observe(scrollContainer);
    } else {
      window.addEventListener('resize', updateHeight);
    }
    onUnmounted(() => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
      if (scrollResizeObserver) {
        scrollResizeObserver.disconnect();
        scrollResizeObserver = null;
      } else {
        window.removeEventListener('resize', updateHeight);
      }
      handleScroll.cancel?.();
      updateHeight.cancel?.();
    });
  }
  updateSidebarRect();
  const scrollOptions: AddEventListenerOptions = { capture: true, passive: true };
  const handleResize = () => {
    if (sidebarRectRaf !== null) return;
    sidebarRectRaf = requestAnimationFrame(() => {
      sidebarRectRaf = null;
      updateSidebarRect();
    });
  };
  const sidebar = document.querySelector('.layout-sidebar') as HTMLElement | null;
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined' && sidebar) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(sidebar);
  } else {
    window.addEventListener('resize', handleResize);
  }
  window.addEventListener('scroll', handleResize, scrollOptions);
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', handleResize);
    }
    window.removeEventListener('scroll', handleResize, scrollOptions);
  });
});

// 清理定时器
onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
  if (leaveTimer) clearTimeout(leaveTimer);
  if (popupRaf !== null) cancelAnimationFrame(popupRaf);
  if (sidebarRectRaf !== null) cancelAnimationFrame(sidebarRectRaf);
  if (popupWheelCleanup) {
    popupWheelCleanup();
    popupWheelCleanup = null;
  }
  if (popupResizeObserver.value) {
    popupResizeObserver.value.disconnect();
    popupResizeObserver.value = null;
  } else {
    window.removeEventListener('resize', updatePopupMetrics);
  }
});

watch(shouldVirtualize, (enabled) => {
  if (!enabled) return;
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
  if (scrollTop.value !== 0) {
    scrollTop.value = 0;
  }
});

watch([shouldVirtualize, filteredMenus], ([enabled]) => {
  if (!enabled) {
    if (menuItemResizeObserver.value) {
      menuItemResizeObserver.value.disconnect();
      menuItemResizeObserver.value = null;
    }
    return;
  }
  nextTick(() => {
    const menuEl = menuRef.value;
    if (!menuEl) return;
    const firstItem = menuEl.querySelector('.sidebar-menu__item') as HTMLElement | null;
    if (!firstItem) return;
    const height = firstItem.getBoundingClientRect().height;
    if (height > 0 && height !== menuItemHeight.value) {
      menuItemHeight.value = height;
    }
    if (typeof ResizeObserver !== 'undefined') {
      menuItemResizeObserver.value?.disconnect();
      let observedItem = firstItem;
      menuItemResizeObserver.value = new ResizeObserver(() => {
        const currentItem = menuEl.querySelector('.sidebar-menu__item') as HTMLElement | null;
        if (!currentItem) return;
        if (currentItem !== observedItem) {
          menuItemResizeObserver.value?.unobserve(observedItem);
          menuItemResizeObserver.value?.observe(currentItem);
          observedItem = currentItem;
        }
        const nextHeight = currentItem.getBoundingClientRect().height;
        if (nextHeight > 0 && nextHeight !== menuItemHeight.value) {
          menuItemHeight.value = nextHeight;
        }
      });
      menuItemResizeObserver.value.observe(observedItem);
    }
  });
});

watch(() => popupMenu.value.visible, (visible) => {
  if (!visible) {
    if (popupWheelCleanup) {
      popupWheelCleanup();
      popupWheelCleanup = null;
    }
    if (popupResizeObserver.value) {
      popupResizeObserver.value.disconnect();
      popupResizeObserver.value = null;
    } else {
      window.removeEventListener('resize', updatePopupMetrics);
    }
    return;
  }
  nextTick(() => {
    updatePopupMetrics();
    if (popupRef.value) {
      popupScrollTop.value = popupRef.value.scrollTop;
    }
    const container = popupRef.value;
    if (container && typeof ResizeObserver !== 'undefined') {
      popupResizeObserver.value = new ResizeObserver(updatePopupMetrics);
      popupResizeObserver.value.observe(container);
    } else {
      window.addEventListener('resize', updatePopupMetrics);
    }
    if (container) {
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) return;
        e.preventDefault();
        container.scrollTop += e.deltaY;
      };
      container.addEventListener('wheel', handleWheel, { passive: false });
      popupWheelCleanup = () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  });
});

watch(popupShouldVirtualize, (enabled) => {
  if (!enabled) return;
  if (popupRef.value) {
    popupRef.value.scrollTop = 0;
  }
  if (popupScrollTop.value !== 0) {
    popupScrollTop.value = 0;
  }
});
</script>

<template>
  <nav ref="menuRef" class="sidebar-menu" :style="menuStyle">
    <!-- 一级菜单 -->
    <template v-for="(item, index) in renderMenus" :key="getMenuId(item)">
      <div
        class="sidebar-menu__group"
        :style="shouldVirtualize
          ? {
              position: 'absolute',
              top: `${(virtualStartIndex + index) * menuItemHeight}px`,
              left: 0,
              right: 0,
            }
          : undefined"
      >
        <!-- 菜单项 -->
        <div 
          :class="['data-active:text-primary data-disabled:opacity-50', getItemClass(item, 0)]"
          :data-state="isActive(item) ? 'active' : 'inactive'"
          :data-disabled="item.disabled ? 'true' : undefined"
          :data-has-active-child="hasActiveChildItem(item) ? 'true' : undefined"
          :data-has-children="hasChildren(item) ? 'true' : undefined"
          :data-expanded="hasChildren(item) && isExpanded(getMenuId(item)) ? 'true' : undefined"
          :data-level="0"
          @click="onMenuClick(item)"
          @mouseenter="showPopupMenu(item, $event)"
          @mouseleave="hidePopupMenu"
        >
          <!-- 图标 -->
          <span v-if="item.icon" class="sidebar-menu__icon">
            <MenuIcon :icon="item.icon" size="h-4.5 w-4.5" />
          </span>

          <!-- 名称 -->
          <span v-if="!collapsed || expandOnHovering" class="sidebar-menu__name">{{ item.name }}</span>

          <!-- 展开箭头 -->
          <span
            v-if="hasChildren(item) && (!collapsed || expandOnHovering)"
            class="sidebar-menu__arrow"
            :class="{ 'sidebar-menu__arrow--expanded': isExpanded(getMenuId(item)) }"
            :data-expanded="isExpanded(getMenuId(item)) ? 'true' : undefined"
          >
            <LayoutIcon name="menu-arrow-right" size="sm" />
          </span>

          <!-- 折叠状态下有子菜单时显示箭头 -->
          <span
            v-if="hasChildren(item) && collapsed && !expandOnHovering"
            class="sidebar-menu__arrow-right"
          >
            <LayoutIcon name="menu-arrow-right" size="xs" />
          </span>
        </div>

        <!-- 二级菜单（展开状态） -->
        <div v-if="hasChildren(item) && (!collapsed || expandOnHovering) && isExpanded(getMenuId(item))" class="sidebar-menu__submenu">
          <template v-for="child in getVisibleChildren(item.children)" :key="getMenuId(child)">
            <div class="sidebar-menu__subgroup">
              <div
                :class="['data-active:text-primary data-disabled:opacity-50', getItemClass(child, 1)]"
                :data-state="isActive(child) ? 'active' : 'inactive'"
                :data-disabled="child.disabled ? 'true' : undefined"
                :data-has-active-child="hasActiveChildItem(child) ? 'true' : undefined"
                :data-has-children="hasChildren(child) ? 'true' : undefined"
                :data-expanded="hasChildren(child) && isExpanded(getMenuId(child)) ? 'true' : undefined"
                :data-level="1"
                @click="onMenuClick(child)"
              >
                <span v-if="child.icon" class="sidebar-menu__icon">
                  <MenuIcon :icon="child.icon" size="h-4.5 w-4.5" />
                </span>
                <span class="sidebar-menu__name">{{ child.name }}</span>
                <span
                  v-if="hasChildren(child)"
                  class="sidebar-menu__arrow"
                  :class="{ 'sidebar-menu__arrow--expanded': isExpanded(getMenuId(child)) }"
                  :data-expanded="isExpanded(getMenuId(child)) ? 'true' : undefined"
                >
                  <LayoutIcon name="menu-arrow-right" size="sm" />
                </span>
              </div>

              <!-- 三级菜单 -->
              <div v-if="hasChildren(child) && isExpanded(getMenuId(child))" class="sidebar-menu__submenu">
                <template v-for="grandchild in getVisibleChildren(child.children)" :key="getMenuId(grandchild)">
                  <div class="sidebar-menu__subgroup">
                    <div
                      :class="['data-active:text-primary data-disabled:opacity-50', getItemClass(grandchild, 2)]"
                      :data-state="isActive(grandchild) ? 'active' : 'inactive'"
                      :data-disabled="grandchild.disabled ? 'true' : undefined"
                      :data-has-active-child="hasActiveChildItem(grandchild) ? 'true' : undefined"
                    :data-has-children="hasChildren(grandchild) ? 'true' : undefined"
                    :data-expanded="hasChildren(grandchild) && isExpanded(getMenuId(grandchild)) ? 'true' : undefined"
                      :data-level="2"
                      @click="onMenuClick(grandchild)"
                    >
                      <span v-if="grandchild.icon" class="sidebar-menu__icon">
                        <MenuIcon :icon="grandchild.icon" size="h-4.5 w-4.5" />
                      </span>
                      <span class="sidebar-menu__name">{{ grandchild.name }}</span>
                      <span
                        v-if="hasChildren(grandchild)"
                        class="sidebar-menu__arrow"
                        :class="{ 'sidebar-menu__arrow--expanded': isExpanded(getMenuId(grandchild)) }"
                        :data-expanded="isExpanded(getMenuId(grandchild)) ? 'true' : undefined"
                      >
                        <LayoutIcon name="menu-arrow-right" size="sm" />
                      </span>
                    </div>

                    <!-- 四级菜单 -->
                    <div v-if="hasChildren(grandchild) && isExpanded(getMenuId(grandchild))" class="sidebar-menu__submenu">
                      <template v-for="item4 in getVisibleChildren(grandchild.children)" :key="getMenuId(item4)">
                        <div
                          :class="['data-active:text-primary data-disabled:opacity-50', getItemClass(item4, 3)]"
                          :data-state="isActive(item4) ? 'active' : 'inactive'"
                          :data-disabled="item4.disabled ? 'true' : undefined"
                          :data-has-active-child="hasActiveChildItem(item4) ? 'true' : undefined"
                          :data-has-children="hasChildren(item4) ? 'true' : undefined"
                          :data-expanded="hasChildren(item4) && isExpanded(getMenuId(item4)) ? 'true' : undefined"
                          :data-level="3"
                          @click="onMenuClick(item4)"
                        >
                          <span v-if="item4.icon" class="sidebar-menu__icon">
                            <MenuIcon :icon="item4.icon" size="h-4.5 w-4.5" />
                          </span>
                          <span class="sidebar-menu__name">{{ item4.name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- 折叠状态下的弹出菜单 -->
    <Teleport to="body">
      <div
        v-if="popupMenu.visible && popupMenu.item && collapsed && !expandOnHovering"
        :class="['sidebar-menu__popup', `sidebar-menu__popup--${sidebarTheme}`]"
        :data-theme="sidebarTheme"
        :style="{ top: `${popupMenu.top}px`, left: `${popupMenu.left}px` }"
        ref="popupRef"
        @mouseenter="cancelHidePopup"
        @mouseleave="hidePopupMenu"
        @scroll="handlePopupScroll"
      >
        <!-- 弹出菜单标题 -->
        <div class="sidebar-menu__popup-title">{{ popupMenu.item.name }}</div>
        
        <!-- 子菜单列表 -->
        <div
          class="sidebar-menu__popup-content"
          ref="popupContentRef"
          :style="popupShouldVirtualize
            ? { position: 'relative', height: `${Math.max(popupTotalHeight, popupViewportHeight)}px` }
            : undefined"
        >
          <div v-if="popupShouldVirtualize" :style="{ height: `${popupTotalHeight}px`, pointerEvents: 'none' }" />
          <template v-for="(child, index) in visiblePopupChildren" :key="getMenuId(child)">
            <div
              class="sidebar-menu__popup-group"
              :style="popupShouldVirtualize
                ? {
                    position: 'absolute',
                    top: `${(popupStartIndex + index) * popupItemHeight}px`,
                    left: 0,
                    right: 0,
                  }
                : undefined"
            >
              <div
                :class="['data-active:text-primary data-disabled:opacity-50', getPopupItemClass(child, 0)]"
                :data-state="isActive(child) ? 'active' : 'inactive'"
                :data-disabled="child.disabled ? 'true' : undefined"
                :data-has-active-child="hasActiveChildItem(child) ? 'true' : undefined"
                :data-has-children="hasChildren(child) ? 'true' : undefined"
                :data-expanded="hasChildren(child) && isPopupExpanded(getMenuId(child)) ? 'true' : undefined"
                :data-level="0"
                :data-key="getMenuId(child)"
                @click="handlePopupItemClick"
                @mouseenter="handlePopupItemHover(child)"
              >
                <span v-if="child.icon" class="sidebar-menu__popup-icon">
                  <MenuIcon :icon="child.icon" size="h-4 w-4" />
                </span>
                <span class="sidebar-menu__popup-name">{{ child.name }}</span>
                <span
                  v-if="hasChildren(child)"
                  class="sidebar-menu__popup-arrow"
                  :class="{ 'sidebar-menu__popup-arrow--expanded': isPopupExpanded(getMenuId(child)) }"
                  :data-expanded="isPopupExpanded(getMenuId(child)) ? 'true' : undefined"
                >
                  <LayoutIcon name="menu-arrow-right" size="sm" />
                </span>
              </div>
              
              <!-- 三级菜单 -->
              <div v-if="hasChildren(child) && isPopupExpanded(getMenuId(child))" class="sidebar-menu__popup-submenu">
                <template v-for="grandchild in getVisibleChildren(child.children)" :key="getMenuId(grandchild)">
                  <div class="sidebar-menu__popup-group">
                    <div
                      :class="['data-active:text-primary data-disabled:opacity-50', getPopupItemClass(grandchild, 1)]"
                      :data-state="isActive(grandchild) ? 'active' : 'inactive'"
                      :data-disabled="grandchild.disabled ? 'true' : undefined"
                      :data-has-active-child="hasActiveChildItem(grandchild) ? 'true' : undefined"
                    :data-has-children="hasChildren(grandchild) ? 'true' : undefined"
                    :data-expanded="hasChildren(grandchild) && isPopupExpanded(getMenuId(grandchild)) ? 'true' : undefined"
                      :data-level="1"
                      :data-key="getMenuId(grandchild)"
                      @click="handlePopupItemClick"
                      @mouseenter="handlePopupItemHover(grandchild)"
                    >
                      <span v-if="grandchild.icon" class="sidebar-menu__popup-icon">
                        <MenuIcon :icon="grandchild.icon" size="h-4 w-4" />
                      </span>
                      <span class="sidebar-menu__popup-name">{{ grandchild.name }}</span>
                      <span
                      v-if="hasChildren(grandchild)"
                      class="sidebar-menu__popup-arrow"
                      :class="{ 'sidebar-menu__popup-arrow--expanded': isPopupExpanded(getMenuId(grandchild)) }"
                      :data-expanded="isPopupExpanded(getMenuId(grandchild)) ? 'true' : undefined"
                    >
                        <LayoutIcon name="menu-arrow-right" size="sm" />
                    </span>
                  </div>
                    
                    <!-- 四级菜单 -->
                    <div v-if="hasChildren(grandchild) && isPopupExpanded(getMenuId(grandchild))" class="sidebar-menu__popup-submenu">
                      <template v-for="item4 in getVisibleChildren(grandchild.children)" :key="getMenuId(item4)">
                        <div
                          :class="['data-active:text-primary data-disabled:opacity-50', getPopupItemClass(item4, 2)]"
                          :data-state="isActive(item4) ? 'active' : 'inactive'"
                          :data-disabled="item4.disabled ? 'true' : undefined"
                          :data-has-active-child="hasActiveChildItem(item4) ? 'true' : undefined"
                          :data-has-children="hasChildren(item4) ? 'true' : undefined"
                          :data-expanded="hasChildren(item4) && isPopupExpanded(getMenuId(item4)) ? 'true' : undefined"
                          :data-level="2"
                          @click="onPopupMenuClick(item4)"
                        >
                          <span v-if="item4.icon" class="sidebar-menu__popup-icon">
                            <MenuIcon :icon="item4.icon" size="h-4 w-4" />
                          </span>
                          <span class="sidebar-menu__popup-name">{{ item4.name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </nav>
</template>
