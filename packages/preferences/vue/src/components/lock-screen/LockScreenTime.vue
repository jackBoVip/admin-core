<script setup lang="ts">
/**
 * 锁屏时间显示组件
 * @description 独立组件，避免时间更新导致整个锁屏重渲染
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  /** 当前语言 */
  locale: string;
}>();

const currentTime = ref(new Date());
// 使用 ref 存储定时器，确保每个组件实例独立管理
const timer = ref<ReturnType<typeof setInterval> | null>(null);

// 缓存 DateTimeFormat 实例
const dateFormatter = computed(() => {
  return {
    date: new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: new Intl.DateTimeFormat(props.locale, { weekday: 'long' }),
  };
});

const timeInfo = computed(() => {
  const time = currentTime.value;
  return {
    hour24: time.getHours().toString().padStart(2, '0'),
    minute: time.getMinutes().toString().padStart(2, '0'),
    second: time.getSeconds().toString().padStart(2, '0'),
    dateStr: dateFormatter.value.date.format(time),
    weekdayStr: dateFormatter.value.weekday.format(time),
  };
});

onMounted(() => {
  timer.value = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<template>
  <div class="preferences-lock-time-main">
    <span class="preferences-lock-time-hours">{{ timeInfo.hour24 }}</span>
    <span class="preferences-lock-time-divider" aria-hidden="true">:</span>
    <span class="preferences-lock-time-minutes">{{ timeInfo.minute }}</span>
    <span class="preferences-lock-time-seconds">{{ timeInfo.second }}</span>
  </div>
  <div class="preferences-lock-time-info">
    <span class="preferences-lock-time-weekday">{{ timeInfo.weekdayStr }}</span>
    <span class="preferences-lock-time-divider-dot" aria-hidden="true"></span>
    <span class="preferences-lock-time-date">{{ timeInfo.dateStr }}</span>
  </div>
</template>
