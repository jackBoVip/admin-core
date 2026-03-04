<script setup lang="ts">
/**
 * 侧边栏菜单组件
 * @description 自动渲染菜单数据，支持多级嵌套
 * 折叠状态下支持悬停弹出子菜单
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

/**
 * 布局上下文
 * @description 提供菜单数据、布局配置与交互事件能力。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 提供当前布局模式、主题等计算结果。
 */
const layoutComputed = useLayoutComputed();
/**
 * 侧边栏状态
 * @description 提供折叠状态与悬停展开状态。
 */
const { collapsed, expandOnHovering } = useSidebarState();
/**
 * 菜单状态
 * @description 提供展开键、激活键及菜单交互处理函数。
 */
const { openKeys, activeKey, handleSelect, handleOpenChange } = useMenuState();

/**
 * 侧边栏主题
 * @description 折叠弹层菜单渲染时使用的主题值。
 */
const sidebarTheme = computed(() => layoutComputed.value.sidebarTheme || 'light');

/**
 * 全量菜单集合
 * @description 从布局上下文读取菜单并做空数组兜底。
 */
const allMenus = computed<MenuItem[]>(() => context.props.menus || []);
/**
 * 是否为混合导航模式
 * @description 混合导航下侧栏菜单来源于当前根菜单子节点。
 */
const isMixedNav = computed(() => layoutComputed.value.isMixedNav);

/**
 * 规范化菜单键值，统一转为可比较的字符串。
 *
 * @param value 原始键值。
 * @returns 规范化后的字符串键。
 */
const normalizeKey = (value: unknown) => (value == null || value === '' ? '' : String(value));

/**
 * 判断菜单项是否命中指定键（支持 key/path/id 三种标识）。
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
 * 判断菜单树中是否包含指定键对应节点。
 *
 * @param menu 根菜单项。
 * @param key 目标键。
 * @returns 是否包含目标节点。
 */
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

/**
 * 依据键值定位混合导航下的根菜单项。
 *
 * @param key 目标键。
 * @returns 匹配的根菜单项，不存在时返回 null。
 */
const findRootMenuByKey = (key: string) => {
  if (!key) return null;
  for (const item of allMenus.value) {
    if (item.hidden) continue;
    if (menuContainsKey(item, key)) return item;
  }
  return null;
};
/**
 * 混合导航派生根菜单
 * @description 优先使用 `mixedNavRootKey` 或当前激活键反查根菜单。
 */
const derivedRootMenu = computed(() => {
  if (!isMixedNav.value) return null;
  const candidateKey = context.state.mixedNavRootKey || activeKey.value;
  if (!candidateKey) return null;
  return findRootMenuByKey(candidateKey);
});
/**
 * 混合导航兜底根菜单
 * @description 当无法定位目标根菜单时，取首个可见根菜单。
 */
const fallbackRootMenu = computed(() => {
  if (!isMixedNav.value) return null;
  for (const item of allMenus.value) {
    if (!item.hidden) return item;
  }
  return null;
});
/**
 * 当前生效根菜单
 * @description 按“派生根菜单 > 兜底根菜单”顺序解析。
 */
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

/**
 * 当前用于渲染的菜单集合
 * @description 混合导航渲染根菜单子项，其他模式渲染全量菜单。
 */
const menus = computed<MenuItem[]>(() => {
  return isMixedNav.value ? (rootMenu.value?.children ?? []) : allMenus.value;
});
/**
 * 过滤隐藏项后的菜单集合
 * @description 仅保留 `hidden !== true` 的可见菜单项。
 */
const filteredMenus = computed(() => {
  const result: MenuItem[] = [];
  for (const item of menus.value) {
    if (!item.hidden) result.push(item);
  }
  return result;
});
/**
 * 主菜单分批渲染批次大小
 * @description 控制每轮追加渲染的菜单项数量。
 */
const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
/**
 * 主菜单当前渲染数量
 * @description 配合分批渲染策略逐步增加。
 */
const renderCount = ref<number>(RENDER_CHUNK);
/**
 * 子菜单分批渲染批次大小
 * @description 控制子菜单递增渲染节奏。
 */
const SUB_RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
/**
 * 子菜单当前渲染数量
 * @description 用于控制展开子菜单的渐进渲染。
 */
const subRenderCount = ref<number>(SUB_RENDER_CHUNK);
/**
 * 主菜单单项高度
 * @description 虚拟滚动计算时的项高基准值。
 */
const menuItemHeight = ref<number>(LAYOUT_UI_TOKENS.MENU_ITEM_HEIGHT);
/**
 * 主菜单项尺寸观察器
 * @description 监听项高变化并更新虚拟滚动计算参数。
 */
const menuItemResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 主菜单虚拟列表 overscan
 * @description 在可视区上下额外渲染的项数量。
 */
const MENU_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
/**
 * 主菜单节点引用
 * @description 用于绑定滚动容器与尺寸观测。
 */
const menuRef = ref<HTMLElement | null>(null);
/**
 * 主菜单滚动位置
 * @description 驱动虚拟列表起止索引计算。
 */
const scrollTop = ref(0);
/**
 * 主菜单视口高度
 * @description 由容器测量结果同步更新。
 */
const viewportHeight = ref(0);
/**
 * 主菜单滚动容器引用
 * @description 缓存实际滚动节点，便于滚动校正。
 */
let scrollContainer: HTMLElement | null = null;
/**
 * 主菜单滚动区尺寸观察器
 * @description 监听容器尺寸变化并刷新虚拟参数。
 */
let scrollResizeObserver: ResizeObserver | null = null;
/**
 * 弹出菜单容器引用
 * @description 折叠模式下悬浮子菜单根节点引用。
 */
const popupRef = ref<HTMLElement | null>(null);
/**
 * 弹出菜单内容区域引用
 * @description 用于计算弹层内部滚动偏移。
 */
const popupContentRef = ref<HTMLElement | null>(null);
/**
 * 弹出菜单滚动位置
 * @description 驱动弹层虚拟列表索引计算。
 */
const popupScrollTop = ref(0);
/**
 * 弹出菜单内容区域顶部偏移
 * @description 用于换算内容区相对滚动位置。
 */
const popupContentTop = ref(0);
/**
 * 弹出菜单视口高度
 * @description 由弹层容器测量同步。
 */
const popupViewportHeight = ref(0);
/**
 * 弹出菜单单项高度
 * @description 虚拟列表计算用项高基准。
 */
const popupItemHeight = ref<number>(LAYOUT_UI_TOKENS.POPUP_MENU_ITEM_HEIGHT);
/**
 * 弹出菜单 overscan
 * @description 在可视区上下额外渲染项数量。
 */
const POPUP_OVERSCAN = LAYOUT_UI_TOKENS.POPUP_OVERSCAN;
/**
 * 弹出菜单启用虚拟化最小项数
 * @description 子项达到阈值后才启用虚拟列表。
 */
const POPUP_VIRTUAL_MIN_ITEMS = LAYOUT_UI_TOKENS.POPUP_VIRTUAL_MIN_ITEMS;
/**
 * 弹出菜单尺寸观察器
 * @description 监听弹层尺寸变化并刷新虚拟参数。
 */
const popupResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 弹出菜单滚轮监听清理函数
 * @description 用于解绑自定义滚轮行为。
 */
let popupWheelCleanup: (() => void) | null = null;

/**
 * 主菜单是否启用虚拟化
 * @description 仅在侧栏折叠且非悬停展开状态下启用。
 */
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

/**
 * 渐进渲染可见菜单切片
 * @description 在非虚拟模式下根据 `renderCount` 截断菜单。
 */
const visibleMenus = computed(() => filteredMenus.value.slice(0, renderCount.value));
/**
 * 主菜单虚拟总高度
 * @description 用于虚拟容器占位高度计算。
 */
const virtualTotalHeight = computed(() => filteredMenus.value.length * menuItemHeight.value);
/**
 * 主菜单虚拟视口高度
 * @description 未测量到高度时返回 0。
 */
const virtualViewportHeight = computed(() => viewportHeight.value || 0);
/**
 * 主菜单虚拟起始索引
 * @description 基于滚动位置与 overscan 计算。
 */
const virtualStartIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / menuItemHeight.value) - MENU_OVERSCAN)
);
/**
 * 主菜单虚拟结束索引
 * @description 基于滚动位置、视口高度与 overscan 计算。
 */
const virtualEndIndex = computed(() =>
  Math.min(
    filteredMenus.value.length,
    Math.ceil((scrollTop.value + virtualViewportHeight.value) / menuItemHeight.value) + MENU_OVERSCAN
  )
);
/**
 * 主菜单虚拟切片
 * @description 返回当前应渲染的菜单区间。
 */
const virtualMenus = computed(() =>
  filteredMenus.value.slice(virtualStartIndex.value, virtualEndIndex.value)
);
/**
 * 最终渲染菜单集合
 * @description 按虚拟化开关选择虚拟切片或渐进切片。
 */
const renderMenus = computed(() =>
  shouldVirtualize.value ? virtualMenus.value : visibleMenus.value
);
/**
 * 菜单容器样式
 * @description 虚拟化时提供相对定位与占位高度。
 */
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

