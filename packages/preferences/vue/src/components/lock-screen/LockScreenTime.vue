<script setup lang="ts">
/**
 * 锁屏时间显示组件
 * @description 独立组件，避免时间更新导致整个锁屏重渲染
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * 组件入参。
 */
export interface LockScreenTimeProps {
  /** 当前语言。 */
  locale: string;
}

/**
 * 时间展示结构。
 */
interface LockScreenTimeInfo {
  /** 24 小时制小时。 */
  hour24: string;
  /** 分钟。 */
  minute: string;
  /** 秒。 */
  second: string;
  /** 日期文案。 */
  dateStr: string;
  /** 星期文案。 */
  weekdayStr: string;
}

const props = defineProps<LockScreenTimeProps>();

/**
 * 当前时间状态。
 */
const currentTime = ref(new Date());
/**
 * 定时器句柄。
 * @description 使用 `ref` 保证每个组件实例独立管理。
 */
const timer = ref<ReturnType<typeof setInterval> | null>(null);

/**
 * 日期与星期格式化器。
 */
const dateFormatter = computed(() => {
  return {
    date: new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: new Intl.DateTimeFormat(props.locale, { weekday: 'long' }),
  };
});

/**
 * 当前时间展示结构。
 */
const timeInfo = computed<LockScreenTimeInfo>(() => {
  const time = currentTime.value;
  return {
    hour24: time.getHours().toString().padStart(2, '0'),
    minute: time.getMinutes().toString().padStart(2, '0'),
    second: time.getSeconds().toString().padStart(2, '0'),
    dateStr: dateFormatter.value.date.format(time),
    weekdayStr: dateFormatter.value.weekday.format(time),
  };
});

/**
 * 组件挂载初始化。
 * @description 启动每秒刷新一次的计时器，驱动时间显示实时更新。
 */
onMounted(() => {
  timer.value = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

/**
 * 组件卸载清理。
 * @description 清理计时器，防止组件销毁后仍持续触发状态更新。
 */
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
