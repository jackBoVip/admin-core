<script setup lang="ts">
/**
 * 页面切换进度条
 * @description 根据路由/刷新变化展示顶部进度条
 */
import { computed, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext, usePageTransition, useRouter } from '../../composables';

const context = useLayoutContext();
const { currentPath } = useRouter();
const { enabled, showProgress } = usePageTransition();

const shouldShow = computed(() => enabled.value && showProgress.value);
const visible = ref(false);
const percent = ref(0);
let timers: Array<ReturnType<typeof setTimeout>> = [];

const clearTimers = () => {
  timers.forEach((timer) => clearTimeout(timer));
  timers = [];
};

const reset = () => {
  clearTimers();
  visible.value = false;
  percent.value = 0;
};

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
