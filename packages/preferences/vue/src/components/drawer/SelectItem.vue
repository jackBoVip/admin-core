<script setup lang="ts">
/**
 * 选择设置项组件 - 自定义下拉菜单版本
 * @description 完全自定义样式，解决原生 select 无法自定义下拉菜单的问题
 */
import { ref, computed, onUnmounted, watch, nextTick } from 'vue';
import { getIcon } from '@admin-core/preferences';

const props = defineProps<{
  /** 标签文本 */
  label: string;
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
  /** 是否禁用 */
  disabled?: boolean;
}>();

const value = defineModel<string | number>();

// 获取下拉箭头图标
const chevronDownIcon = getIcon('chevronDown');

// 生成唯一 ID（在 setup 中生成一次，保持稳定）
const instanceId = Math.random().toString(36).slice(2, 9);
const selectId = `select-${instanceId}`;
const listboxId = `listbox-${instanceId}`;

// 状态
const isOpen = ref(false);
const focusedIndex = ref(-1);
const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

const optionsMap = computed(() => {
  const map = new Map<string | number, string>();
  props.options.forEach((opt) => map.set(opt.value, opt.label));
  return map;
});

const optionsValueMap = computed(() => {
  const map = new Map<string, string | number>();
  props.options.forEach((opt) => map.set(String(opt.value), opt.value));
  return map;
});

const optionsIndexMap = computed(() => {
  const map = new Map<string | number, number>();
  props.options.forEach((opt, index) => map.set(opt.value, index));
  return map;
});

// 当前选中的选项标签
const selectedLabel = computed(() => {
  const currentValue = value.value;
  if (currentValue === undefined) return '';
  return optionsMap.value.get(currentValue) || '';
});
const itemHeight = ref(32);
const listResizeObserver = ref<ResizeObserver | null>(null);
const OPTION_MAX_HEIGHT = 240;
const OPTION_OVERSCAN = 4;
const totalHeight = computed(() => props.options.length * itemHeight.value);
const viewportHeight = computed(() => Math.min(totalHeight.value, OPTION_MAX_HEIGHT));
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - OPTION_OVERSCAN)
);
const endIndex = computed(() =>
  Math.min(
    props.options.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + OPTION_OVERSCAN
  )
);
const visibleOptions = computed(() =>
  props.options.slice(startIndex.value, endIndex.value)
);

// 切换下拉菜单
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

// 选择选项
const handleSelect = (optValue: string | number) => {
  value.value = optValue;
  isOpen.value = false;
  nextTick(() => triggerRef.value?.focus());
};

const handleOptionClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const key = target.dataset.value;
  if (!key || !optionsValueMap.value.has(key)) return;
  handleSelect(optionsValueMap.value.get(key) as string | number);
};

// 键盘导航（带边界检查）
const handleKeyDown = (e: KeyboardEvent) => {
  if (props.disabled || props.options.length === 0) return;

  const maxIndex = props.options.length - 1;

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (isOpen.value && focusedIndex.value >= 0 && focusedIndex.value <= maxIndex) {
        handleSelect(props.options[focusedIndex.value].value);
      } else {
        isOpen.value = true;
        const currentValue = value.value;
        const idx = currentValue === undefined ? undefined : optionsIndexMap.value.get(currentValue);
        focusedIndex.value = idx !== undefined ? idx : 0;
      }
      break;
    case 'Escape':
      isOpen.value = false;
      triggerRef.value?.focus();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
        const currentValue = value.value;
        const idx = currentValue === undefined ? undefined : optionsIndexMap.value.get(currentValue);
        focusedIndex.value = idx !== undefined ? idx : 0;
      } else {
        focusedIndex.value = Math.min(focusedIndex.value + 1, maxIndex);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (isOpen.value) {
        focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
      }
      break;
    case 'Home':
      e.preventDefault();
      focusedIndex.value = 0;
      break;
    case 'End':
      e.preventDefault();
      focusedIndex.value = maxIndex;
      break;
  }
};

// 点击外部关闭
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) return;
  e.preventDefault();
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  target.scrollTop += e.deltaY;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

