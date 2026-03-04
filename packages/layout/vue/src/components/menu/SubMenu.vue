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

/**
 * 子菜单组件属性。
 */
interface Props {
  /** 菜单项数据 */
  item: MenuItem;
  /** 层级 */
  level: number;
  /** 是否为更多按钮 */
  isMore?: boolean;
}

/**
 * 子菜单组件入参
 * @description 提供子菜单节点、层级及“更多”占位标记。
 */
const props = withDefaults(defineProps<Props>(), {
  isMore: false,
});

/**
 * 菜单上下文
 * @description 提供展开状态、激活状态与菜单交互方法。
 */
const menuContext = useMenuContext();
/**
 * 父级子菜单上下文
 * @description 用于构建父路径链与级联悬停行为。
 */
const parentSubMenu = useSubMenuContext();

/**
 * 当前组件实例
 * @description 用于在特殊场景向父级节点派发事件。
 */
const instance = getCurrentInstance();

/**
 * 鼠标是否位于子层菜单区域
 * @description 控制悬停离开后的延迟收起逻辑。
 */
const mouseInChild = ref(false);
/**
 * 悬停展开定时器
 * @description 控制子菜单悬停延时展开。
 */
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
/**
 * 子菜单分批渲染批次大小
 * @description 控制纵向展开时子项渐进渲染节奏。
 */
const CHILD_RENDER_CHUNK = LAYOUT_UI_TOKENS.SUB_MENU_RENDER_CHUNK;
/**
 * 子菜单当前渲染数量
 * @description 用于控制展开内容的渐进渲染数量。
 */
const renderCount = ref<number>(CHILD_RENDER_CHUNK);
/**
 * 弹层滚动位置
 * @description 驱动弹层虚拟列表区间计算。
 */
const popupScrollTop = ref(0);
/**
 * 弹层视口高度
 * @description 用于计算可见项范围。
 */
const popupViewportHeight = ref(0);
/**
 * 弹层项高度
 * @description 虚拟列表滚动区间计算基准。
 */
const popupItemHeight = ref(40);
/**
 * 弹层虚拟列表 overscan
 * @description 在可视区上下额外渲染项数量。
 */
const POPUP_OVERSCAN = LAYOUT_UI_TOKENS.POPUP_OVERSCAN;
/**
 * 弹层容器尺寸观察器
 * @description 监听弹层高度变化并刷新虚拟参数。
 */
const popupResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 弹层项尺寸观察器
 * @description 监听项高变化并同步 `popupItemHeight`。
 */
const popupItemResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 弹层滚轮监听清理函数
 * @description 用于解绑自定义滚轮行为。
 */
let popupWheelCleanup: (() => void) | null = null;

/**
 * 当前子菜单路径键
 * @description 标准化 key/path 值作为菜单唯一标识。
 */
const path = computed(() => {
  const raw = props.item.key ?? props.item.path ?? '';
  return raw === '' ? '' : String(raw);
});

/**
 * 父级路径链
 * @description 从父子菜单上下文回溯得到完整父级路径。
 */
const parentPaths = computed(() => {
  const paths: string[] = [];
  let parent = parentSubMenu;
  while (parent) {
    paths.unshift(String(parent.path));
    parent = parent.parent;
  }
  return paths;
});

/**
 * 当前子菜单是否展开
 * @description 根据上下文展开集合判断。
 */
const opened = computed(() => (path.value ? menuContext.openedMenuSet.value.has(path.value) : false));

/**
 * 当前子菜单是否激活
 * @description 当子链中存在激活节点时返回 `true`。
 */
const active = computed(() => (path.value ? menuContext.activeParentSet.value.has(path.value) : false));

/**
 * 是否一级子菜单
 * @description 一级子菜单在水平模式下弹层位置为下方。
 */
const isFirstLevel = computed(() => props.level === 0);

/**
 * 是否处于弹层模式
 * @description 折叠或水平场景下使用浮层子菜单。
 */
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

/**
 * 创建子菜单上下文并向下传递父级链路。
 */
createSubMenuContext({
  path: path.value,
  level: props.level,
  mouseInChild,
  handleMouseleave,
  parent: parentSubMenu,
});

/**
 * Floating UI 定位配置区。
 */
/**
 * 浮层定位参考节点引用
 * @description 指向子菜单触发器元素。
 */
const referenceRef = ref<HTMLElement | null>(null);
/**
 * 浮层节点引用
 * @description 指向弹出层容器元素。
 */
const floatingRef = ref<HTMLElement | null>(null);

/**
 * 弹层定位方向
 * @description 水平一级菜单使用 `bottom-start`，其他场景使用 `right-start`。
 */
const placement = computed(() => {
  if (menuContext.props.mode === 'horizontal' && isFirstLevel.value) {
    return 'bottom-start';
  }
  return 'right-start';
});

/**
 * 浮层定位样式
 * @description 由 Floating UI 计算得到的实时定位样式对象。
 */
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

/**
 * 处理子菜单触发器进入事件，按模式决定是否延迟展开。
 *
 * @param e 鼠标或焦点事件。
 * @param showTimeout 展开延迟（毫秒）。
 */
