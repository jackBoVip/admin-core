<script setup lang="ts">
/**
 * 菜单项组件
 * @description 叶子节点菜单项
 */
import { computed } from 'vue';
import { useMenuContext, useSubMenuContext } from './use-menu-context';
import type { MenuItem } from '@admin-core/layout';

interface Props {
  /** 菜单项数据 */
  item: MenuItem;
  /** 层级 */
  level: number;
}

const props = defineProps<Props>();

const menuContext = useMenuContext();
const parentSubMenu = useSubMenuContext();

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

// 是否激活
const active = computed(() => {
  return path.value === menuContext.activePath.value;
});

// 图标（激活时使用 activeIcon）
const menuIcon = computed(() => {
  const item = props.item as MenuItem & { activeIcon?: string };
  return active.value ? (item.activeIcon || item.icon) : item.icon;
});

// 点击处理
function handleClick() {
  if (props.item.disabled) return;
  
  menuContext.handleMenuItemClick({
    path: path.value,
    parentPaths: parentPaths.value,
  });
}

// 类名
const itemClass = computed(() => [
  'menu__item',
  {
    'menu__item--active': active.value,
    'menu__item--disabled': props.item.disabled,
    [`menu__item--level-${props.level}`]: true,
  },
]);

// 缩进样式（垂直模式）
const indentStyle = computed(() => {
  if (menuContext.props.mode === 'vertical' && !menuContext.props.collapse) {
    return {
      paddingLeft: `${16 + props.level * 16}px`,
    };
  }
  return {};
});
</script>

<template>
  <li
    :class="itemClass"
    :style="indentStyle"
    @click="handleClick"
  >
    <!-- 图标 -->
    <span v-if="menuIcon" class="menu__icon">
      <slot name="icon" :icon="menuIcon">{{ menuIcon }}</slot>
    </span>
    
    <!-- 名称 -->
    <span class="menu__name">{{ item.name }}</span>
    
    <!-- 徽章 -->
    <span v-if="item.badge" class="menu__badge" :class="item.badgeType ? `menu__badge--${item.badgeType}` : ''">
      {{ item.badge }}
    </span>
  </li>
</template>

<style>
/* 样式在 CSS 文件中定义 */
</style>
