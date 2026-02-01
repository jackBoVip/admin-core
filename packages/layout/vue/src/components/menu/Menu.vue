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

// 监听 defaultActive 变化
watch(() => props.defaultActive, (val) => {
  activePath.value = val;
});

// 折叠时关闭所有菜单
watch(() => props.collapse, (val) => {
  if (val) {
    openedMenus.value = [];
  }
});

// 是否为弹出模式
const isMenuPopup = computed(() => {
  return props.mode === 'horizontal' || (props.mode === 'vertical' && props.collapse);
});

// 打开菜单
const openMenu = (path: string, parentPaths: string[] = []) => {
  if (openedMenus.value.includes(path)) return;
  
  // 手风琴模式：关闭同级其他菜单
  if (props.accordion) {
    // 找到同级菜单并关闭
    const sameLevelMenus = openedMenus.value.filter(menu => {
      // 检查是否为同级菜单
      return parentPaths.length === 0 
        ? !parentPaths.some(p => menu.startsWith(p))
        : parentPaths.every(p => !menu.startsWith(p));
    });
    openedMenus.value = openedMenus.value.filter(menu => !sameLevelMenus.includes(menu) || parentPaths.includes(menu));
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
  openedMenus.value = [];
};

// 处理菜单项点击
const handleMenuItemClick = (data: MenuItemClicked) => {
  const { path, parentPaths } = data;
  
  // 弹出模式下点击菜单项关闭所有菜单
  if (isMenuPopup.value) {
    openedMenus.value = [];
  }
  
  activePath.value = path;
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
  openedMenus,
  openMenu,
  closeMenu,
  closeAllMenus,
  handleMenuItemClick,
  get isMenuPopup() { return isMenuPopup.value; },
});

// 溢出处理（仅水平模式）
const menuRef = ref<HTMLElement | null>(null);
const sliceIndex = ref(-1);
const isResizing = ref(false);

const visibleMenus = computed(() => {
  if (props.mode !== 'horizontal' || sliceIndex.value === -1) {
    return props.menus;
  }
  return props.menus.slice(0, sliceIndex.value);
});

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

// 防抖
const debounce = (fn: () => void, wait = 33.34) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, wait);
  };
};

const handleResize = debounce(() => {
  if (isResizing.value) return;
  
  isResizing.value = true;
  sliceIndex.value = -1;
  
  nextTick(() => {
    sliceIndex.value = calcSliceIndex();
    isResizing.value = false;
  });
});

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
  <ul ref="menuRef" :class="menuClass">
    <template v-for="item in visibleMenus" :key="item.key">
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
