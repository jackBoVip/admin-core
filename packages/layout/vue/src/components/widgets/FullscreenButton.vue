<script setup lang="ts">
/**
 * 全屏按钮组件
 * @description 切换浏览器全屏模式
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useLayoutContext } from '../../composables';
import { logger } from '@admin-core/layout';
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 布局上下文
 * @description 提供全屏状态切换后对外事件通知能力。
 */
const context = useLayoutContext();

/**
 * 当前浏览器是否处于全屏状态。
 */
const isFullscreen = ref(false);

/**
 * 检测浏览器当前全屏状态并同步到响应式状态。
 */
const checkFullscreen = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

/**
 * 切换浏览器全屏状态，兼容不同浏览器前缀 API。
 */
const toggleFullscreen = async () => {
  try {
    if (isFullscreen.value) {
      /** 退出全屏。 */
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } else {
      /** 进入全屏。 */
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    }
    
    context.events.onFullscreenToggle?.(!isFullscreen.value);
  } catch (error) {
    logger.warn('Fullscreen API not supported:', error);
  }
};

onMounted(() => {
  /**
   * 挂载后同步全屏状态并注册全屏变化监听。
   */
  checkFullscreen();
  document.addEventListener('fullscreenchange', checkFullscreen);
  document.addEventListener('webkitfullscreenchange', checkFullscreen);
  document.addEventListener('mozfullscreenchange', checkFullscreen);
  document.addEventListener('MSFullscreenChange', checkFullscreen);
});

onUnmounted(() => {
  /**
   * 卸载时移除全屏变化监听，避免重复注册与内存泄漏。
   */
  document.removeEventListener('fullscreenchange', checkFullscreen);
  document.removeEventListener('webkitfullscreenchange', checkFullscreen);
  document.removeEventListener('mozfullscreenchange', checkFullscreen);
  document.removeEventListener('MSFullscreenChange', checkFullscreen);
});
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    :data-fullscreen="isFullscreen ? 'true' : undefined"
    @click="toggleFullscreen"
  >
    <!-- 最大化图标 -->
    <LayoutIcon v-if="!isFullscreen" name="fullscreen" size="sm" />
    <!-- 最小化图标 -->
    <LayoutIcon v-else name="fullscreen-exit" size="sm" />
  </button>
</template>
