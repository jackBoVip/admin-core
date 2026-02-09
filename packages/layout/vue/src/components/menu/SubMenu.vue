<script setup lang="ts">
/**
 * 子菜单组件
 * @description 支持弹出层模式（水平/折叠）和折叠模式（垂直展开）
 */
import { computed, ref, onUnmounted, getCurrentInstance, watch, watchEffect, nextTick } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';
import { useMenuContext, useSubMenuContext, createSubMenuContext } from './use-menu-context';
import MenuItemComp from './MenuItem.vue';
import LayoutIcon from '../common/LayoutIcon.vue';
import MenuIcon from '../common/MenuIcon.vue';
import { LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';

interface Props {
  /** 菜单项数据 */
  item: MenuItem;
  /** 层级 */
  level: number;
  /** 是否为更多按钮 */
  isMore?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMore: false,
});

const menuContext = useMenuContext();
const parentSubMenu = useSubMenuContext();

// 当前组件实例
const instance = getCurrentInstance();

// 状态
const mouseInChild = ref(false);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
const CHILD_RENDER_CHUNK = LAYOUT_UI_TOKENS.SUB_MENU_RENDER_CHUNK;
const renderCount = ref<number>(CHILD_RENDER_CHUNK);
const popupScrollTop = ref(0);
const popupViewportHeight = ref(0);
const popupItemHeight = ref(40);
const POPUP_OVERSCAN = LAYOUT_UI_TOKENS.POPUP_OVERSCAN;
const popupResizeObserver = ref<ResizeObserver | null>(null);
const popupItemResizeObserver = ref<ResizeObserver | null>(null);
let popupWheelCleanup: (() => void) | null = null;

const path = computed(() => {
  const raw = props.item.key ?? props.item.path ?? '';
  return raw === '' ? '' : String(raw);
});

// 父级路径（遍历父级子菜单上下文获取完整路径链）
const parentPaths = computed(() => {
  const paths: string[] = [];
  let parent = parentSubMenu;
  while (parent) {
    paths.unshift(String(parent.path));
    parent = parent.parent;
  }
  return paths;
});

// 是否展开
const opened = computed(() => (path.value ? menuContext.openedMenuSet.value.has(path.value) : false));

// 是否激活（有子菜单激活）
const active = computed(() => (path.value ? menuContext.activeParentSet.value.has(path.value) : false));

// 是否为一级菜单
const isFirstLevel = computed(() => props.level === 0);

// 是否为弹出模式
const isPopup = computed(() => menuContext.isMenuPopup);

watch(
  [() => props.item.children?.length ?? 0, isPopup, opened],
  ([total, popup]) => {
    const nextCount = popup
      ? total
      : Math.min(CHILD_RENDER_CHUNK, total);
    if (renderCount.value !== nextCount) {
      renderCount.value = nextCount;
    }
  },
  { immediate: true }
);

