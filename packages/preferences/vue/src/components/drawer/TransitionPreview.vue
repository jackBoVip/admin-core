<script setup lang="ts">
/**
 * 页面过渡动画预览组件模块。
 * @description 在偏好设置面板中演示路由切换动画，帮助用户直观选择过渡效果。
 */
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import type { PageTransitionType } from '@admin-core/preferences';

/**
 * 动画预览组件入参。
 * @description 描述预览动画类型、启用状态、激活状态与紧凑布局模式。
 */
export interface TransitionPreviewProps {
  /** 当前选中的动画类型。 */
  transition: PageTransitionType;
  /** 是否启用动画（全局开关）。 */
  enabled?: boolean;
  /** 是否选中（只有选中时才播放动画）。 */
  active?: boolean;
  /** 紧凑模式（用于网格展示）。 */
  compact?: boolean;
}

/**
 * 过渡动画类名映射结构。
 */
interface TransitionClassPair {
  /** 进入动画类名。 */
  enter: string;
  /** 离开动画类名。 */
  leave: string;
}

const props = withDefaults(defineProps<TransitionPreviewProps>(), {
  enabled: true,
  active: false,
  compact: false,
});

/**
 * 是否应触发预览动画
 * @description 仅当全局开关开启且当前项处于激活状态时返回 `true`。
 */
const shouldAnimate = computed(() => props.enabled && props.active);

/**
 * 动画进行中状态
 * @description 表示当前预览是否在执行一次切换动画流程。
 */
const isAnimating = ref(false);
/**
 * 预览内容可见状态
 * @description 通过显隐切换模拟路由页面进出场。
 */
const showContent = ref(true);
/**
 * 单次动画定时器引用
 * @description 缓存 `setTimeout` 句柄，用于串联动画阶段并安全清理。
 */
const animationTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);
/**
 * 循环播放定时器引用
 * @description 缓存 `setInterval` 句柄，用于持续轮播预览动画。
 */
const loopTimerRef = ref<ReturnType<typeof setInterval> | null>(null);

/**
 * 动画类名映射表
 * @description 将页面切换类型映射到对应的 enter/leave CSS 动画类名。
 */
const transitionClasses: Record<PageTransitionType, TransitionClassPair> = {
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

/**
 * 当前应用的动画类
 * @description 运行时写入离场或入场类名，驱动预览节点过渡。
 */
const currentClass = ref('');

/**
 * 单段动画时长（毫秒）
 * @description 与 CSS 过渡时长保持一致。
 */
const ANIMATION_DURATION = 500;
/**
 * 动画段间隔时长（毫秒）
 * @description 离场与入场之间的切换留白。
 */
const ANIMATION_GAP = 150;
/**
 * 自动轮播间隔（毫秒）
 * @description 控制循环播放时两次动画触发之间的时间间隔。
 */
const LOOP_INTERVAL = 3500;

/**
 * 清理动画单次定时器
 * @description 取消当前 `setTimeout` 任务并重置引用。
 */
const clearAnimationTimer = () => {
  if (animationTimerRef.value) {
    clearTimeout(animationTimerRef.value);
    animationTimerRef.value = null;
  }
};

/**
 * 设置动画单次定时器
 * @description 先清理旧定时器，保证同一时刻仅存在一个动画时序任务。
 * @param callback 定时触发的回调函数。
 * @param delay 延迟时间（毫秒）。
 */
const setAnimationTimer = (callback: () => void, delay: number) => {
  clearAnimationTimer();
  animationTimerRef.value = setTimeout(callback, delay);
};

/**
 * 播放一次页面切换预览动画
 * @description 按“离开 -> 过渡间隔 -> 进入 -> 复位”顺序驱动预览状态。
 */
const playAnimation = () => {
  if (!shouldAnimate.value || isAnimating.value) return;
  
  isAnimating.value = true;
  const classes = transitionClasses[props.transition] || transitionClasses['fade'];
  
  /**
   * 使用 requestAnimationFrame 启动动画。
   * @description 让状态变更与浏览器渲染节奏对齐，提升流畅度。
   */
  requestAnimationFrame(() => {
    /**
     * 第一阶段：离场动画。
     */
    currentClass.value = classes.leave;
    
    setAnimationTimer(() => {
      showContent.value = false;
      currentClass.value = '';
      
      /**
       * 第二阶段：短暂间隔后显示新内容。
       */
      setAnimationTimer(() => {
        requestAnimationFrame(() => {
          showContent.value = true;
          currentClass.value = classes.enter;
          
          /**
           * 第三阶段：动画结束后重置状态。
           */
          setAnimationTimer(() => {
            currentClass.value = '';
            isAnimating.value = false;
          }, ANIMATION_DURATION);
        });
      }, ANIMATION_GAP);
    }, ANIMATION_DURATION);
  });
};

/**
 * 启动动画循环
 * @description 在满足播放条件时延迟触发首帧，并按固定间隔循环播放。
 */
const startLoop = () => {
  stopLoop();
  if (shouldAnimate.value) {
    /**
     * 延迟启动首帧。
     * @description 避免与状态切换同帧触发多个动画任务。
     */
    setAnimationTimer(() => {
      playAnimation();
      loopTimerRef.value = setInterval(playAnimation, LOOP_INTERVAL);
    }, 300);
  }
};

/**
 * 停止动画循环
 * @description 清理轮询与单次定时器，并重置动画进行中状态。
 */
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

/**
 * 页面可见性监听回调
 * @description 页面隐藏时暂停动画，恢复可见时按条件重启。
 */
let visibilityHandler: (() => void) | null = null;

/**
 * 监听是否应播放动画。
 * @description 条件不满足时立即停止并复位，满足时重启循环。
 */
watch(shouldAnimate, (should) => {
  if (!should) {
    stopLoop();
    showContent.value = true;
    currentClass.value = '';
    return;
  }
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    stopLoop();
    showContent.value = true;
    currentClass.value = '';
    return;
  }
  startLoop();
}, { immediate: true });

/**
 * 组件挂载初始化。
 * @description 在浏览器环境注册页面可见性监听，按可见状态暂停或恢复预览动画循环。
 */
onMounted(() => {
  if (typeof document === 'undefined') return;
  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      stopLoop();
      showContent.value = true;
      currentClass.value = '';
    } else if (shouldAnimate.value) {
      startLoop();
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
});

/**
 * 组件卸载清理。
 * @description 移除可见性监听并停止所有动画定时器，避免卸载后残留任务。
 */
onUnmounted(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  stopLoop();
});
</script>

<template>
  <div
    class="transition-preview pref-disabled"
    :class="{ disabled: !enabled, compact: compact }"
    :data-disabled="!enabled ? 'true' : undefined"
  >
    <div class="transition-preview-screen">
      <!-- 模拟页面头部 -->
      <div class="transition-preview-header">
        <div class="transition-preview-header-dot" />
        <div class="transition-preview-header-dot" />
        <div class="transition-preview-header-dot" />
      </div>
      <!-- 模拟侧边栏 -->
      <div class="transition-preview-sidebar">
        <div class="transition-preview-menu-item active" data-state="active" />
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
