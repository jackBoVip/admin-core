<script setup lang="ts">
/**
 * 输入框设置项组件
 * @description 用于文本输入，支持防抖和长度限制
 */
import { ref, watch, onUnmounted, getCurrentInstance } from 'vue';
import { INPUT_DEBOUNCE_MS, INPUT_MAX_LENGTH } from '@admin-core/preferences';

const props = withDefaults(defineProps<{
  /** 标签文本 */
  label: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 防抖延迟 (ms) */
  debounce?: number;
  /** 最大长度 */
  maxLength?: number;
}>(), {
  debounce: INPUT_DEBOUNCE_MS,
  maxLength: INPUT_MAX_LENGTH,
});

const modelValue = defineModel<string>({ default: '' });

// 本地值用于即时响应UI
const localValue = ref(modelValue.value);

// 防抖定时器（使用 ref 避免多实例冲突）
const debounceTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 同步外部值变化
watch(modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal;
  }
});

// 处理输入变化（防抖）
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value;
  localValue.value = value;
  
  // 清除之前的定时器
  if (debounceTimerRef.value) {
    clearTimeout(debounceTimerRef.value);
  }
  
  // 防抖更新
  debounceTimerRef.value = setTimeout(() => {
    modelValue.value = value;
  }, props.debounce);
};

// 清理定时器
onUnmounted(() => {
  if (debounceTimerRef.value) {
    clearTimeout(debounceTimerRef.value);
    debounceTimerRef.value = null;
  }
});

// 生成稳定的唯一 ID
const instance = getCurrentInstance();
const inputId = `input-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div class="input-item" :class="{ disabled }">
    <label :id="`${inputId}-label`" class="input-item-label">{{ label }}</label>
    <input
      type="text"
      class="preferences-input"
      :value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      :aria-labelledby="`${inputId}-label`"
      @input="handleInput"
    />
  </div>
</template>
