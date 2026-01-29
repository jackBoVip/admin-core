<script setup lang="ts">
/**
 * 动画预览组件
 * @description 实时展示页面切换动画效果
 */
import { ref, watch, onUnmounted, computed } from 'vue';
import type { PageTransitionType } from '@admin-core/preferences';

const props = withDefaults(defineProps<{
  /** 当前选中的动画类型 */
  transition: PageTransitionType;
  /** 是否启用动画（全局开关） */
  enabled?: boolean;
  /** 是否选中（只有选中时才播放动画） */
  active?: boolean;
  /** 紧凑模式（用于网格展示） */
  compact?: boolean;
}>(), {
  enabled: true,
  active: false,
  compact: false,
});

// 是否应该播放动画：全局开启 且 当前选中
const shouldAnimate = computed(() => props.enabled && props.active);

// 动画状态（使用 ref 存储定时器，避免多实例冲突）
const isAnimating = ref(false);
const showContent = ref(true);
const animationTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);
const loopTimerRef = ref<ReturnType<typeof setInterval> | null>(null);

// 动画 CSS 类映射
const transitionClasses: Record<PageTransitionType, { enter: string; leave: string }> = {
  'fade': {
    enter: 'transition-preview-fade-enter',
    leave: 'transition-preview-fade-leave',
  },
  'fade-slide': {
    enter: 'transition-preview-fade-slide-enter',
    leave: 'transition-preview-fade-slide-leave',
  },
  'fade-up': {
    enter: 'transition-preview-fade-up-enter',
    leave: 'transition-preview-fade-up-leave',
  },
  'fade-down': {
    enter: 'transition-preview-fade-down-enter',
    leave: 'transition-preview-fade-down-leave',
  },
  'slide-left': {
    enter: 'transition-preview-slide-left-enter',
    leave: 'transition-preview-slide-left-leave',
  },
  'slide-right': {
    enter: 'transition-preview-slide-right-enter',
    leave: 'transition-preview-slide-right-leave',
  },
};

// 当前动画类
const currentClass = ref('');

// 动画时长配置（毫秒）
const ANIMATION_DURATION = 500; // CSS 动画时长
const ANIMATION_GAP = 150;      // 切换间隔
const LOOP_INTERVAL = 3500;     // 循环间隔

// 清理单个定时器
const clearAnimationTimer = () => {
  if (animationTimerRef.value) {
    clearTimeout(animationTimerRef.value);
    animationTimerRef.value = null;
  }
};

// 设置定时器（先清理再设置）
const setAnimationTimer = (callback: () => void, delay: number) => {
  clearAnimationTimer();
  animationTimerRef.value = setTimeout(callback, delay);
};

// 播放动画
const playAnimation = () => {
  if (!shouldAnimate.value || isAnimating.value) return;
  
  isAnimating.value = true;
  const classes = transitionClasses[props.transition] || transitionClasses['fade'];
  
  // 使用 requestAnimationFrame 确保流畅
  requestAnimationFrame(() => {
    // 离开动画
    currentClass.value = classes.leave;
    
    setAnimationTimer(() => {
      showContent.value = false;
      currentClass.value = '';
      
      // 短暂延迟后显示新内容
      setAnimationTimer(() => {
        requestAnimationFrame(() => {
          showContent.value = true;
          currentClass.value = classes.enter;
          
          // 动画结束后重置
          setAnimationTimer(() => {
            currentClass.value = '';
            isAnimating.value = false;
          }, ANIMATION_DURATION);
        });
      }, ANIMATION_GAP);
    }, ANIMATION_DURATION);
  });
};

// 自动循环播放
const startLoop = () => {
  stopLoop();
  if (shouldAnimate.value) {
    // 延迟启动，避免同时触发多个动画
    setAnimationTimer(() => {
      playAnimation();
      loopTimerRef.value = setInterval(playAnimation, LOOP_INTERVAL);
    }, 300);
  }
};

const stopLoop = () => {
  if (loopTimerRef.value) {
    clearInterval(loopTimerRef.value);
    loopTimerRef.value = null;
  }
  if (animationTimerRef.value) {
    clearTimeout(animationTimerRef.value);
    animationTimerRef.value = null;
  }
  isAnimating.value = false;
};

// 监听是否应该播放动画
watch(shouldAnimate, (should) => {
  if (should) {
    startLoop();
  } else {
    stopLoop();
    showContent.value = true;
    currentClass.value = '';
  }
}, { immediate: true });

onUnmounted(() => {
  stopLoop();
});
</script>

<template>
  <div class="transition-preview" :class="{ disabled: !enabled, compact: compact }">
    <div class="transition-preview-screen">
      <!-- 模拟页面头部 -->
      <div class="transition-preview-header">
        <div class="transition-preview-header-dot" />
        <div class="transition-preview-header-dot" />
        <div class="transition-preview-header-dot" />
      </div>
      <!-- 模拟侧边栏 -->
      <div class="transition-preview-sidebar">
        <div class="transition-preview-menu-item active" />
        <div class="transition-preview-menu-item" />
        <div class="transition-preview-menu-item" />
      </div>
      <!-- 模拟内容区 -->
      <div class="transition-preview-content">
        <div 
          v-if="showContent" 
          class="transition-preview-page"
          :class="currentClass"
        >
          <div class="transition-preview-card" />
          <div class="transition-preview-card small" />
        </div>
      </div>
    </div>
  </div>
</template>
