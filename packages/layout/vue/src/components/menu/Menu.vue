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

/**
 * 菜单组件属性。
 */
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

/**
 * 菜单组件入参
 * @description 定义菜单数据、模式、折叠态与默认激活展开配置。
 */
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

/**
 * 菜单组件事件
 * @description 对外抛出选择、展开与收起事件。
 */
const emit = defineEmits<{
  select: [path: string, parentPaths: string[]];
  open: [path: string, parentPaths: string[]];
  close: [path: string, parentPaths: string[]];
}>();

/**
 * 当前激活菜单路径
 * @description 保存当前选中菜单键路径。
 */
const activePath = ref(normalizeMenuKey(props.defaultActive));
/**
 * 当前展开菜单键集合（数组）
 * @description 保存所有展开菜单键，便于顺序化输出。
 */
const openedMenus = ref<string[]>(
  props.defaultOpeneds && !props.collapse
    ? props.defaultOpeneds.map((key) => normalizeMenuKey(key)).filter(Boolean)
    : []
);
/**
 * 展开菜单键集合（Set）
 * @description 为高频 `has` 判断提供 O(1) 查询能力。
 */
const openedMenuSet = computed(() => new Set(openedMenus.value));
/**
 * 菜单父路径映射
 * @description 建立菜单节点到父节点的路径索引。
 */
const parentPathMap = computed(() => buildMenuParentPathMap(props.menus));
/**
 * 激活父链集合
 * @description 根据当前激活路径回溯得到激活链父节点集合。
 */
const activeParentSet = computed(() => buildActiveParentSet(activePath.value, parentPathMap.value));

/**
 * 监听 `defaultActive` 变化并同步内部激活路径。
 */
watch(() => props.defaultActive, (val) => {
  const nextActive = normalizeMenuKey(val);
  if (activePath.value !== nextActive) {
    activePath.value = nextActive;
  }
});

/**
 * 监听折叠状态变化，折叠时自动收起菜单。
 */
watch(() => props.collapse, (val) => {
  openedMenus.value = computeOpenedMenusOnCollapseChange(openedMenus.value, val);
});

/**
 * 是否处于弹出菜单模式
 * @description 垂直折叠菜单场景下启用弹层交互模式。
 */
const isMenuPopup = computed(() => computeIsMenuPopup(props.mode, props.collapse));

/**
 * 打开指定菜单，并根据手风琴模式维护展开集合。
 *
 * @param path 目标菜单路径。
 * @param parentPaths 父级路径链。
 */
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

/**
 * 关闭指定菜单。
 *
 * @param path 目标菜单路径。
 * @param parentPaths 父级路径链。
 */
const closeMenu = (path: string, parentPaths: string[] = []) => {
  const target = normalizeMenuKey(path);
  if (!target) return;
  const next = computeOpenedMenusOnClose(openedMenus.value, target);
  if (next === openedMenus.value) return;
  openedMenus.value = next;
  emit('close', target, parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean));
};

/**
 * 关闭全部已展开菜单。
 */
const closeAllMenus = () => {
  if (openedMenus.value.length > 0) {
    openedMenus.value = [];
  }
};

/**
 * 处理菜单项点击，更新激活项并在弹出模式下收起展开菜单。
 *
 * @param data 菜单点击上下文。
 */