/**
 * 折叠态弹出菜单状态
 * @description 保存弹层目标菜单、显隐与定位坐标。
 */
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

/**
 * 弹层展开键集合
 * @description 记录弹层中展开的子菜单键集合。
 */
const popupExpandedKeys = ref<Set<string>>(new Set());

/**
 * 弹层子菜单集合
 * @description 读取当前弹层根菜单下的子项。
 */
const popupChildren = computed(() => popupMenu.value.item?.children ?? []);
/**
 * 弹层是否启用虚拟化
 * @description 达到最小项数且无展开子项时启用。
 */
const popupShouldVirtualize = computed(
  () => popupExpandedKeys.value.size === 0 && popupChildren.value.length >= POPUP_VIRTUAL_MIN_ITEMS
);
/**
 * 弹层内容相对滚动位置
 * @description 扣除内容区顶部偏移后的滚动值。
 */
const popupContentScrollTop = computed(() =>
  Math.max(0, popupScrollTop.value - popupContentTop.value)
);
/**
 * 弹层虚拟总高度
 * @description 子项数量乘以弹层单项高度。
 */
const popupTotalHeight = computed(() => popupChildren.value.length * popupItemHeight.value);
/**
 * 弹层虚拟起始索引
 * @description 基于滚动位置与 overscan 计算。
 */
const popupStartIndex = computed(() =>
  Math.max(0, Math.floor(popupContentScrollTop.value / popupItemHeight.value) - POPUP_OVERSCAN)
);
/**
 * 弹层虚拟结束索引
 * @description 基于滚动位置、视口高度与 overscan 计算。
 */
const popupEndIndex = computed(() =>
  Math.min(
    popupChildren.value.length,
    Math.ceil((popupContentScrollTop.value + popupViewportHeight.value) / popupItemHeight.value) + POPUP_OVERSCAN
  )
);
/**
 * 弹层可见子项集合
 * @description 虚拟化开启时返回当前区间，否则返回全部子项。
 */
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

/**
 * 更新弹层尺寸与滚动指标
 * @description 节流测量弹层内容偏移、视口高度与项高。
 */
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

/**
 * 同步弹出菜单滚动位置。
 *
 * @param e 滚动事件。
 */
const handlePopupScroll = (e: Event) => {
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  popupScrollTop.value = target.scrollTop;
};

/**
 * 获取可见子菜单列表，按渐进渲染数量进行截断。
 *
 * @param children 子菜单列表。
 * @returns 当前应渲染的子菜单集合。
 */
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

/**
 * 主菜单展开键集合
 * @description 本地维护展开状态，并与外部 `openKeys` 同步。
 */
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

/**
 * 悬停展开延时器
 * @description 控制鼠标进入后延迟显示弹层。
 */
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * 悬停离开延时器
 * @description 控制鼠标离开后延迟隐藏弹层。
 */
let leaveTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * 弹层定位动画帧句柄
 * @description 合并高频定位更新，避免重复重排。
 */
let popupRaf: number | null = null;
/**
 * 侧栏矩形测量动画帧句柄
 * @description 节流侧栏矩形测量操作。
 */
let sidebarRectRaf: number | null = null;
/**
 * 侧栏矩形缓存
 * @description 用于折叠态弹层定位计算。
 */
const sidebarRect = ref<DOMRect | null>(null);

/**
 * 切换主菜单展开状态并同步到全局打开键。
 *
 * @param key 菜单键。
 */
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

/**
 * 切换弹出菜单中的展开状态。
 *
 * @param key 菜单键。
 */
const togglePopupExpand = (key: string) => {
  if (!popupMenuItemMap.value.has(key)) return;
  if (popupExpandedKeys.value.has(key)) {
    popupExpandedKeys.value.delete(key);
  } else {
    popupExpandedKeys.value.add(key);
  }
};

/**
 * 展开指定弹出菜单项（仅展开，不反向折叠）。
 *
 * @param key 菜单键。
 */
const expandPopupItem = (key: string) => {
  if (!popupMenuItemMap.value.has(key)) return;
  if (!popupExpandedKeys.value.has(key)) {
    popupExpandedKeys.value.add(key);
  }
};

/**
 * 处理弹出菜单项悬停，自动展开有子节点的菜单项。
 *
 * @param item 当前悬停菜单项。
 */
const handlePopupItemHover = (item: MenuItem) => {
  if (!hasChildren(item)) return;
  expandPopupItem(getMenuId(item));
};

