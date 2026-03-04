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

/**
 * 布局上下文
 * @description 提供菜单配置、国际化能力与全局运行时状态。
 */
const context = useLayoutContext();
/**
 * 侧栏运行时状态
 * @description 提供混合侧栏扩展区域可见性与布局派生结果。
 */
const { extraVisible, layoutComputed } = useSidebarState();
/**
 * 菜单运行时状态
 * @description 提供当前激活键与菜单选中处理函数。
 */
const { activeKey, handleSelect } = useMenuState();

/**
 * Logo 配置
 * @description 读取品牌区资源与显示开关。
 */
const logoConfig = computed(() => context.props.logo || {});
/**
 * 侧栏主题
 * @description 使用布局派生主题，兼容半深色侧栏策略。
 */
const theme = computed(() => layoutComputed.value?.sidebarTheme || 'light');
/**
 * 是否 `header-mixed-nav` 布局
 * @description 用于决定根菜单来源与 logo 区域展示逻辑。
 */
const isHeaderMixedNav = computed(() => layoutComputed.value.isHeaderMixedNav);

/**
 * 组件事件
 * @description 当一级菜单切换时向父组件同步当前根菜单。
 */
const emit = defineEmits<{
  (e: 'rootMenuChange', menu: MenuItem | null): void;
}>();

/**
 * 原始菜单集合
 * @description 从布局上下文读取菜单并做空数组兜底。
 */
const menus = computed<MenuItem[]>(() => context.props.menus || []);

/**
 * 规范化菜单键值，统一转换为字符串。
 *
 * @param value 原始键值。
 * @returns 规范化后的字符串键。
 */
const normalizeKey = (value: unknown) => {
  if (value == null || value === '') return '';
  return String(value);
};

/**
 * 获取菜单稳定标识，优先使用 `key`，其次 `path` 与 `name`。
 *
 * @param menu 菜单项。
 * @returns 菜单唯一标识字符串。
 */
const getMenuId = (menu: MenuItem) => {
  const id = menu.key ?? menu.path ?? menu.name ?? '';
  return id === '' ? '' : String(id);
};

/**
 * 判断菜单项是否命中目标键（支持 key/path/id）。
 *
 * @param menu 菜单项。
 * @param key 目标键。
 * @returns 是否命中。
 */
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

/**
 * 判断菜单树中是否包含目标键对应的节点。
 *
 * @param menu 根菜单项。
 * @param key 目标键。
 * @returns 是否包含目标节点。
 */
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

/**
 * 根据目标键定位对应的一级菜单。
 *
 * @param key 目标键。
 * @returns 匹配到的一级菜单，未匹配返回 null。
 */
const findRootMenuByKey = (key: string) => {
  if (!key) return null;
  for (const item of menus.value) {
    if (item.hidden) continue;
    if (menuContainsKey(item, key)) return item;
  }
  return null;
};
/**
 * 顶部混合布局的当前一级菜单
 * @description 在 `header-mixed-nav` 下根据激活键定位当前根菜单。
 */
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
/**
 * 监听顶部混合根菜单变化
 * @description 当根菜单切换时同步 `mixedNavRootKey`，确保跨区域状态一致。
 */
watch(headerMixedRootMenu, (rootMenu) => {
  if (!isHeaderMixedNav.value || !rootMenu) return;
  const rootKey = normalizeKey(rootMenu.key ?? rootMenu.path ?? '');
  if (!rootKey || rootKey === context.state.mixedNavRootKey) return;
  context.state.mixedNavRootKey = rootKey;
});
/**
 * 当前显示的一级菜单集合
 * @description 普通混合模式显示顶层菜单；头部混合模式显示根菜单子级。
 */
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
/**
 * 一级菜单滚动容器引用
 * @description 用于监听滚动、计算虚拟列表可视区。
 */
const rootNavRef = ref<HTMLElement | null>(null);
/**
 * 一级菜单滚动位置
 * @description 虚拟列表起始索引计算依据。
 */
const rootScrollTop = ref(0);
/**
 * 一级菜单视口高度
 * @description 虚拟列表结束索引计算依据。
 */
const rootViewportHeight = ref(0);
/**
 * 一级菜单项估算高度
 * @description 通过首项测量动态更新，降低虚拟滚动偏差。
 */
const rootItemHeight = ref(72);
/**
 * 一级菜单虚拟滚动预渲染数量
 * @description 在可视区前后额外渲染若干项提升滚动平滑度。
 */
const ROOT_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
/**
 * 一级菜单容器尺寸观察器
 * @description 监听容器高度变化并更新可视区。
 */
const rootResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 一级菜单项尺寸观察器
 * @description 监听首项高度变化，修正虚拟列表 item 高度估算。
 */
const rootItemResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 一级菜单总高度
 * @description 虚拟滚动占位容器高度。
 */
const rootTotalHeight = computed(() => rootMenus.value.length * rootItemHeight.value);
/**
 * 一级菜单起始索引
 * @description 按滚动位置与 overscan 计算。
 */
const rootStartIndex = computed(() =>
  Math.max(0, Math.floor(rootScrollTop.value / rootItemHeight.value) - ROOT_OVERSCAN)
);
/**
 * 一级菜单结束索引
 * @description 按视口高度与 overscan 计算，并限制在数据长度内。
 */
const rootEndIndex = computed(() =>
  Math.min(
    rootMenus.value.length,
    Math.ceil((rootScrollTop.value + rootViewportHeight.value) / rootItemHeight.value) + ROOT_OVERSCAN
  )
);
/**
 * 一级菜单可见分片
 * @description 供模板层渲染的虚拟窗口数据。
 */
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

  /**
   * 根菜单滚动事件处理
   * @description 以 raf 节流同步滚动位置，驱动虚拟列表窗口计算。
   */
  const handleScroll = rafThrottle(() => {
    const nextTop = container.scrollTop;
    if (rootScrollTop.value !== nextTop) {
      rootScrollTop.value = nextTop;
    }
  });
  /**
   * 根菜单尺寸更新处理
   * @description 同步容器高度并尝试测量首项高度。
   */
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

/**
 * 当前选中的一级菜单
 * @description 用于驱动右侧子菜单面板内容展示。
 */
const selectedRootMenu = ref<MenuItem | null>(null);

/**
 * 一级菜单最近激活子菜单映射
 * @description 记录“根菜单 -> 最近激活子菜单键”，用于点击根菜单时自动定位。
 */
const lastActiveSubMenuMap = new Map<string, string>();
/**
 * 一级菜单激活态缓存
 * @description 预先计算并缓存激活结果，减少模板内重复计算。
 */
const rootActiveMap = shallowRef(new Map<string, boolean>());
/**
 * 上一次同步快照
 * @description 用于去重 `activeKey/rootMenus` 联动 watcher 的重复执行。
 */
const lastSyncRef = ref<{ key: string | null; menus: MenuItem[] | null }>({
  key: null,
  menus: null,
});

/**
 * 节点父级映射
 * @description 构建当前菜单树“节点 -> 父节点”关系用于向上追溯激活链路。
 */
const parentPathMap = computed(() => {
  const map = new Map<string, string | null>();

  /**
   * 遍历菜单树并建立“节点 -> 父节点”映射关系。
   *
   * @param items 当前层菜单集合。
   * @param parent 父节点标识。
   */
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
/**
 * 激活父级集合
 * @description 根据当前激活键回溯父节点链，用于高亮根节点和祖先节点。
 */
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

/**
 * 同步选中的一级菜单变化到父组件。
 */
watch(selectedRootMenu, (menu) => {
  emit('rootMenuChange', menu);
});

/**
 * 根据当前激活路径自动选中一级菜单，并记录激活子菜单。
 */
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
      /** 记录该一级菜单最后激活的子菜单。 */
      if (rootMenu.children?.length && key) {
        lastActiveSubMenuMap.set(getMenuId(rootMenu), key);
      }
    }
  },
  { immediate: true }
);

/**
 * 处理一级菜单悬停，切换选中根菜单并展开扩展区域。
 *
 * @param item 当前悬停的一级菜单。
 */
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

/**
 * 处理一级菜单点击，支持自动激活子菜单。
 *
 * @param item 被点击的一级菜单。
 */
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
    /** 自动激活子菜单：优先使用历史记录，否则回退到首个子菜单。 */
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

/**
 * 重新计算一级菜单激活映射，减少模板层重复判断开销。
 */
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

/**
 * 判断一级菜单是否处于激活态。
 *
 * @param item 一级菜单项。
 * @returns 是否激活。
 */
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
/**
 * 导出子菜单组件供扩展区域复用。
 */
import { defineComponent, h, Teleport, reactive } from 'vue';
import type { PropType } from 'vue';
import LayoutIcon from '../common/LayoutIcon.vue';
import MenuIconView from '../common/MenuIcon.vue';

