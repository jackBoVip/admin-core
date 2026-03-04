<script setup lang="ts">
/**
 * 页面切换进度条
 * @description 根据路由/刷新变化展示顶部进度条
 */
import { computed, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext, usePageTransition, useRouter } from '../../composables';

/**
 * 布局上下文
 * @description 提供刷新键等全局状态。
 */
const context = useLayoutContext();
/**
 * 当前路由路径
 * @description 路由变化时驱动进度条动画。
 */
const { currentPath } = useRouter();
/**
 * 页面过渡配置
 * @description 控制是否启用转场进度条展示。
 */
const { enabled, showProgress } = usePageTransition();

/**
 * 是否应显示进度条能力
 * @description 同时依赖转场开关与进度条开关。
 */
const shouldShow = computed(() => enabled.value && showProgress.value);
/**
 * 进度条可见状态
 * @description 用于控制进度条淡入淡出显示。
 */
const visible = ref(false);
/**
 * 当前进度百分比
 * @description 驱动进度条宽度变化。
 */
const percent = ref(0);
/**
 * 进度动画定时器集合
 * @description 保存当前动画流程的所有定时器句柄，便于统一清理。
 */
let timers: Array<ReturnType<typeof setTimeout>> = [];

/**
 * 清理进度条动画相关定时器。
 */
const clearTimers = () => {
  timers.forEach((timer) => clearTimeout(timer));
  timers = [];
};

/**
 * 重置进度条状态并取消挂起动画任务。
 */
const reset = () => {
  clearTimers();
  visible.value = false;
  percent.value = 0;
};

/**
 * 启动一次进度条动画流程。
 */
const start = () => {
  if (!shouldShow.value) return;
  clearTimers();
  visible.value = true;
  percent.value = 0;

  timers.push(setTimeout(() => {
    percent.value = 28;
  }, 10));

  timers.push(setTimeout(() => {
    percent.value = 62;
  }, 180));

  timers.push(setTimeout(() => {
    percent.value = 85;
  }, 360));

  timers.push(setTimeout(() => {
    percent.value = 100;
  }, 560));

  timers.push(setTimeout(() => {
    visible.value = false;
    percent.value = 0;
  }, 760));
};

watch(
  [currentPath, () => context.state.refreshKey],
  () => {
    if (!shouldShow.value) return;
    start();
  },
  { flush: 'post' }
);

watch(
  shouldShow,
  (value) => {
    if (!value) {
      reset();
    }
  }
);

onUnmounted(() => {
  clearTimers();
});
</script>

<template>
  <div
    v-if="shouldShow"
    class="layout-progress"
    :data-visible="visible ? 'true' : undefined"
  >
    <div class="layout-progress__bar" :style="{ width: `${percent}%` }" />
  </div>
</template>
