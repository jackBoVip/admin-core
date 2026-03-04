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

/**
 * 面包屑组件属性定义。
 */
interface Props {
  /** 面包屑数据（如果不传则自动从菜单生成） */
  items?: BreadcrumbItem[];
  /** 是否显示图标（可选，不传则使用配置默认值） */
  showIcon?: boolean;
  /** 是否显示首页（已废弃，使用 autoBreadcrumb.showHome 配置） */
  showHome?: boolean;
}

/**
 * 面包屑组件入参
 * @description 支持外部传入面包屑项，也支持自动从布局状态推导。
 */
const props = defineProps<Props>();

/**
 * 面包屑组件事件
 * @description 抛出面包屑项点击事件供外层监听。
 */
const emit = defineEmits<{
  itemClick: [item: BreadcrumbItem];
}>();

/**
 * 面包屑状态能力
 * @description 提供自动面包屑、图标开关、点击导航及子项解析能力。
 */
const {
  breadcrumbs: autoBreadcrumbs,
  showIcon: autoShowIcon,
  handleClick: autoHandleClick,
  resolveChildren,
} = useBreadcrumbState();
/**
 * 布局上下文
 * @description 提供翻译能力及布局级路由上下文。
 */
const context = useLayoutContext();

/**
 * 面包屑导航容器引用
 * @description 用于外部点击检测，关闭下拉菜单。
 */
const navRef = ref<HTMLElement | null>(null);
/**
 * 当前打开的下拉面包屑键
 * @description 记录哪一个面包屑项的子菜单处于展开状态。
 */
const openItemKey = ref<string | null>(null);

/**
 * 原始面包屑数据来源：优先外部传入，否则使用自动推导结果。
 */
const rawBreadcrumbItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items;
  }
  return autoBreadcrumbs.value;
});

/**
 * 翻译面包屑文案，支持 `layout.*` 键名。
 *
 * @param label 原始文案或翻译键。
 * @returns 翻译后的文案。
 */
function translateLabel(label: string) {
  if (label && label.startsWith('layout.')) {
    return context.t(label);
  }
  return label;
}

/**
 * 面包屑展示数据，统一完成文案翻译处理。
 */
const breadcrumbItems = computed(() => {
  return rawBreadcrumbItems.value.map((item) => ({
    ...item,
    name: translateLabel(item.name),
  }));
});

/**
 * 图标显示开关，组件入参与自动配置二选一。
 */
const showIcon = computed(() => props.showIcon ?? autoShowIcon.value);

/**
 * 生成面包屑项稳定键。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 稳定键字符串。
 */
function getItemKey(item: BreadcrumbItem, index: number): string {
  return item.key || item.path || `__breadcrumb_${index}`;
}

/**
 * 面包屑子菜单缓存映射。
 */
const breadcrumbChildItemsMap = computed(() => {
  const map = new Map<string, BreadcrumbItem[]>();
  breadcrumbItems.value.forEach((item, index) => {
    map.set(getItemKey(item, index), resolveChildren(item));
  });
  return map;
});

/**
 * 获取面包屑项的下拉子项并进行文案翻译。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 子项列表。
 */
function getChildItems(item: BreadcrumbItem, index: number): BreadcrumbItem[] {
  const children = breadcrumbChildItemsMap.value.get(getItemKey(item, index)) ?? [];
  return children.map((child) => ({
    ...child,
    name: translateLabel(child.name),
  }));
}

/**
 * 判断面包屑项是否存在子菜单。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 是否存在子菜单。
 */
function hasChildMenu(item: BreadcrumbItem, index: number): boolean {
  return getChildItems(item, index).length > 0;
}

/**
 * 判断指定面包屑下拉是否处于打开状态。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 是否打开。
 */
function isDropdownOpen(item: BreadcrumbItem, index: number): boolean {
  return openItemKey.value === getItemKey(item, index);
}

/**
 * 判断面包屑项是否可触发点击/下拉交互。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 是否可触发。
 */
function canTrigger(item: BreadcrumbItem, index: number): boolean {
  if (hasChildMenu(item, index)) {
    return true;
  }
  const isLast = index === breadcrumbItems.value.length - 1;
  return !!item.clickable && !isLast && !!item.path;
}

/**
 * 处理面包屑项点击并触发导航。
 *
 * @param item 面包屑项。
 */
function handleClick(item: BreadcrumbItem) {
  if (!item.clickable || !item.path) return;
  emit('itemClick', item);
  autoHandleClick(item);
}

/**
 * 处理面包屑触发按钮点击（打开下拉或直接导航）。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 */
function handleTriggerClick(item: BreadcrumbItem, index: number) {
  if (hasChildMenu(item, index)) {
    const itemKey = getItemKey(item, index);
    openItemKey.value = openItemKey.value === itemKey ? null : itemKey;
    return;
  }
  handleClick(item);
  openItemKey.value = null;
}

/**
 * 处理下拉子项点击并关闭下拉菜单。
 *
 * @param child 子菜单项。
 */
function handleChildClick(child: BreadcrumbItem) {
  handleClick(child);
  openItemKey.value = null;
}

/**
 * 处理外部指针点击，点击组件外部时关闭下拉菜单。
 *
 * @param event 指针事件。
 */
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
    /**
     * 面包屑结构变化时校验当前下拉项是否仍存在。
     */
    if (!openItemKey.value) return;
    const exists = items.some((item, index) => getItemKey(item, index) === openItemKey.value);
    if (!exists) {
      openItemKey.value = null;
    }
  },
  { deep: false }
);

onMounted(() => {
  /**
   * 注册全局指针监听，用于外部点击收起下拉菜单。
   */
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', handleOutsidePointerDown, true);
});

onBeforeUnmount(() => {
  /**
   * 组件卸载时注销全局指针监听。
   */
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