/**
 * 混合导航子菜单组件。
 * @description 在混合布局中渲染二级/多级菜单树，处理展开、弹层与选中联动。
 */
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
  /**
   * 混合侧边菜单组合逻辑。
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit }) {
    /**
     * 布局上下文
     * @description 提供国际化文案与全局布局状态访问能力。
     */
    const context = useLayoutContext();
    /**
     * 展开键集合
     * @description 记录当前展开的子菜单节点标识。
     */
    const expandedKeys = ref<Set<string>>(new Set());
    /**
     * 分片渲染步长
     * @description 非折叠菜单模式下分帧增加渲染数量，降低首屏阻塞。
     */
    const SUB_RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
    /**
     * 当前渲染数量
     * @description 控制普通模式下菜单渲染上限。
     */
    const renderCount = ref<number>(SUB_RENDER_CHUNK);
    /**
     * 子菜单滚动容器引用
     * @description 折叠态虚拟滚动与尺寸测量入口。
     */
    const navRef = ref<HTMLElement | null>(null);
    /**
     * 子菜单根容器引用
     * @description 用于弹出菜单定位时读取容器边界。
     */
    const containerRef = ref<HTMLElement | null>(null);
    /**
     * 弹出菜单容器引用
     * @description 用于“点击外部关闭”判定。
     */
    const popupRef = ref<HTMLElement | null>(null);
    /**
     * 弹出菜单锚点引用
     * @description 指向触发弹层的菜单项元素，供定位与滚动跟随使用。
     */
    const popupAnchorRef = ref<HTMLElement | null>(null);
    /**
     * 弹出菜单状态
     * @description 管理弹层显隐、目标菜单与定位坐标。
     */
    const popupState = reactive({
      visible: false,
      item: null as MenuItem | null,
      top: 0,
      left: 0,
    });
    /**
     * 弹出菜单主题
     * @description 跟随传入主题属性渲染明暗样式。
     */
    const popupTheme = computed(() => props.theme || 'light');
    /**
     * 子菜单项尺寸观察器
     * @description 动态采样单项高度，修正虚拟滚动估算。
     */
    const subItemResizeObserver = ref<ResizeObserver | null>(null);
    /**
     * 子菜单容器尺寸观察器
     * @description 容器高度变化时更新视口尺寸。
     */
    const subResizeObserver = ref<ResizeObserver | null>(null);
    /**
     * 折叠态滚动位置
     * @description 虚拟滚动窗口计算依据。
     */
    const scrollTop = ref(0);
    /**
     * 折叠态视口高度
     * @description 虚拟滚动结束索引计算依据。
     */
    const viewportHeight = ref(0);
    /**
     * 子菜单项高度估算
     * @description 由实际渲染项测量并动态更新。
     */
    const subItemHeight = ref(40);
    /**
     * 子菜单虚拟滚动预渲染数量
     * @description 在可视区前后渲染额外项以避免滚动闪烁。
     */
    const SUB_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;

    /**
     * 获取子菜单稳定标识。
     *
     * @param menu 菜单项。
     * @returns 菜单标识字符串。
     */
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

    /**
     * 普通模式可见菜单分片
     * @description 按分帧渲染数量截取当前需要渲染的菜单集合。
     */
    const visibleMenus = computed(() => props.menus.slice(0, renderCount.value));
    /**
     * 折叠态虚拟总高度
     * @description 虚拟滚动占位高度。
     */
    const virtualTotalHeight = computed(() => props.menus.length * subItemHeight.value);
    /**
     * 折叠态起始索引
     * @description 依据滚动位置和 overscan 计算。
     */
    const virtualStartIndex = computed(() =>
      Math.max(0, Math.floor(scrollTop.value / subItemHeight.value) - SUB_OVERSCAN)
    );
    /**
     * 折叠态结束索引
     * @description 依据视口高度和 overscan 计算，并限制在数据长度内。
     */
    const virtualEndIndex = computed(() =>
      Math.min(
        props.menus.length,
        Math.ceil((scrollTop.value + viewportHeight.value) / subItemHeight.value) + SUB_OVERSCAN
      )
    );
    /**
     * 折叠态虚拟窗口菜单
     * @description 从完整菜单中按虚拟索引切片得到当前渲染窗口。
     */
    const virtualMenus = computed(() =>
      props.menus.slice(virtualStartIndex.value, virtualEndIndex.value)
    );
    /**
     * 实际渲染菜单集合
     * @description 折叠态走虚拟列表，展开态走分片渐进渲染。
     */
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

    /**
     * 菜单键集合
     * @description 展平当前菜单树，生成合法菜单键集合用于展开校验。
     */
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

    /**
     * 切换子菜单展开状态。
     *
     * @param key 菜单键。
     */
    const toggleExpand = (key: string) => {
      if (!menuKeySet.value.has(key)) return;
      if (expandedKeys.value.has(key)) {
        expandedKeys.value.delete(key);
      } else {
        expandedKeys.value.add(key);
      }
    };

    /**
     * 子菜单父级映射
     * @description 构建“节点 -> 父节点”关系用于祖先激活判断。
     */
    const parentPathMap = computed(() => {
      const map = new Map<string, string | null>();

      /**
       * 遍历子菜单树并建立父子映射关系。
       *
       * @param items 当前层菜单。
       * @param parent 父级标识。
       */
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
    /**
     * 当前激活链父级集合
     * @description 从当前激活键向上回溯，得到所有祖先节点标识。
     */
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

    /**
     * 关闭折叠态弹出菜单。
     */
    const hidePopupMenu = () => {
      popupState.visible = false;
      popupState.item = null;
      popupAnchorRef.value = null;
    };

    /**
     * 根据当前激活路径，计算弹出菜单默认展开键集合。
     *
     * @param root 当前弹出根菜单。
     * @returns 需要展开的键集合。
     */
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

    /**
     * 显示折叠态弹出菜单并同步定位与展开状态。
     *
     * @param item 根菜单项。
     * @param event 鼠标事件。
     */
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

    /**
     * 根据锚点与容器位置更新弹出菜单坐标。
     */
    const updatePopupPosition = () => {
      if (!popupState.visible || !popupAnchorRef.value) return;
      const rect = popupAnchorRef.value.getBoundingClientRect();
      const containerRect = containerRef.value?.getBoundingClientRect();
      popupState.top = rect.top;
      popupState.left = containerRect ? containerRect.right : rect.right;
    };

    /**
     * 处理子菜单点击，兼容折叠态弹层与普通展开模式。
     *
     * @param item 被点击菜单项。
     * @param event 鼠标事件。
     */
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

    /**
     * 渲染普通侧栏菜单项（含递归子项）。
     *
     * @param item 菜单项。
     * @param level 菜单层级。
     * @param style 可选行内样式。
     * @returns 渲染节点。
     */
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

      /**
       * 构建普通菜单项类名。
       *
       * @returns 类名字符串。
       */
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
        item.icon && h('span', { class: 'mixed-sidebar-submenu__icon' },
          h(MenuIconView, { icon: item.icon, size: 'h-4 w-4' })
        ),
        !props.collapsed && h('span', { class: 'mixed-sidebar-submenu__name' }, item.name),
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

      /** 子菜单在折叠状态下不显示。 */
      if (!props.collapsed && hasChildren && expanded) {
        elements.push(
          h('div', { class: 'mixed-sidebar-submenu__children' },
            item.children!.map(child => renderMenuItem(child, level + 1))
          )
        );
      }

      return h('div', { class: 'mixed-sidebar-submenu__group', key: menuId, style }, elements);
    };

    /**
     * 渲染折叠态弹出菜单项（含递归子项）。
     *
     * @param item 菜单项。
     * @param level 菜单层级。
     * @returns 渲染节点。
     */
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

      /**
       * 构建弹出菜单项类名。
       *
       * @returns 类名字符串。
       */
      const itemClass = (() => {
        const classes = [
          'sidebar-menu__popup-item',
          `sidebar-menu__popup-item--level-${level}`,
        ];
        if (active) classes.push('sidebar-menu__popup-item--active');
        if (hasActive) classes.push('sidebar-menu__popup-item--has-active-child');
        return classes.join(' ');
      })();

      /**
       * 处理弹出菜单项点击，子节点切换展开，叶子节点触发选中。
       */
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

      /**
       * 子菜单滚动事件处理
       * @description 以 raf 节流同步滚动位置，驱动折叠态虚拟窗口计算。
       */
      const handleScroll = rafThrottle(() => {
        const nextTop = container.scrollTop;
        if (scrollTop.value !== nextTop) {
          scrollTop.value = nextTop;
        }
      });
      /**
       * 子菜单尺寸更新处理
       * @description 同步容器高度并测量菜单项高度估算值。
       */
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

        /**
         * 点击弹层外区域时关闭弹出菜单。
         *
         * @param event 鼠标事件。
         */
        const handleDocClick = (event: MouseEvent) => {
          const target = event.target as Node | null;
          if (!target) return;
          if (popupRef.value && popupRef.value.contains(target)) return;
          if (popupAnchorRef.value && popupAnchorRef.value.contains(target)) return;
          hidePopupMenu();
        };

        /**
         * 处理键盘事件，按下 `Escape` 时关闭弹出菜单。
         *
         * @param event 键盘事件。
         */
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
      /*
       * 按钮布局说明：
       * - 折叠按钮位于左下角（仅固定模式显示）
       * - 固定按钮位于右下角（仅未折叠时显示）
       */
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
        collapseBtn,
        pinBtn,
        !props.collapsed && props.title && h('div', { class: 'mixed-sidebar-submenu__title' }, props.title),
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
  border-radius: var(--layout-radius-base, var(--radius, 8px));
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
  border-radius: var(--layout-radius-md, var(--radius-md, 6px));
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
