<script setup lang="ts">
/**
 * 混合侧边栏菜单组件（双列菜单）
 * @description 左侧显示一级菜单图标，右侧显示选中菜单的子菜单
 * @features
 * - 记住每个一级菜单最后激活的子菜单
 * - 支持悬停展开子菜单
 * - 点击无子菜单项直接导航
 */
import { computed, ref, watch, watchEffect, shallowRef, onMounted, onUnmounted } from 'vue';
import { useLayoutContext, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import { LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';
import MenuIcon from '../common/MenuIcon.vue';

const context = useLayoutContext();
const { extraVisible, layoutComputed } = useSidebarState();
const { activeKey, handleSelect } = useMenuState();

// Logo 配置
const logoConfig = computed(() => context.props.logo || {});
// 主题（考虑 semiDarkSidebar）
const theme = computed(() => layoutComputed.value?.sidebarTheme || 'light');
const isHeaderMixedNav = computed(() => layoutComputed.value.isHeaderMixedNav);

// 定义事件
const emit = defineEmits<{
  (e: 'rootMenuChange', menu: MenuItem | null): void;
}>();

// 菜单数据
const menus = computed<MenuItem[]>(() => context.props.menus || []);
const normalizeKey = (value: unknown) => {
  if (value == null || value === '') return '';
  return String(value);
};
const getMenuId = (menu: MenuItem) => {
  const id = menu.key ?? menu.path ?? menu.name ?? '';
  return id === '' ? '' : String(id);
};
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
const menuContainsKey = (menu: MenuItem, key: string) => {
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
  for (const item of menus.value) {
    if (item.hidden) continue;
    if (menuContainsKey(item, key)) return item;
  }
  return null;
};
const headerMixedRootMenu = computed(() => {
  if (!isHeaderMixedNav.value) return null;
  const candidateKey = context.state.mixedNavRootKey || activeKey.value;
  let root = candidateKey ? findRootMenuByKey(candidateKey) : null;
  if (!root) {
    for (const item of menus.value) {
      if (!item.hidden) {
        root = item;
        break;
      }
    }
  }
  return root;
});
watch(headerMixedRootMenu, (rootMenu) => {
  if (!isHeaderMixedNav.value || !rootMenu) return;
  const rootKey = normalizeKey(rootMenu.key ?? rootMenu.path ?? '');
  if (!rootKey || rootKey === context.state.mixedNavRootKey) return;
  context.state.mixedNavRootKey = rootKey;
});
const rootMenus = computed(() => {
  const source = isHeaderMixedNav.value
    ? headerMixedRootMenu.value?.children ?? []
    : menus.value;
  const result: MenuItem[] = [];
  for (const item of source) {
    if (!item.hidden) result.push(item);
  }
  return result;
});
const rootNavRef = ref<HTMLElement | null>(null);
const rootScrollTop = ref(0);
const rootViewportHeight = ref(0);
const rootItemHeight = ref(72);
const ROOT_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
const rootResizeObserver = ref<ResizeObserver | null>(null);
const rootItemResizeObserver = ref<ResizeObserver | null>(null);
const rootTotalHeight = computed(() => rootMenus.value.length * rootItemHeight.value);
const rootStartIndex = computed(() =>
  Math.max(0, Math.floor(rootScrollTop.value / rootItemHeight.value) - ROOT_OVERSCAN)
);
const rootEndIndex = computed(() =>
  Math.min(
    rootMenus.value.length,
    Math.ceil((rootScrollTop.value + rootViewportHeight.value) / rootItemHeight.value) + ROOT_OVERSCAN
  )
);
const visibleRootMenus = computed(() =>
  rootMenus.value.slice(rootStartIndex.value, rootEndIndex.value)
);

watch(
  [rootTotalHeight, rootViewportHeight, rootScrollTop],
  ([totalHeight, viewHeight, currentTop]) => {
    const maxScrollTop = Math.max(0, totalHeight - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (rootNavRef.value) {
      rootNavRef.value.scrollTop = nextTop;
    }
    if (rootScrollTop.value !== nextTop) {
      rootScrollTop.value = nextTop;
    }
  }
);

onMounted(() => {
  const container = rootNavRef.value;
  if (!container) return;

  const handleScroll = rafThrottle(() => {
    const nextTop = container.scrollTop;
    if (rootScrollTop.value !== nextTop) {
      rootScrollTop.value = nextTop;
    }
  });
  const updateHeight = rafThrottle(() => {
    const nextHeight = container.clientHeight;
    if (rootViewportHeight.value !== nextHeight) {
      rootViewportHeight.value = nextHeight;
    }
    const firstItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
    if (firstItem) {
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== rootItemHeight.value) {
        rootItemHeight.value = height;
      }
    }
  });

  updateHeight();
  handleScroll();
  container.addEventListener('scroll', handleScroll, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    rootResizeObserver.value = new ResizeObserver(updateHeight);
    rootResizeObserver.value.observe(container);
  } else {
    window.addEventListener('resize', updateHeight);
  }
  if (typeof ResizeObserver !== 'undefined') {
    const firstItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
    if (firstItem) {
      rootItemResizeObserver.value?.disconnect();
      let observedItem = firstItem;
      rootItemResizeObserver.value = new ResizeObserver(() => {
        const currentItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
        if (!currentItem) return;
        if (currentItem !== observedItem) {
          rootItemResizeObserver.value?.unobserve(observedItem);
          rootItemResizeObserver.value?.observe(currentItem);
          observedItem = currentItem;
        }
        const height = currentItem.getBoundingClientRect().height;
        if (height > 0 && height !== rootItemHeight.value) {
          rootItemHeight.value = height;
        }
      });
      rootItemResizeObserver.value.observe(observedItem);
    }
  }
  onUnmounted(() => {
    container.removeEventListener('scroll', handleScroll);
    if (rootResizeObserver.value) {
      rootResizeObserver.value.disconnect();
      rootResizeObserver.value = null;
    } else {
      window.removeEventListener('resize', updateHeight);
    }
    if (rootItemResizeObserver.value) {
      rootItemResizeObserver.value.disconnect();
      rootItemResizeObserver.value = null;
    }
  });
});

// 当前选中的一级菜单
const selectedRootMenu = ref<MenuItem | null>(null);

// 记录每个一级菜单最后激活的子菜单路径（类似常见 admin 布局的 defaultSubMap）
const lastActiveSubMenuMap = new Map<string, string>();
const rootActiveMap = shallowRef(new Map<string, boolean>());
const lastSyncRef = ref<{ key: string | null; menus: MenuItem[] | null }>({
  key: null,
  menus: null,
});

const parentPathMap = computed(() => {
  const map = new Map<string, string | null>();
  const visit = (items: MenuItem[], parent: string | null) => {
    for (const menu of items) {
      const rawKey = menu.key ?? '';
      const keyPath = rawKey === '' ? '' : String(rawKey);
      const rawPath = menu.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      const id = getMenuId(menu);
      if (keyPath) map.set(keyPath, parent);
      if (path && path !== keyPath) map.set(path, parent);
      if (id && id !== keyPath && id !== path) map.set(id, parent);
      if (menu.children?.length) {
        visit(menu.children, id || parent);
      }
    }
  };
  visit(rootMenus.value, null);
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

// 同步 selectedRootMenu 变化到父组件
watch(selectedRootMenu, (menu) => {
  emit('rootMenuChange', menu);
});

// 根据当前路径自动选中一级菜单，并记录激活的子菜单
watch(
  [activeKey, rootMenus],
  ([key, menuList]) => {
    if (!menuList.length) {
      if (selectedRootMenu.value) {
        selectedRootMenu.value = null;
      }
      if (extraVisible.value) {
        extraVisible.value = false;
      }
      return;
    }

    const syncKey = key || '';
    if (lastSyncRef.value.key === syncKey && lastSyncRef.value.menus === menuList) {
      return;
    }
    lastSyncRef.value = { key: syncKey, menus: menuList };

    let rootMenu: MenuItem | undefined;
    for (const item of menuList) {
      const menuId = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      const isActive = key === activeKey.value || path === activeKey.value;
      const hasActiveChild = menuId ? activeParentSet.value.has(menuId) : false;
      if (isActive || hasActiveChild) {
        rootMenu = item;
        break;
      }
    }
    if (!rootMenu) {
      rootMenu = menuList[0];
    }
    if (rootMenu) {
      const currentId = selectedRootMenu.value ? getMenuId(selectedRootMenu.value) : '';
      const nextId = getMenuId(rootMenu);
      if (currentId !== nextId) {
        selectedRootMenu.value = rootMenu;
      }
      const nextExtraVisible = !!(rootMenu.children && rootMenu.children.length > 0);
      if (extraVisible.value !== nextExtraVisible) {
        extraVisible.value = nextExtraVisible;
      }
      // 记录该一级菜单最后激活的子菜单
      if (rootMenu.children?.length && key) {
        lastActiveSubMenuMap.set(getMenuId(rootMenu), key);
      }
    }
  },
  { immediate: true }
);

// 处理一级菜单悬停
const onRootMenuEnter = (item: MenuItem) => {
  const currentId = selectedRootMenu.value ? getMenuId(selectedRootMenu.value) : '';
  const nextId = getMenuId(item);
  if (currentId !== nextId) {
    selectedRootMenu.value = item;
  }
  if (item.children?.length && !extraVisible.value) {
    extraVisible.value = true;
  }
};

// 处理一级菜单点击
const onRootMenuClick = (item: MenuItem) => {
  const currentId = selectedRootMenu.value ? getMenuId(selectedRootMenu.value) : '';
  const nextId = getMenuId(item);
  if (currentId !== nextId) {
    selectedRootMenu.value = item;
  }
  
  if (item.children?.length) {
    if (!extraVisible.value) {
      extraVisible.value = true;
    }
    // 自动激活子菜单：优先使用上次记录的，否则使用第一个
    const autoActivateChild = context.props.sidebar?.autoActivateChild ?? true;
    if (autoActivateChild) {
      const lastActivePath = lastActiveSubMenuMap.get(nextId);
      const firstChildPath = item.children[0]?.path || item.children[0]?.key;
      const targetPath = lastActivePath || firstChildPath;
      const normalizedTarget = targetPath == null || targetPath === '' ? '' : String(targetPath);
      if (normalizedTarget && normalizedTarget !== activeKey.value) {
        handleSelect(normalizedTarget);
      }
    }
  } else if (item.path || item.key) {
    const target = item.key || item.path;
    const normalizedTarget = target == null || target === '' ? '' : String(target);
    if (normalizedTarget) handleSelect(normalizedTarget);
  }
};

// 判断一级菜单是否选中 - 使用 shallowRef 缓存 Map，减少重复构造
const updateRootActiveMap = () => {
  const map = new Map<string, boolean>();
  menus.value.forEach((item) => {
    const menuId = getMenuId(item);
    const rawKey = item.key ?? '';
    const key = rawKey === '' ? '' : String(rawKey);
    const rawPath = item.path ?? '';
    const path = rawPath === '' ? '' : String(rawPath);
    const isActive =
      (selectedRootMenu.value ? getMenuId(selectedRootMenu.value) : '') === menuId ||
      menuId === activeKey.value ||
      key === activeKey.value ||
      path === activeKey.value ||
      (menuId ? activeParentSet.value.has(menuId) : false);
    map.set(menuId, Boolean(isActive));
  });
  const prev = rootActiveMap.value;
  let isSame = prev.size === map.size;
  if (isSame) {
    for (const [key, value] of map) {
      if (prev.get(key) !== value) {
        isSame = false;
        break;
      }
    }
  }
  if (!isSame) {
    rootActiveMap.value = map;
  }
};

watch([menus, activeKey, selectedRootMenu], updateRootActiveMap, { immediate: true });

// 判断一级菜单是否选中
const isRootActive = (item: MenuItem) => rootActiveMap.value.get(getMenuId(item)) ?? false;

</script>

<template>
  <div class="mixed-sidebar-menu">
    <!-- Logo 区域 -->
    <div v-if="logoConfig.enable !== false && !isHeaderMixedNav" class="mixed-sidebar-menu__logo">
      <div class="flex h-header items-center justify-center">
        <img
          v-if="logoConfig.source"
          :src="theme === 'dark' && logoConfig.sourceDark ? logoConfig.sourceDark : logoConfig.source"
          :alt="context.props.appName || 'Logo'"
          class="h-8 w-8 object-contain"
        />
        <span v-else-if="context.props.appName" class="text-lg font-bold">
          {{ context.props.appName.charAt(0) }}
        </span>
        <span v-else class="text-lg">🏠</span>
      </div>
    </div>
    
    <!-- 一级菜单（只显示图标） -->
    <nav ref="rootNavRef" class="mixed-sidebar-menu__root" :style="{ position: 'relative' }">
      <div :style="{ height: `${rootTotalHeight}px`, pointerEvents: 'none' }" />
      <template v-for="(item, index) in visibleRootMenus" :key="getMenuId(item) || item.name || index">
        <div
          v-if="!item.hidden"
          class="mixed-sidebar-menu__root-item data-active:text-foreground data-disabled:opacity-50"
          :class="{ 'mixed-sidebar-menu__root-item--active': isRootActive(item) }"
          :data-state="isRootActive(item) ? 'active' : 'inactive'"
          :data-disabled="item.disabled ? 'true' : undefined"
          :title="item.name"
          :style="{
            position: 'absolute',
            top: `${(rootStartIndex + index) * rootItemHeight}px`,
            left: 0,
            right: 0,
          }"
          @mouseenter="onRootMenuEnter(item)"
          @click="onRootMenuClick(item)"
        >
          <!-- 图标 -->
          <span v-if="item.icon" class="mixed-sidebar-menu__icon">
            <MenuIcon :icon="item.icon" size="h-5 w-5" />
          </span>
          <span v-else class="mixed-sidebar-menu__icon">
            {{ item.name.charAt(0) }}
          </span>
          
          <!-- 名称（缩略） -->
          <span class="mixed-sidebar-menu__root-name">{{ item.name }}</span>
        </div>
      </template>
    </nav>
  </div>
</template>

<script lang="ts">
// 导出子菜单组件供扩展区域使用
import { defineComponent, h, Teleport, reactive } from 'vue';
import type { PropType } from 'vue';
import LayoutIcon from '../common/LayoutIcon.vue';
import MenuIconView from '../common/MenuIcon.vue';

export const MixedSidebarSubMenu = defineComponent({
  name: 'MixedSidebarSubMenu',
  props: {
    menus: {
      type: Array as PropType<MenuItem[]>,
      default: () => [],
    },
    activeKey: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: true,
    },
    showCollapseBtn: {
      type: Boolean,
      default: true,
    },
    showPinBtn: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      default: 'light',
    },
  },
  emits: ['select', 'collapse', 'togglePin'],
  setup(props, { emit }) {
    const context = useLayoutContext();
    const expandedKeys = ref<Set<string>>(new Set());
    const SUB_RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
    const renderCount = ref<number>(SUB_RENDER_CHUNK);
    const navRef = ref<HTMLElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    const popupRef = ref<HTMLElement | null>(null);
    const popupAnchorRef = ref<HTMLElement | null>(null);
    const popupState = reactive({
      visible: false,
      item: null as MenuItem | null,
      top: 0,
      left: 0,
    });
    const popupTheme = computed(() => props.theme || 'light');
    const subItemResizeObserver = ref<ResizeObserver | null>(null);
    const subResizeObserver = ref<ResizeObserver | null>(null);
    const scrollTop = ref(0);
    const viewportHeight = ref(0);
    const subItemHeight = ref(40);
    const SUB_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
    const getMenuId = (menu: MenuItem) => {
      const id = menu.key ?? menu.path ?? menu.name ?? '';
      return id === '' ? '' : String(id);
    };

    watch(
      () => [props.menus, props.collapsed] as const,
      ([list, collapsed]) => {
        const nextCount = collapsed
          ? list.length
          : Math.min(SUB_RENDER_CHUNK, list.length);
        if (renderCount.value !== nextCount) {
          renderCount.value = nextCount;
        }
      },
      { immediate: true }
    );

    watchEffect((onCleanup) => {
      if (props.collapsed || renderCount.value >= props.menus.length) return;
      const frame = requestAnimationFrame(() => {
        renderCount.value = Math.min(renderCount.value + SUB_RENDER_CHUNK, props.menus.length);
      });
      onCleanup(() => cancelAnimationFrame(frame));
    });

    const visibleMenus = computed(() => props.menus.slice(0, renderCount.value));
    const virtualTotalHeight = computed(() => props.menus.length * subItemHeight.value);
    const virtualStartIndex = computed(() =>
      Math.max(0, Math.floor(scrollTop.value / subItemHeight.value) - SUB_OVERSCAN)
    );
    const virtualEndIndex = computed(() =>
      Math.min(
        props.menus.length,
        Math.ceil((scrollTop.value + viewportHeight.value) / subItemHeight.value) + SUB_OVERSCAN
      )
    );
    const virtualMenus = computed(() =>
      props.menus.slice(virtualStartIndex.value, virtualEndIndex.value)
    );
    const renderMenus = computed(() => (props.collapsed ? virtualMenus.value : visibleMenus.value));

    watch(
      [() => props.collapsed, virtualTotalHeight, viewportHeight, scrollTop],
      ([collapsed, totalHeight, viewHeight, currentTop]) => {
        if (!collapsed) return;
        const maxScrollTop = Math.max(0, totalHeight - viewHeight);
        if (currentTop <= maxScrollTop) return;
        const nextTop = Math.max(0, maxScrollTop);
        if (navRef.value) {
          navRef.value.scrollTop = nextTop;
        }
        if (scrollTop.value !== nextTop) {
          scrollTop.value = nextTop;
        }
      }
    );

    const menuKeySet = computed(() => {
      const set = new Set<string>();
      const stack = [...props.menus].reverse();
      while (stack.length > 0) {
        const item = stack.pop();
        if (!item) continue;
        const id = getMenuId(item);
        if (id) set.add(id);
        if (item.children?.length) {
          for (let i = item.children.length - 1; i >= 0; i -= 1) {
            stack.push(item.children[i]);
          }
        }
      }
      return set;
    });

    const toggleExpand = (key: string) => {
      if (!menuKeySet.value.has(key)) return;
      if (expandedKeys.value.has(key)) {
        expandedKeys.value.delete(key);
      } else {
        expandedKeys.value.add(key);
      }
    };

    const parentPathMap = computed(() => {
      const map = new Map<string, string | null>();
      const visit = (items: MenuItem[], parent: string | null) => {
        for (const menu of items) {
          const rawKey = menu.key ?? '';
          const keyPath = rawKey === '' ? '' : String(rawKey);
          const rawPath = menu.path ?? '';
          const path = rawPath === '' ? '' : String(rawPath);
          const id = getMenuId(menu);
          if (keyPath) map.set(keyPath, parent);
          if (path && path !== keyPath) map.set(path, parent);
          if (id && id !== keyPath && id !== path) map.set(id, parent);
          if (menu.children?.length) {
            visit(menu.children, id || parent);
          }
        }
      };
      visit(props.menus, null);
      return map;
    });
    const activeParentSet = computed(() => {
      const parentSet = new Set<string>();
      if (!props.activeKey) return parentSet;
      let current = props.activeKey;
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

    const hidePopupMenu = () => {
      popupState.visible = false;
      popupState.item = null;
      popupAnchorRef.value = null;
    };

    const syncPopupExpandedKeys = (root: MenuItem) => {
      const keys = new Set<string>();
      if (!root.children?.length) return keys;
      const stack = [...root.children].reverse();
      while (stack.length > 0) {
        const child = stack.pop();
        if (!child) continue;
        const childId = getMenuId(child);
        const isActive = childId === props.activeKey;
        if ((childId && activeParentSet.value.has(childId)) || isActive) {
          keys.add(childId);
          if (child.children?.length) {
            for (let i = child.children.length - 1; i >= 0; i -= 1) {
              stack.push(child.children[i]);
            }
          }
        }
      }
      return keys;
    };

    const showPopupMenu = (item: MenuItem, event: MouseEvent) => {
      const target = event.currentTarget as HTMLElement;
      popupAnchorRef.value = target;
      const rect = target.getBoundingClientRect();
      const containerRect = containerRef.value?.getBoundingClientRect();
      popupState.top = rect.top;
      popupState.left = containerRect ? containerRect.right : rect.right;
      expandedKeys.value = syncPopupExpandedKeys(item);
      popupState.item = item;
      popupState.visible = true;
    };

    const updatePopupPosition = () => {
      if (!popupState.visible || !popupAnchorRef.value) return;
      const rect = popupAnchorRef.value.getBoundingClientRect();
      const containerRect = containerRef.value?.getBoundingClientRect();
      popupState.top = rect.top;
      popupState.left = containerRect ? containerRect.right : rect.right;
    };

    const onClick = (item: MenuItem, event?: MouseEvent) => {
      const id = getMenuId(item);
      if (item.children?.length) {
        if (props.collapsed && event) {
          if (popupState.visible && popupState.item && getMenuId(popupState.item) === id) {
            hidePopupMenu();
            return;
          }
          showPopupMenu(item, event);
          return;
        }
        toggleExpand(id);
      } else {
        const target = item.path ?? item.key ?? id;
        const normalizedTarget = target == null || target === '' ? '' : String(target);
        if (normalizedTarget) {
          emit('select', normalizedTarget);
        }
        hidePopupMenu();
      }
    };

    const renderMenuItem = (item: MenuItem, level: number, style?: Record<string, string>) => {
      if (item.hidden) return null;

      const menuId = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      const active =
        menuId === props.activeKey ||
        key === props.activeKey ||
        path === props.activeKey;
      const hasChildren = Boolean(item.children?.length);
      const expanded = expandedKeys.value.has(menuId);
      const hasActive = menuId ? activeParentSet.value.has(menuId) : false;

      const itemClass = (() => {
        const classes = [
          'mixed-sidebar-submenu__item',
          'data-active:text-primary data-disabled:opacity-50',
          `mixed-sidebar-submenu__item--level-${level}`,
        ];
        if (active) classes.push('mixed-sidebar-submenu__item--active');
        if (hasActive) classes.push('mixed-sidebar-submenu__item--has-active-child');
        return classes.join(' ');
      })();

      const children = [
        // 图标
        item.icon && h('span', { class: 'mixed-sidebar-submenu__icon' },
          h(MenuIconView, { icon: item.icon, size: 'h-4 w-4' })
        ),
        // 名称（折叠时隐藏）
        !props.collapsed && h('span', { class: 'mixed-sidebar-submenu__name' }, item.name),
        // 箭头（折叠时隐藏）
        !props.collapsed && hasChildren && h('span', {
          class: expanded
            ? 'mixed-sidebar-submenu__arrow mixed-sidebar-submenu__arrow--expanded'
            : 'mixed-sidebar-submenu__arrow',
          'data-expanded': expanded ? 'true' : undefined,
        }, h(LayoutIcon, { name: 'menu-arrow-right', size: 'sm' })),
      ];

      const elements = [
        h('div', {
          class: itemClass,
          'data-has-children': hasChildren ? 'true' : undefined,
          'data-has-active-child': hasActive ? 'true' : undefined,
          'data-expanded': expanded ? 'true' : undefined,
          'data-state': active ? 'active' : 'inactive',
          'data-disabled': item.disabled ? 'true' : undefined,
          'data-level': level,
          onClick: (event: MouseEvent) => onClick(item, event),
        }, children),
      ];

      // 子菜单（折叠时不显示）
      if (!props.collapsed && hasChildren && expanded) {
        elements.push(
          h('div', { class: 'mixed-sidebar-submenu__children' },
            item.children!.map(child => renderMenuItem(child, level + 1))
          )
        );
      }

      return h('div', { class: 'mixed-sidebar-submenu__group', key: menuId, style }, elements);
    };

    const renderPopupItem = (item: MenuItem, level: number) => {
      if (item.hidden) return null;

      const menuId = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      const active =
        menuId === props.activeKey ||
        key === props.activeKey ||
        path === props.activeKey;
      const hasChildren = Boolean(item.children?.length);
      const expanded = expandedKeys.value.has(menuId);
      const hasActive = menuId ? activeParentSet.value.has(menuId) : false;

      const itemClass = (() => {
        const classes = [
          'sidebar-menu__popup-item',
          `sidebar-menu__popup-item--level-${level}`,
        ];
        if (active) classes.push('sidebar-menu__popup-item--active');
        if (hasActive) classes.push('sidebar-menu__popup-item--has-active-child');
        return classes.join(' ');
      })();

      const handlePopupClick = () => {
        if (hasChildren) {
          toggleExpand(menuId);
          return;
        }
        const target = item.path ?? item.key ?? menuId;
        const normalizedTarget = target == null || target === '' ? '' : String(target);
        if (normalizedTarget) {
          emit('select', normalizedTarget);
        }
        hidePopupMenu();
      };

      const popupChildren = [
        item.icon && h('span', { class: 'sidebar-menu__popup-icon' },
          h(MenuIconView, { icon: item.icon, size: 'h-4 w-4' })
        ),
        h('span', { class: 'sidebar-menu__popup-name' }, item.name),
        hasChildren && h('span', {
          class: expanded
            ? 'sidebar-menu__popup-arrow sidebar-menu__popup-arrow--expanded'
            : 'sidebar-menu__popup-arrow',
          'data-expanded': expanded ? 'true' : undefined,
        }, h(LayoutIcon, { name: 'menu-arrow-right', size: 'sm' })),
      ];

      const elements = [
        h('div', {
          class: itemClass,
          'data-state': active ? 'active' : 'inactive',
          'data-disabled': item.disabled ? 'true' : undefined,
          'data-has-active-child': hasActive ? 'true' : undefined,
          'data-has-children': hasChildren ? 'true' : undefined,
          'data-expanded': hasChildren && expanded ? 'true' : undefined,
          'data-level': level,
          onClick: handlePopupClick,
        }, popupChildren),
      ];

      if (hasChildren && expanded) {
        elements.push(
          h('div', { class: 'sidebar-menu__popup-submenu' },
            item.children!.map(child => renderPopupItem(child, level + 1))
          )
        );
      }

      return h('div', { class: 'sidebar-menu__popup-group', key: menuId }, elements);
    };

    onMounted(() => {
      const container = navRef.value;
      if (!container) return;

      const handleScroll = rafThrottle(() => {
        const nextTop = container.scrollTop;
        if (scrollTop.value !== nextTop) {
          scrollTop.value = nextTop;
        }
      });
      const updateHeight = rafThrottle(() => {
        viewportHeight.value = container.clientHeight;
        const firstItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
        if (firstItem) {
          const height = firstItem.getBoundingClientRect().height;
          if (height > 0 && height !== subItemHeight.value) {
            subItemHeight.value = height;
          }
        }
      });

      updateHeight();
      handleScroll();
      container.addEventListener('scroll', handleScroll, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        subResizeObserver.value = new ResizeObserver(updateHeight);
        subResizeObserver.value.observe(container);
      } else {
        window.addEventListener('resize', updateHeight);
      }
      if (typeof ResizeObserver !== 'undefined') {
        const firstItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
        if (firstItem) {
          subItemResizeObserver.value?.disconnect();
          let observedItem = firstItem;
          subItemResizeObserver.value = new ResizeObserver(() => {
            const currentItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
            if (!currentItem) return;
            if (currentItem !== observedItem) {
              subItemResizeObserver.value?.unobserve(observedItem);
              subItemResizeObserver.value?.observe(currentItem);
              observedItem = currentItem;
            }
            const height = currentItem.getBoundingClientRect().height;
            if (height > 0 && height !== subItemHeight.value) {
              subItemHeight.value = height;
            }
          });
          subItemResizeObserver.value.observe(observedItem);
        }
      }
      onUnmounted(() => {
        container.removeEventListener('scroll', handleScroll);
        if (subResizeObserver.value) {
          subResizeObserver.value.disconnect();
          subResizeObserver.value = null;
        } else {
          window.removeEventListener('resize', updateHeight);
        }
        if (subItemResizeObserver.value) {
          subItemResizeObserver.value.disconnect();
          subItemResizeObserver.value = null;
        }
      });
    });

    watch(
      () => popupState.visible,
      (visible) => {
        if (!visible) return;
        const handleDocClick = (event: MouseEvent) => {
          const target = event.target as Node | null;
          if (!target) return;
          if (popupRef.value && popupRef.value.contains(target)) return;
          if (popupAnchorRef.value && popupAnchorRef.value.contains(target)) return;
          hidePopupMenu();
        };
        const handleKeydown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') hidePopupMenu();
        };
        const handleResize = rafThrottle(() => updatePopupPosition());
        const handleScroll = rafThrottle(() => updatePopupPosition());
        document.addEventListener('mousedown', handleDocClick);
        document.addEventListener('keydown', handleKeydown);
        window.addEventListener('resize', handleResize);
        navRef.value?.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
          document.removeEventListener('mousedown', handleDocClick);
          document.removeEventListener('keydown', handleKeydown);
          window.removeEventListener('resize', handleResize);
          navRef.value?.removeEventListener('scroll', handleScroll);
        };
      }
    );

    watch(() => props.collapsed, (collapsed) => {
      if (!collapsed && popupState.visible) {
        hidePopupMenu();
      }
      if (!collapsed) return;
      if (navRef.value) {
        navRef.value.scrollTop = 0;
      }
      if (scrollTop.value !== 0) {
        scrollTop.value = 0;
      }
    });

      return () => {
      // 按钮布局：
      // - 折叠按钮在左下角（只在固定模式下显示）
      // - 固定按钮在右下角（只在未折叠时显示）
      const collapseBtn = props.showCollapseBtn && h('button', {
        class: 'mixed-sidebar-submenu__collapse-btn',
        onClick: () => emit('collapse'),
        title: props.collapsed ? context.t('layout.common.expand') : context.t('layout.common.collapse'),
      }, h(LayoutIcon, {
        name: props.collapsed ? 'submenu-expand' : 'submenu-collapse',
        size: 'sm',
      }));
      
      const pinBtn = props.showPinBtn && h('button', {
        class: 'mixed-sidebar-submenu__pin-btn',
        onClick: () => emit('togglePin'),
        title: props.pinned ? context.t('layout.common.unpin') : context.t('layout.common.pin'),
      }, h(LayoutIcon, {
        name: props.pinned ? 'tabbar-unpin' : 'tabbar-pin',
        size: 'sm',
        className: 'h-3.5 w-3.5',
      }));
      
      const containerClass = props.collapsed
        ? 'mixed-sidebar-submenu mixed-sidebar-submenu--collapsed'
        : 'mixed-sidebar-submenu';

      const popupNode = popupState.visible && popupState.item
        ? h(Teleport, { to: 'body' }, h('div', {
            ref: popupRef,
            class: `sidebar-menu__popup sidebar-menu__popup--${popupTheme.value}`,
            'data-theme': popupTheme.value,
            style: {
              top: `${popupState.top}px`,
              left: `${popupState.left}px`,
            },
          }, [
            h('div', { class: 'sidebar-menu__popup-title' }, popupState.item.name),
            h('div', { class: 'sidebar-menu__popup-content' },
              (popupState.item.children ?? []).map(child => renderPopupItem(child, 0))
            ),
          ]))
        : null;
      
      return h('div', { ref: containerRef, class: containerClass, 'data-collapsed': props.collapsed ? 'true' : undefined }, [
        // 折叠按钮（左下角）
        collapseBtn,
        // 固定按钮（右下角）
        pinBtn,
        // 标题（折叠模式不显示）
        !props.collapsed && props.title && h('div', { class: 'mixed-sidebar-submenu__title' }, props.title),
        // 菜单列表
        h('nav', {
          class: 'mixed-sidebar-submenu__nav',
          ref: navRef,
          style: props.collapsed ? { position: 'relative' } : undefined,
        }, [
          props.collapsed
            ? h('div', { style: { height: `${virtualTotalHeight.value}px`, pointerEvents: 'none' } })
            : null,
          ...renderMenus.value.map((item, index) => {
            const actualIndex = virtualStartIndex.value + index;
            const itemStyle = props.collapsed
              ? {
                  position: 'absolute',
                  top: `${actualIndex * subItemHeight.value}px`,
                  left: '0',
                  right: '0',
                }
              : undefined;
            return renderMenuItem(item, 0, itemStyle);
          }),
        ]),
        popupNode,
      ]);
    };
  },
});
</script>

<style>
/* 混合侧边栏菜单样式 */
.mixed-sidebar-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mixed-sidebar-menu__root {
  padding: 0.5rem 0;
}

.mixed-sidebar-menu__root-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  margin: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all var(--admin-duration-fast, 150ms) ease;
}