const ensureIndexVisible = (index: number) => {
  const list = listRef.value;
  if (!list) return;
  const top = index * itemHeight.value;
  const bottom = top + itemHeight.value;
  const viewTop = list.scrollTop;
  const viewBottom = viewTop + viewportHeight.value;
  if (top < viewTop) {
    list.scrollTop = top;
  } else if (bottom > viewBottom) {
    list.scrollTop = bottom - viewportHeight.value;
  }
  const nextTop = list.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

// 监听打开状态（SSR 安全）
watch(isOpen, (newVal) => {
  // SSR 环境检查
  if (typeof document === 'undefined') return;
  
  if (newVal) {
    document.addEventListener('mousedown', handleClickOutside);
    const currentValue = value.value;
    const currentIndex =
      currentValue === undefined ? -1 : (optionsIndexMap.value.get(currentValue) ?? -1);
    // 边界检查：确保 focusedIndex 在有效范围内
    focusedIndex.value = currentIndex >= 0 ? currentIndex : (props.options.length > 0 ? 0 : -1);
    nextTick(() => {
      if (focusedIndex.value >= 0) {
        ensureIndexVisible(focusedIndex.value);
      } else if (listRef.value) {
        listRef.value.scrollTop = 0;
        if (scrollTop.value !== 0) {
          scrollTop.value = 0;
        }
      }
    });
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
    if (scrollTop.value !== 0) {
      scrollTop.value = 0;
    }
  }
});

watch([isOpen, focusedIndex], ([open, index]) => {
  if (!open || index < 0) return;
  ensureIndexVisible(index);
});

watch([isOpen, () => props.options.length], ([open]) => {
  if (!open) return;
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const firstItem = list.querySelector('.custom-select-option') as HTMLElement | null;
    if (!firstItem) return;
    const height = firstItem.getBoundingClientRect().height;
    if (height > 0 && height !== itemHeight.value) {
      itemHeight.value = height;
    }
    if (typeof ResizeObserver !== 'undefined') {
      listResizeObserver.value?.disconnect();
      listResizeObserver.value = new ResizeObserver(() => {
        const currentItem = list.querySelector('.custom-select-option') as HTMLElement | null;
        if (!currentItem) return;
        const nextHeight = currentItem.getBoundingClientRect().height;
        if (nextHeight > 0 && nextHeight !== itemHeight.value) {
          itemHeight.value = nextHeight;
        }
      });
      listResizeObserver.value.observe(firstItem);
    }
  });
});

watch(isOpen, (open) => {
  if (open) return;
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

watch(
  [isOpen, totalHeight, viewportHeight, scrollTop],
  ([open, total, viewHeight, currentTop]) => {
    if (!open) return;
    const maxScrollTop = Math.max(0, total - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (listRef.value) {
      listRef.value.scrollTop = nextTop;
    }
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
);
// 清理（SSR 安全）
onUnmounted(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('mousedown', handleClickOutside);
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});
</script>

<template>
  <div class="select-item" :class="{ disabled }" :data-disabled="disabled ? 'true' : undefined">
    <label :id="selectId" class="select-item-label">{{ label }}</label>
    <div ref="containerRef" class="select-item-control">
      <button
        ref="triggerRef"
        type="button"
        class="custom-select-trigger data-open:ring-1 data-open:ring-ring/30 data-open:border-primary data-open:shadow-md data-disabled:opacity-50"
        :class="{ open: isOpen }"
        :disabled="disabled"
        :data-state="isOpen ? 'open' : 'closed'"
        :data-disabled="disabled ? 'true' : undefined"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-labelledby="selectId"
        :aria-controls="listboxId"
        @click="toggleDropdown"
        @keydown="handleKeyDown"
      >
        <span class="custom-select-value">{{ selectedLabel }}</span>
        <span class="custom-select-arrow aria-expanded:rotate-180 transition-transform" v-html="chevronDownIcon" />
      </button>

      <ul
        v-if="isOpen"
        :id="listboxId"
        class="custom-select-dropdown"
        role="listbox"
        :aria-labelledby="selectId"
        tabindex="-1"
        ref="listRef"
        :style="{ height: `${viewportHeight}px` }"
        @scroll="handleScroll"
        @wheel="handleWheel"
      >
        <li
          role="presentation"
          :style="{ height: `${totalHeight}px`, padding: 0, margin: 0, listStyle: 'none' }"
        />
        <li
          v-for="(opt, index) in visibleOptions"
          :key="opt.value"
          class="custom-select-option"
          :class="{ selected: opt.value === value, focused: (startIndex + index) === focusedIndex }"
          role="option"
          :aria-selected="opt.value === value"
          :data-selected="opt.value === value ? 'true' : undefined"
          :data-focused="(startIndex + index) === focusedIndex ? 'true' : undefined"
          :data-value="String(opt.value)"
          :style="{
            position: 'absolute',
            top: `${(startIndex + index) * itemHeight}px`,
            height: `${itemHeight}px`,
            left: 0,
            right: 0,
          }"
          @click="handleOptionClick"
          @mouseenter="focusedIndex = (startIndex + index)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </div>
  </div>
</template>
