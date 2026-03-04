<script setup lang="ts">
/**
 * 菜单项组件
 * @description 叶子节点菜单项
 */
import { computed } from 'vue';
import { useMenuContext, useSubMenuContext } from './use-menu-context';
import { calculateMenuItemPadding, type MenuItem } from '@admin-core/layout';
import MenuIcon from '../common/MenuIcon.vue';

/**
 * 菜单叶子项组件属性。
 */
interface Props {
  /** 菜单项数据 */
  item: MenuItem;
  /** 层级 */
  level: number;
}

/**
 * 菜单项组件入参
 * @description 提供叶子菜单项数据与层级信息。
 */
const props = defineProps<Props>();

/**
 * 菜单上下文
 * @description 提供激活路径与点击派发能力。
 */
const menuContext = useMenuContext();
/**
 * 父级子菜单上下文
 * @description 用于回溯完整父级路径链。
 */
const parentSubMenu = useSubMenuContext();

/**
 * 当前菜单项路径键
 * @description 对 key/path 做标准化字符串处理。
 */
const path = computed(() => {
  const raw = props.item.key ?? props.item.path ?? '';
  return raw === '' ? '' : String(raw);
});

/**
 * 当前菜单项是否激活
 * @description 与菜单上下文激活路径比较得出。
 */
const active = computed(() => {
  const activePath = menuContext.activePath.value === '' ? '' : String(menuContext.activePath.value);
  return path.value !== '' && path.value === activePath;
});

/**
 * 当前展示图标
 * @description 激活态优先使用 `activeIcon`，否则使用默认图标。
 */
const menuIcon = computed(() => {
  const item = props.item as MenuItem & { activeIcon?: string };
  return active.value ? (item.activeIcon || item.icon) : item.icon;
});

/**
 * 处理叶子菜单点击，并携带父级路径链派发给菜单上下文。
 */
function handleClick() {
  if (props.item.disabled) return;

  const parentPaths: string[] = [];
  let parent = parentSubMenu;
  while (parent) {
    parentPaths.unshift(String(parent.path));
    parent = parent.parent;
  }
  
  menuContext.handleMenuItemClick({
    path: path.value,
    parentPaths,
  });
}

/**
 * 菜单项类名
 * @description 按激活态、禁用态与层级生成样式类集合。
 */
const itemClass = computed(() => [
  'menu__item',
  {
    'menu__item--active': active.value,
    'menu__item--disabled': props.item.disabled,
    [`menu__item--level-${props.level}`]: true,
  },
]);

/**
 * 缩进样式
 * @description 垂直非折叠菜单下按层级计算左侧缩进。
 */
const indentStyle = computed(() => {
  if (menuContext.props.mode === 'vertical' && !menuContext.props.collapse) {
    return {
      paddingLeft: `${calculateMenuItemPadding(props.level)}px`,
    };
  }
  return {};
});
</script>

<template>
  <li
    :class="['data-active:text-primary data-disabled:opacity-50', itemClass]"
    :data-state="active ? 'active' : 'inactive'"
    :data-disabled="item.disabled ? 'true' : undefined"
    :data-level="level"
    :style="indentStyle"
    @click="handleClick"
  >
    <!-- 图标 -->
    <span v-if="menuIcon" class="menu__icon">
      <slot name="icon" :icon="menuIcon">
        <MenuIcon :icon="menuIcon" size="h-full w-full" />
      </slot>
    </span>
    
    <!-- 名称 -->
    <span class="menu__name">{{ item.name }}</span>
    
    <!-- 徽章 -->
    <span
      v-if="item.badge"
      class="menu__badge"
      :class="item.badgeType ? `menu__badge--${item.badgeType}` : ''"
      :data-badge="item.badgeType"
    >
      {{ item.badge }}
    </span>
  </li>
</template>

<style>
/* 样式在 CSS 文件中定义 */
</style>