.mixed-sidebar-menu__root-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:is(.mixed-sidebar-menu__root-item--active, .mixed-sidebar-menu__root-item[data-state="active"]) {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

.mixed-sidebar-menu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.mixed-sidebar-menu__root-name {
  font-size: 0.625rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

/* 子菜单样式 */
.mixed-sidebar-submenu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mixed-sidebar-submenu__title {
  padding: 1rem 1rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground, #1f2937);
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  margin-bottom: 0.5rem;
}

.mixed-sidebar-submenu__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  content-visibility: auto;
  contain-intrinsic-size: 600px 800px;
}

.mixed-sidebar-submenu__item {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  margin: 0.125rem 0;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--foreground, #4b5563);
  transition: all var(--admin-duration-fast, 150ms) ease;
  font-size: 0.875rem;
}

.mixed-sidebar-submenu__item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--foreground, #1f2937);
}

:is(.mixed-sidebar-submenu__item--active, .mixed-sidebar-submenu__item[data-state="active"]) {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

:is(.mixed-sidebar-submenu__item--has-active-child, .mixed-sidebar-submenu__item[data-has-active-child="true"]) {
  color: var(--primary, #3b82f6);
}

.mixed-sidebar-submenu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.mixed-sidebar-submenu__name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mixed-sidebar-submenu__arrow {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  transition: transform 200ms ease;
  flex-shrink: 0;
}

:is(.mixed-sidebar-submenu__arrow--expanded, .mixed-sidebar-submenu__arrow[data-expanded="true"]) {
  transform: rotate(90deg);
}

.mixed-sidebar-submenu__children {
  margin-left: 0.75rem;
  border-left: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  padding-left: 0.5rem;
}

:is(.mixed-sidebar-submenu__item--level-1, .mixed-sidebar-submenu__item[data-level="1"]) {
  padding-left: 1rem;
}

:is(.mixed-sidebar-submenu__item--level-2, .mixed-sidebar-submenu__item[data-level="2"]) {
  padding-left: 1.25rem;
}

/* 浅色主题 */
:is(.layout-sidebar--light, .layout-sidebar[data-theme="light"]) .mixed-sidebar-menu__root-item {
  color: #4b5563;
}

:is(.layout-sidebar--light, .layout-sidebar[data-theme="light"]) .mixed-sidebar-menu__root-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

/* 深色主题下子菜单样式 */
:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) .mixed-sidebar-submenu__title {
  color: rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) .mixed-sidebar-submenu__item {
  color: rgba(255, 255, 255, 0.7);
}

:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) .mixed-sidebar-submenu__item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) :is(.mixed-sidebar-submenu__item--active, .mixed-sidebar-submenu__item[data-state="active"]) {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) :is(.mixed-sidebar-submenu__item--has-active-child, .mixed-sidebar-submenu__item[data-has-active-child="true"]) {
  color: var(--primary, #3b82f6);
}

:is(.layout-sidebar--dark, .layout-sidebar[data-theme="dark"]) .mixed-sidebar-submenu__children {
  border-left-color: rgba(255, 255, 255, 0.1);
}
</style>