function handleMouseenter(e: MouseEvent | FocusEvent, showTimeout = 300) {
  if (e.type === 'focus') return;

  /**
   * 垂直非折叠模式下由点击控制展开，不执行悬停展开。
   */
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

  /**
   * 已展开时不再重复调度展开计时器。
   */
  if (opened.value) {
    const parentEl = instance?.parent?.vnode.el as HTMLElement | null;
    parentEl?.dispatchEvent(new MouseEvent('mouseenter'));
    return;
  }
  
  hoverTimer = setTimeout(() => {
    menuContext.openMenu(path.value, parentPaths.value);
  }, showTimeout);
  
  /**
   * 向父级触发 `mouseenter`，保持上层菜单展开状态。
   */
  const parentEl = instance?.parent?.vnode.el as HTMLElement | null;
  parentEl?.dispatchEvent(new MouseEvent('mouseenter'));
}

/**
 * 处理子菜单触发器离开事件，按需延迟关闭并级联到父级。
 *
 * @param deepDispatch 是否向父级继续派发离开行为。
 */
function handleMouseleave(deepDispatch = false) {
  /**
   * 垂直非折叠模式下仅同步父级鼠标状态，不执行自动关闭。
   */
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

/**
 * 处理弹层鼠标进入事件，缩短展开延迟保持交互连贯。
 *
 * @param e 鼠标或焦点事件。
 */
function handlePopupMouseenter(e: MouseEvent | FocusEvent) {
  handleMouseenter(e, 100);
}

/**
 * 处理弹层鼠标离开事件，触发级联关闭流程。
 */
function handlePopupMouseleave() {
  handleMouseleave(true);
}

/**
 * 处理子菜单点击，在垂直非折叠模式下切换展开状态。
 */
function handleClick() {
  if (props.item.disabled) return;

  /**
   * 垂直非折叠模式下通过点击切换展开状态。
   */
  if (menuContext.props.mode === 'vertical' && !menuContext.props.collapse) {
    if (opened.value) {
      menuContext.closeMenu(path.value, parentPaths.value);
    } else {
      menuContext.openMenu(path.value, parentPaths.value);
    }
  }
}

/**
 * 组件卸载时清理悬停定时器。
 */
onUnmounted(() => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
});

/**
 * 子菜单箭头图标方向
 * @description 根据模式与层级选择右箭头或下箭头。
 */
const arrowIcon = computed(() => {
  /**
   * 水平非一级菜单或垂直折叠菜单使用右箭头。
   */
  if ((menuContext.props.mode === 'horizontal' && !isFirstLevel.value) ||
      (menuContext.props.mode === 'vertical' && menuContext.props.collapse)) {
    return 'right';
  }
  /**
   * 其他场景使用下箭头。
   */
  return 'down';
});

/**
 * 箭头图标样式
 * @description 下箭头在展开时旋转 180 度。
 */
const arrowStyle = computed(() => {
  if (arrowIcon.value === 'down' && opened.value) {
    return { transform: 'rotate(180deg)' };
  }
  return {};
});

/**
 * 子菜单根类名
 * @description 根据激活、展开、禁用、层级与“更多”状态生成。
 */
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

/**
 * 子菜单内容类名
 * @description 统一子菜单内容容器基础类。
 */
const contentClass = computed(() => [
  'menu__sub-menu-content',
]);

/**
 * 渐进渲染可见子项
 * @description 非弹层模式下按渲染数量截取子项。
 */
const visibleChildren = computed(() => (props.item.children ?? []).slice(0, renderCount.value));
/**
 * 弹层子项集合
 * @description 弹层模式下用于虚拟列表计算的数据源。
 */
const popupChildren = computed(() => props.item.children ?? []);
/**
 * 弹层虚拟起始索引
 * @description 基于滚动位置与 overscan 计算。
 */
const popupStartIndex = computed(() =>
  Math.max(0, Math.floor(popupScrollTop.value / popupItemHeight.value) - POPUP_OVERSCAN)
);
/**
 * 弹层虚拟结束索引
 * @description 基于滚动位置、视口高度与 overscan 计算。
 */
const popupEndIndex = computed(() =>
  Math.min(
    popupChildren.value.length,
    Math.ceil((popupScrollTop.value + popupViewportHeight.value) / popupItemHeight.value) + POPUP_OVERSCAN
  )
);
/**
 * 弹层可见子项切片
 * @description 返回当前应渲染的弹层子项区间。
 */
const popupVisibleChildren = computed(() =>
  popupChildren.value.slice(popupStartIndex.value, popupEndIndex.value)
);
/**
 * 弹层列表占位样式
 * @description 通过上下 padding 模拟未渲染区间占位。
 */
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

/**
 * 同步弹层滚动容器尺寸与菜单项高度，用于虚拟区间计算。
 */
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

/**
 * 同步弹层滚动位置到响应式状态。
 *
 * @param e 滚动事件对象。
 */
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
    /**
     * 处理弹层滚轮事件，接管默认行为以改善滚动体验。
     *
     * @param e 滚轮事件对象。
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
