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

// 当前选中的选项标签
const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value === value.value);
  return option?.label || '';
});

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
        const idx = props.options.findIndex((opt) => opt.value === value.value);
        focusedIndex.value = idx >= 0 ? idx : 0;
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
        const idx = props.options.findIndex((opt) => opt.value === value.value);
        focusedIndex.value = idx >= 0 ? idx : 0;
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

// 监听打开状态（SSR 安全）
watch(isOpen, (newVal) => {
  // SSR 环境检查
  if (typeof document === 'undefined') return;
  
  if (newVal) {
    document.addEventListener('mousedown', handleClickOutside);
    const currentIndex = props.options.findIndex((opt) => opt.value === value.value);
    // 边界检查：确保 focusedIndex 在有效范围内
    focusedIndex.value = currentIndex >= 0 ? currentIndex : (props.options.length > 0 ? 0 : -1);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

// 清理（SSR 安全）
onUnmounted(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
  <div class="select-item" :class="{ disabled }">
    <label :id="selectId" class="select-item-label">{{ label }}</label>
    <div ref="containerRef" class="select-item-control">
      <button
        ref="triggerRef"
        type="button"
        class="custom-select-trigger"
        :class="{ open: isOpen }"
        :disabled="disabled"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-labelledby="selectId"
        :aria-controls="listboxId"
        @click="toggleDropdown"
        @keydown="handleKeyDown"
      >
        <span class="custom-select-value">{{ selectedLabel }}</span>
        <span class="custom-select-arrow" v-html="chevronDownIcon" />
      </button>

      <ul
        v-if="isOpen"
        :id="listboxId"
        class="custom-select-dropdown"
        role="listbox"
        :aria-labelledby="selectId"
        tabindex="-1"
      >
        <li
          v-for="(opt, index) in options"
          :key="opt.value"
          class="custom-select-option"
          :class="{ selected: opt.value === value, focused: index === focusedIndex }"
          role="option"
          :aria-selected="opt.value === value"
          @click="handleSelect(opt.value)"
          @mouseenter="focusedIndex = index"
        >
          {{ opt.label }}
        </li>
      </ul>
    </div>
  </div>
</template>