/**
 * 判断主菜单项是否展开。
 *
 * @param key 菜单键。
 * @returns 是否展开。
 */
const isExpanded = (key: string) => expandedKeys.value.has(key);

/**
 * 判断弹出菜单项是否展开。
 *
 * @param key 菜单键。
 * @returns 是否展开。
 */
const isPopupExpanded = (key: string) => popupExpandedKeys.value.has(key);

/**
 * 菜单父路径映射
 * @description 构建“节点键 -> 父节点键”索引，加速激活链判断。
 */
const parentPathMap = computed(() => {
  const map = new Map<string, string | null>();

  /**
   * 深度遍历菜单树并建立“节点 -> 父节点”映射。
   *
   * @param items 当前层菜单集合。
   * @param parent 父级菜单键。
   */
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
/**
 * 激活项父链集合
 * @description 从当前激活键向上回溯得到所有父级菜单键。
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
 * 判断菜单项是否为当前激活项。
 *
 * @param item 菜单项。
 * @returns 是否激活。
 */
const isActive = (item: MenuItem) => isMenuActive(item, activeKey.value);

/**
 * 判断菜单项是否包含激活链上的子节点。
 *
 * @param item 菜单项。
 * @returns 是否包含激活子节点。
 */
const hasActiveChildItem = (item: MenuItem) =>
  activeParentSet.value.has(getMenuId(item));

/**
 * 处理侧边栏菜单点击事件。
 *
 * @param item 被点击菜单项。
 */
const onMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    if (collapsed.value && !expandOnHovering.value) {
      /** 折叠状态下含子菜单项点击由悬停弹层处理。 */
      return;
    }
    toggleExpand(getMenuId(item));
  } else {
    handleSelect(getMenuId(item));
    hidePopupMenu();
  }
};

/**
 * 弹层菜单项索引映射
 * @description 将弹层子树拍平为 `key -> menu` 映射，便于事件回溯。
 */
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

/**
 * 处理弹出菜单点击事件。
 *
 * @param item 被点击菜单项。
 */
const onPopupMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    togglePopupExpand(getMenuId(item));
  } else {
    handleSelect(getMenuId(item));
    hidePopupMenu();
  }
};

/**
 * 处理弹出菜单项点击并按 data-key 回溯目标菜单项。
 *
 * @param e 鼠标事件。
 */
const handlePopupItemClick = (e: MouseEvent) => {
  const key = (e.currentTarget as HTMLElement | null)?.dataset?.key;
  if (!key) return;
  const item = popupMenuItemMap.value.get(key);
  if (item) {
    onPopupMenuClick(item);
  }
};

/**
 * 刷新侧边栏容器矩形信息，用于弹出菜单定位。
 */
const updateSidebarRect = () => {
  const sidebar = document.querySelector('.layout-sidebar') as HTMLElement | null;
  if (sidebar) {
    sidebarRect.value = sidebar.getBoundingClientRect();
  }
};

/**
 * 显示折叠态弹出菜单并同步默认展开链。
 *
 * @param item 根菜单项。
 * @param event 鼠标事件。
 */
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
  
  /** 自动展开激活链上的子菜单。 */
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

/**
 * 延迟隐藏弹出菜单，支持鼠标在菜单与弹层之间移动。
 */
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

/**
 * 取消弹出菜单的延迟隐藏任务。
 */
const cancelHidePopup = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
};

/**
 * 生成菜单项样式类名。
 *
 * @param item 菜单项。
 * @param level 菜单层级。
 * @returns 类名字符串。
 */
const getItemClass = (item: MenuItem, level: number) => {
  return getMenuItemClassName(item, {
    level,
    isActive: isActive(item),
    isExpanded: isExpanded(getMenuId(item)),
    hasActiveChild: hasActiveChildItem(item),
  });
};

/**
 * 生成弹出菜单项样式类名。
 *
 * @param item 菜单项。
 * @param level 菜单层级。
 * @returns 类名字符串。
 */
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
    /**
     * 同步侧边栏滚动容器滚动位置。
     */
    const syncScroll = () => {
      const nextTop = scrollContainer?.scrollTop ?? 0;
      if (scrollTop.value !== nextTop) {
        scrollTop.value = nextTop;
      }
    };

    /**
     * 同步侧边栏滚动容器可视高度。
     */
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

  /**
   * 通过动画帧节流刷新侧边栏矩形信息。
   */
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

/**
 * 组件卸载时清理定时器、动画帧与观察器资源。
 */
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
      /**
       * 统一弹出菜单滚轮滚动行为，避免外层页面滚动穿透。
       *
       * @param e 滚轮事件。
       */
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
