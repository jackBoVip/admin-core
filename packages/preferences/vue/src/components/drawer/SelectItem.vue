<script setup lang="ts">
/**
 * 选择设置项组件模块（自定义下拉版本）。
 * @description 使用自绘触发器与虚拟化列表实现高可定制、可键盘导航的选择控件。
 */
import { ref, computed, onUnmounted, watch, nextTick } from 'vue';
import { getIcon } from '@admin-core/preferences';

/**
 * 选择设置项值类型。
 */
type SelectItemValue = number | string;

/**
 * 选择设置项选项结构。
 */
export interface SelectItemOption {
  /** 选项文本。 */
  label: string;
  /** 选项值。 */
  value: SelectItemValue;
}

/**
 * 选择设置项入参。
 * @description 描述标签、可选项集合与禁用状态。
 */
export interface SelectItemProps {
  /** 标签文本。 */
  label: string;
  /** 选项列表。 */
  options: SelectItemOption[];
  /** 是否禁用。 */
  disabled?: boolean;
}

const props = defineProps<SelectItemProps>();

/**
 * 当前选中值
 * @description 与外层 `v-model` 同步的选项值。
 */
const value = defineModel<SelectItemValue>();

/**
 * 下拉箭头图标
 * @description 展示在触发按钮右侧，提示可展开。
 */
const chevronDownIcon = getIcon('chevronDown');

/**
 * 当前实例随机标识
 * @description 用于拼装 `trigger/listbox` 的唯一 DOM ID。
 */
const instanceId = Math.random().toString(36).slice(2, 9);
/**
 * 触发器标签 ID
 * @description 作为列表框的 `aria-labelledby` 引用目标。
 */
const selectId = `select-${instanceId}`;
/**
 * 下拉列表框 ID
 * @description 用于触发器 `aria-controls` 与列表 `id` 关联。
 */
const listboxId = `listbox-${instanceId}`;

/**
 * 下拉框展开状态
 * @description 控制选项列表显示与隐藏。
 */
const isOpen = ref(false);
/**
 * 当前键盘聚焦索引
 * @description 记录键盘导航时高亮的选项位置。
 */
const focusedIndex = ref(-1);
/**
 * 组件容器引用
 * @description 用于判断外部点击并触发关闭。
 */
const containerRef = ref<HTMLElement | null>(null);
/**
 * 触发按钮引用
 * @description 关闭列表后恢复焦点，保持键盘可达性。
 */
const triggerRef = ref<HTMLElement | null>(null);
/**
 * 列表容器引用
 * @description 用于滚动同步、可见区计算与高度观测。
 */
const listRef = ref<HTMLElement | null>(null);
/**
 * 列表滚动位置
 * @description 为虚拟渲染计算可见区起止索引提供输入。
 */
const scrollTop = ref(0);

/**
 * 选项值到标签映射
 * @description 便于根据当前值快速获取展示文本。
 */
const optionsMap = computed(() => {
  const map = new Map<SelectItemValue, string>();
  props.options.forEach((opt) => map.set(opt.value, opt.label));
  return map;
});

/**
 * 字符串键到真实值映射
 * @description 处理 DOM `data-value`（字符串）到业务值的反查。
 */
const optionsValueMap = computed(() => {
  const map = new Map<string, SelectItemValue>();
  props.options.forEach((opt) => map.set(String(opt.value), opt.value));
  return map;
});

/**
 * 选项值到索引映射
 * @description 支持键盘导航时快速定位当前值对应索引。
 */
const optionsIndexMap = computed(() => {
  const map = new Map<SelectItemValue, number>();
  props.options.forEach((opt, index) => map.set(opt.value, index));
  return map;
});

/**
 * 当前选中项标签
 * @description 将当前值映射为可展示文案，未选中时返回空字符串。
 */
const selectedLabel = computed(() => {
  const currentValue = value.value;
  if (currentValue === undefined) return '';
  return optionsMap.value.get(currentValue) || '';
});
/**
 * 选项项高
 * @description 默认 32px，可在首次渲染后通过观测器动态校准。
 */
const itemHeight = ref(32);
/**
 * 列表高度观测器
 * @description 监听选项项高变化，确保虚拟列表计算准确。
 */
const listResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 下拉列表最大高度
 * @description 当选项过多时限制列表视口高度并启用滚动。
 */
const OPTION_MAX_HEIGHT = 240;
/**
 * 虚拟渲染超出缓冲项数量
 * @description 在可见区上下额外渲染的选项数量，降低滚动闪烁。
 */
const OPTION_OVERSCAN = 4;
/**
 * 虚拟列表总高度
 * @description 根据选项总数与项高计算占位容器高度。
 */
const totalHeight = computed(() => props.options.length * itemHeight.value);
/**
 * 列表视口高度
 * @description 取总高度与最大高度中的较小值，作为可视区域。
 */
