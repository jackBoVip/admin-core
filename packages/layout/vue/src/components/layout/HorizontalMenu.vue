<script setup lang="ts">
/**
 * 水平菜单组件
 * @description 封装 Menu 组件，用于顶栏水平导航
 */
import { computed } from 'vue';
import { Menu } from '../menu';
import { useLayoutContext } from '../../composables';
import { getCachedMenuPathIndex, normalizeMenuKey, resolveMenuByPathIndex, type MenuItem } from '@admin-core/layout';

/**
 * 水平菜单组件属性。
 */
interface Props {
  /** 菜单数据 */
  menus?: MenuItem[];
  /** 当前激活的菜单 key */
  activeKey?: string;
  /** 菜单对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 主题 */
  theme?: 'light' | 'dark';
}

/**
 * 组件属性
 * @description 定义水平菜单的数据源、激活键、对齐方式与主题。
 */
const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  activeKey: '',
  align: 'start',
  theme: 'light',
});

/**
 * 组件事件
 * @description 菜单选择时向外派发选中菜单项与键值。
 */
const emit = defineEmits<{
  select: [item: MenuItem, key: string];
}>();

/**
 * 布局上下文
 * @description 提供菜单选择事件桥接与路由导航能力。
 */
const context = useLayoutContext();
/**
 * 空菜单常量
 * @description 避免在无菜单场景下重复创建空数组实例。
 */
const EMPTY_MENUS: MenuItem[] = [];
/**
 * 菜单源数据
 * @description 统一收敛为稳定数组引用，供索引构建复用。
 */
const menuSource = computed(() => (props.menus.length > 0 ? props.menus : EMPTY_MENUS));

/**
 * 菜单路径索引
 * @description 预构建路径到菜单项的映射，用于选择回查。
 */
const menuIndex = computed(() => getCachedMenuPathIndex(menuSource.value));

/**
 * 处理顶部菜单选择，派发组件事件并触发内置路由跳转。
 *
 * @param path 选中菜单路径。
 * @param _parentPaths 父级路径（当前组件未使用）。
 */
const handleSelect = (path: string, _parentPaths: string[]) => {
  const key = normalizeMenuKey(path);
  const item = resolveMenuByPathIndex(menuIndex.value, key);
  if (item) {
    emit('select', item, path);
    context.events?.onMenuSelect?.(item, path);
    
    /** 命中可导航菜单时触发路由跳转。 */
    if (context.props.router && item.path) {
      context.props.router.navigate(item.path, {
        params: item.params,
        query: item.query,
      });
    }
  }
};

/**
 * 容器类名集合
 * @description 根据对齐方式输出对应修饰类。
 */
const containerClass = computed(() => [
  'header-menu-container',
  `header-menu-container--align-${props.align}`,
]);
</script>

<template>
  <div :class="containerClass" :data-align="props.align">
    <Menu
      :menus="menus"
      :default-active="activeKey"
      :theme="theme"
      mode="horizontal"
      :rounded="true"
      :more-label="context.t('layout.common.more')"
      @select="handleSelect"
    />
  </div>
</template>

<style>
/* 容器样式 */
.header-menu-container {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

:is(.header-menu-container--align-start, .header-menu-container[data-align="start"]) {
  justify-content: flex-start;
}

:is(.header-menu-container--align-center, .header-menu-container[data-align="center"]) {
  justify-content: center;
}

:is(.header-menu-container--align-end, .header-menu-container[data-align="end"]) {
  justify-content: flex-end;
}
</style>
