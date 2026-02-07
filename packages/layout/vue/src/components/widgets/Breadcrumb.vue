<script setup lang="ts">
/**
 * 面包屑组件
 * @description 显示在 header 左侧的导航面包屑，自动根据当前路由和菜单生成
 */

import { computed } from 'vue';
import type { BreadcrumbItem } from '@admin-core/layout';
import { useBreadcrumbState } from '../../composables/use-layout-state';
import { useLayoutContext } from '../../composables/use-layout-context';
import LayoutIcon from '../common/LayoutIcon.vue';

interface Props {
  /** 面包屑数据（如果不传则自动从菜单生成） */
  items?: BreadcrumbItem[];
  /** 是否显示图标（可选，不传则使用配置默认值） */
  showIcon?: boolean;
  /** 是否显示首页（已废弃，使用 autoBreadcrumb.showHome 配置） */
  showHome?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  itemClick: [item: BreadcrumbItem];
}>();

// 使用自动面包屑状态
const { breadcrumbs: autoBreadcrumbs, showIcon: autoShowIcon, handleClick: autoHandleClick } = useBreadcrumbState();
const context = useLayoutContext();

// 如果传入了 items，使用传入的；否则使用自动生成的
const rawBreadcrumbItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items;
  }
  return autoBreadcrumbs.value;
});

// 翻译面包屑名称（处理可能未翻译的 key）
const breadcrumbItems = computed(() => {
  return rawBreadcrumbItems.value.map(item => {
    // 如果名称看起来是翻译 key（包含 layout. 前缀），尝试翻译
    if (item.name && item.name.startsWith('layout.')) {
      return { ...item, name: context.t(item.name) };
    }
    return item;
  });
});

// 显示图标：优先使用 prop，否则使用自动配置
const showIcon = computed(() => props.showIcon ?? autoShowIcon.value);

// 点击处理
function handleClick(item: BreadcrumbItem) {
  if (!item.clickable || !item.path) return;
  emit('itemClick', item);
  autoHandleClick(item);
}

function handleItemClick(e: MouseEvent) {
  const index = Number((e.currentTarget as HTMLElement | null)?.dataset?.index);
  if (Number.isNaN(index)) return;
  const item = breadcrumbItems.value[index];
  if (item) {
    handleClick(item);
  }
}

// 判断是否可点击
function isClickable(item: BreadcrumbItem, index: number): boolean {
  return !!item.clickable && index !== breadcrumbItems.value.length - 1 && !!item.path;
}
</script>

<template>
  <nav v-if="breadcrumbItems.length > 0" class="breadcrumb flex items-center text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center gap-1">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="item.key || item.path || index"
        class="flex items-center"
      >
        <!-- 面包屑项 -->
        <button
          v-if="isClickable(item, index)"
          type="button"
          class="breadcrumb__item flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          :data-index="index"
          @click="handleItemClick"
        >
          <span v-if="showIcon && item.icon" class="breadcrumb__icon">
            <LayoutIcon v-if="item.icon === 'home'" name="home" size="sm" />
            <span v-else class="text-xs">{{ item.icon }}</span>
          </span>
          <span>{{ item.name }}</span>
        </button>
        <span
          v-else
          :class="[
            'breadcrumb__item flex items-center gap-1',
            index === breadcrumbItems.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
          ]"
        >
          <span v-if="showIcon && item.icon" class="breadcrumb__icon">
            <LayoutIcon v-if="item.icon === 'home'" name="home" size="sm" />
            <span v-else class="text-xs">{{ item.icon }}</span>
          </span>
          <span>{{ item.name }}</span>
        </span>
        
        <!-- 分隔符 -->
        <span v-if="index < breadcrumbItems.length - 1" class="breadcrumb__separator mx-1.5 text-muted-foreground">
          <LayoutIcon name="breadcrumb-separator" size="sm" />
        </span>
      </li>
    </ol>
  </nav>
</template>
