<script setup lang="ts">
/**
 * 子菜单组件
 * @description 支持弹出层模式（水平/折叠）和折叠模式（垂直展开）
 */
import { computed, ref, onUnmounted, getCurrentInstance } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';
import { useMenuContext, useSubMenuContext, createSubMenuContext } from './use-menu-context';
import MenuItemComp from './MenuItem.vue';
import type { MenuItem } from '@admin-core/layout';

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

// 路径
const path = computed(() => props.item.key || props.item.path || '');

// 父级路径（遍历父级子菜单上下文获取完整路径链）
const parentPaths = computed(() => {
  const paths: string[] = [];
  let parent = parentSubMenu;
  while (parent) {
    paths.unshift(parent.path);
    parent = parent.parent;
  }
  return paths;
});

// 是否展开
const opened = computed(() => menuContext.openedMenus.value.includes(path.value));

// 是否激活（有子菜单激活）
const active = computed(() => {
  const checkActive = (items: MenuItem[]): boolean => {
    for (const item of items) {
      if (item.key === menuContext.activePath.value || item.path === menuContext.activePath.value) {
        return true;
      }
      if (item.children?.length && checkActive(item.children)) {
        return true;
      }
    }
    return false;
  };
  return props.item.children ? checkActive(props.item.children) : false;
});

// 是否为一级菜单
const isFirstLevel = computed(() => props.level === 0);

// 是否为弹出模式
const isPopup = computed(() => menuContext.isMenuPopup);

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
  {
    'menu__sub-menu-content--active': active.value,
  },
]);
</script>

<template>
  <li :class="subMenuClass">
    <!-- 弹出模式 -->
    <template v-if="isPopup">
      <!-- 触发器 -->
      <div
        ref="referenceRef"
        :class="contentClass"
        @mouseenter="handleMouseenter"
        @mouseleave="() => handleMouseleave()"
        @click="handleClick"
      >
        <!-- 更多按钮图标 -->
        <template v-if="isMore">
          <span class="menu__icon menu__more-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </span>
        </template>
        
        <!-- 普通子菜单 -->
        <template v-else>
          <span v-if="item.icon" class="menu__icon">
            <slot name="icon" :icon="item.icon">{{ item.icon }}</slot>
          </span>
          <span class="menu__name">{{ item.name }}</span>
          <span class="menu__arrow" :style="arrowStyle">
            <svg v-if="arrowIcon === 'down'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
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
            ]"
            :style="floatingStyles"
            @mouseenter="handlePopupMouseenter"
            @mouseleave="handlePopupMouseleave"
          >
            <ul class="menu__popup-list" :class="{ 'menu--rounded': menuContext.props.rounded }">
              <template v-for="child in item.children" :key="child.key">
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
        :class="contentClass"
        @click="handleClick"
      >
        <span v-if="item.icon" class="menu__icon">
          <slot name="icon" :icon="item.icon">{{ item.icon }}</slot>
        </span>
        <span class="menu__name">{{ item.name }}</span>
        <span class="menu__arrow" :style="arrowStyle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
      
      <!-- 子菜单列表 -->
      <Transition name="menu-collapse">
        <ul v-show="opened" class="menu__sub-list">
          <template v-for="child in item.children" :key="child.key">
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
  transition: opacity 150ms ease, transform 150ms ease;
}

.menu-popup-enter-from,
.menu-popup-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 子级弹出层从左侧滑入 */
.menu__popup--level-1.menu-popup-enter-from,
.menu__popup--level-1.menu-popup-leave-to,
.menu__popup--level-2.menu-popup-enter-from,
.menu__popup--level-2.menu-popup-leave-to {
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
