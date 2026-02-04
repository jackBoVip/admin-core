<script setup lang="ts">
/**
 * 全屏按钮组件
 * @description 切换浏览器全屏模式
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useLayoutContext } from '../../composables';
import { logger } from '@admin-core/layout';

const context = useLayoutContext();

// 是否全屏
const isFullscreen = ref(false);

// 检查全屏状态
const checkFullscreen = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

// 切换全屏
const toggleFullscreen = async () => {
  try {
    if (isFullscreen.value) {
      // 退出全屏
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
      // 进入全屏
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

// 监听全屏变化事件
onMounted(() => {
  checkFullscreen();
  document.addEventListener('fullscreenchange', checkFullscreen);
  document.addEventListener('webkitfullscreenchange', checkFullscreen);
  document.addEventListener('mozfullscreenchange', checkFullscreen);
  document.addEventListener('MSFullscreenChange', checkFullscreen);
});

onUnmounted(() => {
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
    <svg v-if="!isFullscreen" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
    <!-- 最小化图标 -->
    <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  </button>
</template>
