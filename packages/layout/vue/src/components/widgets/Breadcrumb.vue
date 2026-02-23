<script setup lang="ts">
/**
 * 面包屑组件
 * @description 显示在 header 左侧的导航面包屑，自动根据当前路由和菜单生成
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

const {
  breadcrumbs: autoBreadcrumbs,
  showIcon: autoShowIcon,
  handleClick: autoHandleClick,
  resolveChildren,
} = useBreadcrumbState();
const context = useLayoutContext();

const navRef = ref<HTMLElement | null>(null);
const openItemKey = ref<string | null>(null);

const rawBreadcrumbItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items;
  }
  return autoBreadcrumbs.value;
});

function translateLabel(label: string) {
  if (label && label.startsWith('layout.')) {
    return context.t(label);
  }
  return label;
}

const breadcrumbItems = computed(() => {
  return rawBreadcrumbItems.value.map((item) => ({
    ...item,
    name: translateLabel(item.name),
  }));
});

const showIcon = computed(() => props.showIcon ?? autoShowIcon.value);

function getItemKey(item: BreadcrumbItem, index: number): string {
  return item.key || item.path || `__breadcrumb_${index}`;
}

const breadcrumbChildItemsMap = computed(() => {
  const map = new Map<string, BreadcrumbItem[]>();
  breadcrumbItems.value.forEach((item, index) => {
    map.set(getItemKey(item, index), resolveChildren(item));
  });
  return map;
});

function getChildItems(item: BreadcrumbItem, index: number): BreadcrumbItem[] {
  const children = breadcrumbChildItemsMap.value.get(getItemKey(item, index)) ?? [];
  return children.map((child) => ({
    ...child,
    name: translateLabel(child.name),
  }));
}

function hasChildMenu(item: BreadcrumbItem, index: number): boolean {
  return getChildItems(item, index).length > 0;
}

function isDropdownOpen(item: BreadcrumbItem, index: number): boolean {
  return openItemKey.value === getItemKey(item, index);
}

function canTrigger(item: BreadcrumbItem, index: number): boolean {
  if (hasChildMenu(item, index)) {
    return true;
  }
  const isLast = index === breadcrumbItems.value.length - 1;
  return !!item.clickable && !isLast && !!item.path;
}

function handleClick(item: BreadcrumbItem) {
  if (!item.clickable || !item.path) return;
  emit('itemClick', item);
  autoHandleClick(item);
}

function handleTriggerClick(item: BreadcrumbItem, index: number) {
  if (hasChildMenu(item, index)) {
    const itemKey = getItemKey(item, index);
    openItemKey.value = openItemKey.value === itemKey ? null : itemKey;
    return;
  }
  handleClick(item);
  openItemKey.value = null;
}

function handleChildClick(child: BreadcrumbItem) {
  handleClick(child);
  openItemKey.value = null;
}

function handleOutsidePointerDown(event: Event) {
  const target = event.target as Node | null;
  if (!target || !navRef.value) {
    return;
  }
  if (!navRef.value.contains(target)) {
    openItemKey.value = null;
  }
}

watch(
  breadcrumbItems,
  (items) => {
    if (!openItemKey.value) return;
    const exists = items.some((item, index) => getItemKey(item, index) === openItemKey.value);
    if (!exists) {
      openItemKey.value = null;
    }
  },
  { deep: false }
);

onMounted(() => {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', handleOutsidePointerDown, true);
});

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
});
</script>

<template>
  <nav
    v-if="breadcrumbItems.length > 0"
    ref="navRef"
    class="breadcrumb flex items-center text-sm"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center gap-1">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="getItemKey(item, index)"
        class="flex items-center"
      >
        <div
          class="header-widget-dropdown breadcrumb__dropdown relative"
          :data-state="isDropdownOpen(item, index) ? 'open' : 'closed'"
        >
          <button
            v-if="canTrigger(item, index)"
            type="button"
            class="breadcrumb__item breadcrumb__item--trigger flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            @click="handleTriggerClick(item, index)"
          >
            <span v-if="showIcon && item.icon" class="breadcrumb__icon">
              <LayoutIcon v-if="item.icon === 'home'" name="home" size="sm" />
              <span v-else class="text-xs">{{ item.icon }}</span>
            </span>
            <span>{{ item.name }}</span>
            <span
              v-if="hasChildMenu(item, index)"
              :class="['breadcrumb__dropdown-arrow', isDropdownOpen(item, index) ? 'is-open' : '']"
            >
              <LayoutIcon name="menu-arrow-down" size="xs" />
            </span>
          </button>
          <span
            v-else
            :class="[
              'breadcrumb__item flex items-center gap-1',
              index === breadcrumbItems.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground',
            ]"
          >
            <span v-if="showIcon && item.icon" class="breadcrumb__icon">
              <LayoutIcon v-if="item.icon === 'home'" name="home" size="sm" />
              <span v-else class="text-xs">{{ item.icon }}</span>
            </span>
            <span>{{ item.name }}</span>
          </span>

          <div
            v-if="hasChildMenu(item, index) && isDropdownOpen(item, index)"
            class="header-widget-dropdown__menu breadcrumb__dropdown-menu absolute left-0 top-full mt-2"
          >
            <button
              v-for="child in getChildItems(item, index)"
              :key="child.key || child.path || child.name"
              type="button"
              class="header-widget-dropdown__item breadcrumb__dropdown-item"
              :disabled="!child.clickable || !child.path"
              :data-disabled="!child.clickable || !child.path ? 'true' : 'false'"
              @click="handleChildClick(child)"
            >
              <span v-if="showIcon && child.icon" class="breadcrumb__icon">
                <LayoutIcon v-if="child.icon === 'home'" name="home" size="sm" />
                <span v-else class="text-xs">{{ child.icon }}</span>
              </span>
              <span>{{ child.name }}</span>
            </button>
          </div>
        </div>

        <span
          v-if="index < breadcrumbItems.length - 1"
          class="breadcrumb__separator mx-1.5 text-muted-foreground"
        >
          <LayoutIcon name="breadcrumb-separator" size="sm" />
        </span>
      </li>
    </ol>
  </nav>
</template>