const handleMenuItemClick = (data: MenuItemClicked) => {
  const path = normalizeMenuKey(data.path);
  const parentPaths = data.parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
  if (!path) return;
  
  /**
   * 弹出模式下点击菜单项时关闭全部展开菜单。
   */
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

/**
 * 创建菜单上下文，向后代节点注入菜单状态与交互能力。
 */
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

/**
 * 菜单根节点引用
 * @description 用于横向溢出测量与纵向虚拟滚动绑定。
 */
const menuRef = ref<HTMLElement | null>(null);
/**
 * 横向菜单溢出切分索引
 * @description `-1` 表示无需“更多”菜单。
 */
const sliceIndex = ref(-1);
/**
 * 横向溢出测量动画帧句柄
 * @description 用于合并同帧重复测量请求。
 */
const resizeRaf = ref<number | null>(null);
/**
 * 菜单分批渲染批次大小
 * @description 控制纵向非虚拟模式下的渐进渲染数量。
 */
const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
/**
 * 当前渲染菜单数量
 * @description 用于纵向菜单渐进渲染。
 */
const renderCount = ref<number>(RENDER_CHUNK);
/**
 * 纵向菜单滚动容器引用
 * @description 指向最近的滚动容器节点。
 */
const scrollContainer = ref<HTMLElement | null>(null);
/**
 * 纵向菜单滚动位置
 * @description 驱动虚拟列表范围计算。
 */
const scrollTop = ref(0);
/**
 * 纵向菜单视口高度
 * @description 由滚动容器测量同步。
 */
const viewportHeight = ref(0);
/**
 * 菜单项高度
 * @description 虚拟列表与 padding 占位计算的项高基准。
 */
const itemHeight = ref(40);
/**
 * 虚拟列表 overscan
 * @description 在可视区上下额外渲染项数量。
 */
const VIRTUAL_OVERSCAN = LAYOUT_UI_TOKENS.VIRTUAL_OVERSCAN;
/**
 * 滚动容器尺寸观察器
 * @description 监听容器尺寸变化刷新虚拟参数。
 */
const scrollResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 菜单项尺寸观察器
 * @description 监听菜单项高度变化刷新项高。
 */
const itemResizeObserver = ref<ResizeObserver | null>(null);

/**
 * 基础可见菜单集合
 * @description 按模式与溢出切分索引计算基础可见菜单。
 */
const baseVisibleMenus = computed(() => {
  return computeBaseVisibleMenus({
    menus: props.menus,
    mode: props.mode,
    sliceIndex: sliceIndex.value,
    renderCount: renderCount.value,
  });
});

/**
 * 是否启用虚拟列表
 * @description 在垂直折叠场景且满足尺寸条件时启用。
 */
const canVirtualize = computed(() =>
  shouldVirtualize({
    enabled: props.mode === 'vertical' && props.collapse,
    viewportHeight: viewportHeight.value,
    itemHeight: itemHeight.value,
    totalItems: props.menus.length,
  })
);
/**
 * 虚拟渲染区间
 * @description 根据滚动位置计算当前起止索引。
 */
const virtualRange = computed(() =>
  calculateVirtualRange({
    scrollTop: scrollTop.value,
    viewportHeight: viewportHeight.value,
    itemHeight: itemHeight.value,
    totalItems: props.menus.length,
    overscan: VIRTUAL_OVERSCAN,
  })
);
/**
 * 虚拟区间菜单切片
 * @description 返回当前应渲染的菜单子集。
 */
const virtualMenus = computed(() =>
  props.menus.slice(virtualRange.value.startIndex, virtualRange.value.endIndex)
);
/**
 * 最终渲染菜单集合
 * @description 根据虚拟化开关选择虚拟或基础集合。
 */
const renderMenus = computed(() => (canVirtualize.value ? virtualMenus.value : baseVisibleMenus.value));
/**
 * 菜单列表样式
 * @description 虚拟化时注入上下 padding 占位。
 */
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

/**
 * 横向溢出菜单集合
 * @description 计算需要折叠到“更多”菜单中的项。
 */
const overflowMenus = computed(() =>
  computeOverflowMenus({
    menus: props.menus,
    mode: props.mode,
    sliceIndex: sliceIndex.value,
  })
);

/**
 * 是否存在横向溢出项
 * @description 用于控制“更多”菜单是否显示。
 */
const hasOverflow = computed(() => overflowMenus.value.length > 0);

/**
 * 计算菜单项占位宽度（含左右外边距）。
 *
 * @param item 菜单项元素。
 * @returns 占位宽度。
 */
const calcMenuItemWidth = (item: HTMLElement): number => {
  const style = getComputedStyle(item);
  const marginLeft = parseFloat(style.marginLeft) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  return item.offsetWidth + marginLeft + marginRight;
};

/**
 * 获取菜单稳定键值。
 *
 * @param item 菜单项。
 * @returns 稳定键值。
 */
const getMenuKey = (item: MenuItem) => {
  const raw = item.key ?? item.path ?? item.name ?? '';
  return raw === '' ? '' : String(raw);
};

/**
 * 菜单项宽度缓存
 * @description 避免重复读取 DOM 宽度导致抖动。
 */
const menuWidthCache = new Map<string, number>();

/**
 * 计算横向菜单溢出分割索引。
 *
 * @returns 无需溢出时返回 `-1`，否则返回分割索引。
 */
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

  /**
   * 更新已渲染菜单项宽度缓存。
   */
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

  /**
   * 全量可显示时不需要“更多”溢出菜单。
   */
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

/**
 * 处理菜单容器尺寸变化并更新横向溢出状态。
 */
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

/**
 * 横向菜单尺寸观察器
 * @description 监听菜单容器宽度变化并刷新切片索引。
 */
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

/**
 * 监听菜单模式变化并按模式启停横向溢出观测。
 */
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
  /**
   * 同步菜单项高度，用于虚拟列表区间计算。
   */
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

/**
 * 监听菜单数据变化并在横向模式下重算溢出切片。
 */
watch(() => props.menus, () => {
  if (props.mode === 'horizontal') {
    nextTick(handleResize);
  }
}, { deep: true });

/**
 * 菜单根类名
 * @description 根据模式、主题、折叠与圆角配置生成。
 */
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