watchEffect((onCleanup) => {
  const total = props.item.children?.length ?? 0;
  if (isPopup.value || !opened.value || renderCount.value >= total) return;
  const frame = requestAnimationFrame(() => {
    renderCount.value = Math.min(renderCount.value + CHILD_RENDER_CHUNK, total);
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

// 创建子菜单上下文（传递父级引用以支持完整路径遍历）
createSubMenuContext({
  path: path.value,
  level: props.level,
  mouseInChild,
  handleMouseleave,
  parent: parentSubMenu,
});

// ============================================================
// Floating UI 定位
// ============================================================
const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

// 弹出位置：水平模式一级在下方，其他在右侧
const placement = computed(() => {
  if (menuContext.props.mode === 'horizontal' && isFirstLevel.value) {
    return 'bottom-start';
  }
  return 'right-start';
});

const { floatingStyles } = useFloating(referenceRef, floatingRef, {
  placement: placement.value,
  middleware: [
    offset(menuContext.props.mode === 'horizontal' && isFirstLevel.value ? 4 : 8),
    flip({ fallbackPlacements: ['left-start', 'top-start', 'bottom-start'] }),
    shift({ padding: 8 }),
  ],
  transform: computed(() => menuContext.props.mode !== 'horizontal'),
  whileElementsMounted: autoUpdate,
});

// ============================================================
// 悬停事件处理
// ============================================================
function handleMouseenter(e: MouseEvent | FocusEvent, showTimeout = 300) {
  if (e.type === 'focus') return;
  
  // 垂直非折叠模式不自动展开
  if (!menuContext.props.collapse && menuContext.props.mode === 'vertical') {
    if (parentSubMenu) {
      parentSubMenu.mouseInChild.value = true;
    }
    return;
  }
  
  if (props.item.disabled) return;
  
  if (parentSubMenu) {
    parentSubMenu.mouseInChild.value = true;
  }
  
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  // 已展开无需重复调度
  if (opened.value) {
    const parentEl = instance?.parent?.vnode.el as HTMLElement | null;
    parentEl?.dispatchEvent(new MouseEvent('mouseenter'));
    return;
  }
  
  hoverTimer = setTimeout(() => {
    menuContext.openMenu(path.value, parentPaths.value);
  }, showTimeout);
  
  // 触发父级的 mouseenter
  const parentEl = instance?.parent?.vnode.el as HTMLElement | null;
  parentEl?.dispatchEvent(new MouseEvent('mouseenter'));
}

function handleMouseleave(deepDispatch = false) {
  // 垂直非折叠模式
  if (!menuContext.props.collapse && menuContext.props.mode === 'vertical' && parentSubMenu) {
    parentSubMenu.mouseInChild.value = false;
    return;
  }
  
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  
  if (parentSubMenu) {
    parentSubMenu.mouseInChild.value = false;
  }

  if (!opened.value) {
    if (deepDispatch) {
      parentSubMenu?.handleMouseleave?.(true);
    }
    return;
  }
  
  hoverTimer = setTimeout(() => {
    if (!mouseInChild.value) {
      menuContext.closeMenu(path.value, parentPaths.value);
    }
  }, 300);
  
  if (deepDispatch) {
    parentSubMenu?.handleMouseleave?.(true);
  }
}

// 弹出层内的事件处理
function handlePopupMouseenter(e: MouseEvent | FocusEvent) {
  handleMouseenter(e, 100);
}

function handlePopupMouseleave() {
  handleMouseleave(true);
}

// 点击处理（垂直模式切换展开）
function handleClick() {
  if (props.item.disabled) return;
  
  // 垂直非折叠模式：切换展开状态
  if (menuContext.props.mode === 'vertical' && !menuContext.props.collapse) {
    if (opened.value) {
      menuContext.closeMenu(path.value, parentPaths.value);
    } else {
      menuContext.openMenu(path.value, parentPaths.value);
    }
  }
}

// 清理定时器
onUnmounted(() => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
});

// 箭头图标
const arrowIcon = computed(() => {
  // 水平模式非一级、或垂直折叠模式：右箭头
  if ((menuContext.props.mode === 'horizontal' && !isFirstLevel.value) ||
      (menuContext.props.mode === 'vertical' && menuContext.props.collapse)) {
    return 'right';
  }
  // 其他：下箭头
  return 'down';
});

// 箭头样式
const arrowStyle = computed(() => {
  if (arrowIcon.value === 'down' && opened.value) {
    return { transform: 'rotate(180deg)' };
  }
  return {};
});

// 类名
const subMenuClass = computed(() => [
  'menu__sub-menu',
  {
    'menu__sub-menu--active': active.value,
    'menu__sub-menu--opened': opened.value,
    'menu__sub-menu--disabled': props.item.disabled,
    'menu__sub-menu--more': props.isMore,
    [`menu__sub-menu--level-${props.level}`]: true,
  },
]);

const contentClass = computed(() => [
  'menu__sub-menu-content',
]);

const visibleChildren = computed(() => (props.item.children ?? []).slice(0, renderCount.value));
const popupChildren = computed(() => props.item.children ?? []);
const popupStartIndex = computed(() =>
  Math.max(0, Math.floor(popupScrollTop.value / popupItemHeight.value) - POPUP_OVERSCAN)
);
const popupEndIndex = computed(() =>
  Math.min(
    popupChildren.value.length,
    Math.ceil((popupScrollTop.value + popupViewportHeight.value) / popupItemHeight.value) + POPUP_OVERSCAN
  )
);
const popupVisibleChildren = computed(() =>
  popupChildren.value.slice(popupStartIndex.value, popupEndIndex.value)
);
const popupListStyle = computed(() => {
  if (!isPopup.value) return undefined;
  const paddingTop = popupStartIndex.value * popupItemHeight.value;
  const paddingBottom = (popupChildren.value.length - popupEndIndex.value) * popupItemHeight.value;
  return {
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
  };
});

watch(
  [isPopup, opened, popupChildren, popupItemHeight, popupViewportHeight, popupScrollTop],
  ([popup, openedValue, children, itemHeightValue, viewHeight, currentTop]) => {
    if (!popup || !openedValue) return;
    const totalHeight = children.length * itemHeightValue;
    const maxScrollTop = Math.max(0, totalHeight - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (floatingRef.value) {
      floatingRef.value.scrollTop = nextTop;
    }
    if (popupScrollTop.value !== nextTop) {
      popupScrollTop.value = nextTop;
    }
  }
);

const updatePopupMetrics = () => {
  const popupEl = floatingRef.value;
  if (!popupEl) return;
  const computedStyle = getComputedStyle(popupEl);
  const heightValue = parseFloat(computedStyle.getPropertyValue('--menu-item-height'));
  if (!Number.isNaN(heightValue) && heightValue > 0) {
    popupItemHeight.value = heightValue;
  }
  const firstItem = popupEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
  if (firstItem) {
    const measuredHeight = firstItem.getBoundingClientRect().height;
    if (measuredHeight > 0 && measuredHeight !== popupItemHeight.value) {
      popupItemHeight.value = measuredHeight;
    }
  }
  popupViewportHeight.value = popupEl.clientHeight;
};

const handlePopupScroll = (e: Event) => {
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  const nextTop = target.scrollTop;
  if (popupScrollTop.value !== nextTop) {
    popupScrollTop.value = nextTop;
  }
};

watch(opened, (value, _, onCleanup) => {
  if (!value || !isPopup.value) return;
  nextTick(() => {
    updatePopupMetrics();
    if (floatingRef.value) {
      floatingRef.value.scrollTop = 0;
    }
    if (popupScrollTop.value !== 0) {
      popupScrollTop.value = 0;
    }
    const container = floatingRef.value;
    if (!container) return;
    const handleResize = rafThrottle(() => updatePopupMetrics());
    if (typeof ResizeObserver !== 'undefined') {
      popupResizeObserver.value = new ResizeObserver(handleResize);
      popupResizeObserver.value.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }
    if (typeof ResizeObserver !== 'undefined') {
      let observedItem = container.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
      if (observedItem) {
        popupItemResizeObserver.value?.disconnect();
        popupItemResizeObserver.value = new ResizeObserver(() => {
          const currentItem = container.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
          if (!currentItem) return;
          if (currentItem !== observedItem) {
            if (observedItem) {
              popupItemResizeObserver.value?.unobserve(observedItem);
            }
            popupItemResizeObserver.value?.observe(currentItem);
            observedItem = currentItem;
          }
          const measuredHeight = currentItem.getBoundingClientRect().height;
          if (measuredHeight > 0 && measuredHeight !== popupItemHeight.value) {
            popupItemHeight.value = measuredHeight;
          }
        });
        popupItemResizeObserver.value.observe(observedItem);
      }
    }
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      container.scrollTop += e.deltaY;
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    popupWheelCleanup = () => {
      container.removeEventListener('wheel', handleWheel);
    };
    onCleanup(() => {
      if (popupWheelCleanup) {
        popupWheelCleanup();
        popupWheelCleanup = null;
      }
      const hasResizeObserver = !!popupResizeObserver.value;
      if (popupResizeObserver.value) {
        popupResizeObserver.value.disconnect();
        popupResizeObserver.value = null;
      }
      if (popupItemResizeObserver.value) {
        popupItemResizeObserver.value.disconnect();
        popupItemResizeObserver.value = null;
      }
      if (!hasResizeObserver) {
        window.removeEventListener('resize', handleResize);
      }
    });
  });
});
</script>

<template>
  <li
    :class="['data-active:text-primary data-disabled:opacity-50', subMenuClass]"
    :data-state="active ? 'active' : 'inactive'"
    :data-disabled="item.disabled ? 'true' : undefined"
    :data-opened="opened ? 'true' : undefined"
    :data-more="isMore ? 'true' : undefined"
    :data-level="level"
  >
    <!-- 弹出模式 -->
    <template v-if="isPopup">
      <!-- 触发器 -->
      <div
        ref="referenceRef"
        :class="['data-active:text-primary data-disabled:opacity-50', contentClass]"
        :data-state="active ? 'active' : 'inactive'"
        :data-disabled="item.disabled ? 'true' : undefined"
        @mouseenter="handleMouseenter"
        @mouseleave="() => handleMouseleave()"
        @click="handleClick"
      >
        <!-- 更多按钮图标 -->
        <template v-if="isMore">
          <span class="menu__icon menu__more-icon">
            <LayoutIcon name="more-horizontal" size="sm" />
          </span>
        </template>
        
        <!-- 普通子菜单 -->
        <template v-else>
          <span v-if="item.icon" class="menu__icon">
            <slot name="icon" :icon="item.icon">
              <MenuIcon :icon="item.icon" size="h-full w-full" />
            </slot>
          </span>
          <span class="menu__name">{{ item.name }}</span>
          <span class="menu__arrow" :style="arrowStyle">
            <LayoutIcon v-if="arrowIcon === 'down'" name="menu-arrow-down" size="sm" />
            <LayoutIcon v-else name="menu-arrow-right" size="sm" />
          </span>
        </template>
      </div>
      
      <!-- 弹出层 -->
      <Teleport to="body">
        <Transition name="menu-popup">
          <div
            v-if="opened"
            ref="floatingRef"
            class="menu__popup"
            :class="[
              `menu__popup--${menuContext.props.theme}`,
              `menu__popup--level-${level}`,
              menuContext.props.mode === 'horizontal' ? 'menu__popup--slow' : '',
            ]"
            :data-theme="menuContext.props.theme"
            :data-level="level"
            :style="floatingStyles"
            @mouseenter="handlePopupMouseenter"
            @mouseleave="handlePopupMouseleave"
            @scroll="handlePopupScroll"
          >
            <ul
              class="menu__popup-list"
              :class="{ 'menu--rounded': menuContext.props.rounded }"
              :data-rounded="menuContext.props.rounded ? 'true' : undefined"
              :style="popupListStyle"
            >
              <template v-for="child in popupVisibleChildren" :key="child.key">
                <SubMenu
                  v-if="child.children && child.children.length > 0"
                  :item="child"
                  :level="level + 1"
                />
                <MenuItemComp
                  v-else
                  :item="child"
                  :level="level + 1"
                />
              </template>
            </ul>
          </div>
        </Transition>
      </Teleport>
    </template>
    
    <!-- 折叠模式（垂直展开） -->
    <template v-else>
      <!-- 触发器 -->
      <div
        :class="['data-active:text-primary data-disabled:opacity-50', contentClass]"
        :data-state="active ? 'active' : 'inactive'"
        :data-disabled="item.disabled ? 'true' : undefined"
        @click="handleClick"
      >
        <span v-if="item.icon" class="menu__icon">
          <slot name="icon" :icon="item.icon">
            <MenuIcon :icon="item.icon" size="h-full w-full" />
          </slot>
        </span>
        <span class="menu__name">{{ item.name }}</span>
        <span class="menu__arrow" :style="arrowStyle">
          <LayoutIcon name="menu-arrow-down" size="sm" />
        </span>
      </div>
      
      <!-- 子菜单列表 -->
      <Transition name="menu-collapse">
        <ul v-show="opened" class="menu__sub-list">
          <template v-for="child in visibleChildren" :key="child.key">
            <SubMenu
              v-if="child.children && child.children.length > 0"
              :item="child"
              :level="level + 1"
            />
            <MenuItemComp
              v-else
              :item="child"
              :level="level + 1"
            />
          </template>
        </ul>
      </Transition>
    </template>
  </li>
</template>

<style>
/* 弹出层动画 */
.menu-popup-enter-active,
.menu-popup-leave-active {
  transition: opacity var(--admin-duration-fast, 150ms) ease, transform var(--admin-duration-fast, 150ms) ease;
}

.menu__popup--slow.menu-popup-enter-active,
.menu__popup--slow.menu-popup-leave-active {
  transition: opacity var(--admin-duration-slow, 500ms) var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
    transform var(--admin-duration-slow, 500ms) var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

.menu-popup-enter-from,
.menu-popup-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 子级弹出层从左侧滑入 */
:is(.menu__popup--level-1, .menu__popup[data-level="1"]).menu-popup-enter-from,
:is(.menu__popup--level-1, .menu__popup[data-level="1"]).menu-popup-leave-to,
:is(.menu__popup--level-2, .menu__popup[data-level="2"]).menu-popup-enter-from,
:is(.menu__popup--level-2, .menu__popup[data-level="2"]).menu-popup-leave-to {
  transform: translateX(-4px);
}

/* 折叠动画 */
.menu-collapse-enter-active,
.menu-collapse-leave-active {
  transition: max-height 300ms ease, opacity 300ms ease;
  overflow: hidden;
}

.menu-collapse-enter-from,
.menu-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.menu-collapse-enter-to,
.menu-collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