const viewportHeight = computed(() => Math.min(totalHeight.value, OPTION_MAX_HEIGHT));
/**
 * 虚拟列表起始索引
 * @description 根据滚动位置与 overscan 计算当前应渲染的起始位置。
 */
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - OPTION_OVERSCAN)
);
/**
 * 虚拟列表结束索引
 * @description 根据滚动位置、视口高度与 overscan 计算渲染终止位置。
 */
const endIndex = computed(() =>
  Math.min(
    props.options.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + OPTION_OVERSCAN
  )
);
/**
 * 当前可见选项切片
 * @description 根据起止索引截取当前需渲染的选项数组。
 */
const visibleOptions = computed(() =>
  props.options.slice(startIndex.value, endIndex.value)
);

/**
 * 切换下拉框展开状态
 * @description 在非禁用状态下打开或关闭下拉菜单。
 */
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

/**
 * 选择指定选项
 * @description 更新当前值、关闭下拉列表并将焦点还原到触发按钮。
 * @param optValue 选中的选项值。
 */
const handleSelect = (optValue: SelectItemValue) => {
  value.value = optValue;
  isOpen.value = false;
  nextTick(() => triggerRef.value?.focus());
};

/**
 * 处理选项点击事件
 * @description 从选项节点读取 `data-value`，映射回真实值并执行选择。
 * @param e 选项点击事件对象。
 */
const handleOptionClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const key = target.dataset.value;
  if (!key || !optionsValueMap.value.has(key)) return;
  handleSelect(optionsValueMap.value.get(key) as SelectItemValue);
};

/**
 * 处理下拉组件键盘交互
 * @description 支持 Enter/Space 选择、Esc 关闭、方向键导航及 Home/End 快速定位。
 * @param e 键盘事件对象。
 */
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

/**
 * 处理外部点击关闭
 * @description 当点击目标不在组件容器内时关闭下拉菜单。
 * @param e 鼠标事件对象。
 */
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

/**
 * 处理下拉列表滚动事件
 * @description 同步滚动容器 `scrollTop` 到响应式状态，用于虚拟列表可见区计算。
 * @param e 滚动事件对象。
 */
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

/**
 * 处理鼠标滚轮滚动
 * @description 拦截默认滚轮行为并手动更新列表滚动位置，避免外层容器联动滚动。
 * @param e 滚轮事件对象。
 */
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

/**
 * 确保指定索引选项在可视区域内
 * @description 根据当前项上下边界自动调整列表滚动位置。
 * @param index 目标选项索引。
 */
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

/**
 * 监听展开状态并同步副作用。
 * @description 在浏览器环境中管理外部点击监听、焦点索引与滚动定位。
 */
watch(isOpen, (newVal) => {
  /**
   * SSR 环境保护。
   * @description 非浏览器环境下跳过 DOM 事件绑定与操作。
   */
  if (typeof document === 'undefined') return;
  
  if (newVal) {
    document.addEventListener('mousedown', handleClickOutside);
    const currentValue = value.value;
    const currentIndex =
      currentValue === undefined ? -1 : (optionsIndexMap.value.get(currentValue) ?? -1);
    /**
     * 聚焦索引边界保护。
     * @description 若当前值不存在则回退到首项，避免索引越界。
     */
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

/**
 * 监听展开状态与聚焦索引联动。
 * @description 下拉打开且存在有效焦点索引时，确保对应选项滚动到可见区域。
 */
watch([isOpen, focusedIndex], ([open, index]) => {
  if (!open || index < 0) return;
  ensureIndexVisible(index);
});

/**
 * 监听展开状态与选项数量变化。
 * @description 在列表打开后测量首项高度并启动 `ResizeObserver`，动态同步项高用于虚拟渲染。
 */
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

/**
 * 监听展开状态收起事件。
 * @description 下拉关闭时断开尺寸观测器，避免多余监听与内存占用。
 */
watch(isOpen, (open) => {
  if (open) return;
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

/**
 * 监听虚拟列表滚动边界。
 * @description 当选项变化导致最大滚动值收缩时，自动回收超界 `scrollTop`，防止列表空白。
 */
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
/**
 * 组件卸载清理。
 * @description 安全移除外部点击监听并释放尺寸观测器。
 */
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
  <div
    class="select-item pref-disabled"
    :class="{ disabled }"
    :data-disabled="disabled ? 'true' : undefined"
  >
    <label :id="selectId" class="select-item-label pref-disabled-label">{{ label }}</label>
    <div ref="containerRef" class="select-item-control">
      <button
        ref="triggerRef"
        type="button"
        class="custom-select-trigger pref-disabled-trigger data-open:ring-1 data-open:ring-ring/30 data-open:border-primary data-open:shadow-md"
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
