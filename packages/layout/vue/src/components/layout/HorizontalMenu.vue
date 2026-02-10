<script setup lang="ts">
/**
 * 水平菜单组件
 * @description 封装 Menu 组件，用于顶栏水平导航
 */
import { computed } from 'vue';
import { Menu } from '../menu';
import { useLayoutContext } from '../../composables';
import { getCachedMenuPathIndex, normalizeMenuKey, resolveMenuByPathIndex, type MenuItem } from '@admin-core/layout';

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

const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
  activeKey: '',
  align: 'start',
  theme: 'light',
});

const emit = defineEmits<{
  select: [item: MenuItem, key: string];
}>();

const context = useLayoutContext();
const EMPTY_MENUS: MenuItem[] = [];
const menuSource = computed(() => (props.menus.length > 0 ? props.menus : EMPTY_MENUS));

const menuIndex = computed(() => getCachedMenuPathIndex(menuSource.value));

// 处理菜单选择
const handleSelect = (path: string, _parentPaths: string[]) => {
  const key = normalizeMenuKey(path);
  const item = resolveMenuByPathIndex(menuIndex.value, key);
  if (item) {
    emit('select', item, path);
    context.events?.onMenuSelect?.(item, path);
    
    // 路由导航
    if (context.props.router && item.path) {
      context.props.router.navigate(item.path, {
        params: item.params,
        query: item.query,
      });
    }
  }
};

// 容器类名
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
