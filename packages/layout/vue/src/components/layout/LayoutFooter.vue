<script setup lang="ts">
/**
 * 页脚组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState } from '../../composables';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed: sidebarCollapsed } = useSidebarState();

// 配置
const footerConfig = computed(() => context.props.footer || {});
const copyrightConfig = computed(() => context.props.copyright || {});

// 类名
const footerClass = computed(() => [
  'layout-footer',
  {
    'layout-footer--fixed': footerConfig.value.fixed,
    'layout-footer--with-sidebar': layoutComputed.value.showSidebar && !context.props.isMobile,
    'layout-footer--collapsed': sidebarCollapsed.value && !context.props.isMobile,
  },
]);

// 样式
const footerStyle = computed(() => ({
  height: `${layoutComputed.value.footerHeight}px`,
  left: footerConfig.value.fixed && layoutComputed.value.showSidebar && !context.props.isMobile
    ? `${layoutComputed.value.sidebarWidth}px`
    : '0',
}));
</script>

<template>
  <footer
    :class="footerClass"
    :style="footerStyle"
    :data-fixed="footerConfig.fixed ? 'true' : undefined"
    :data-with-sidebar="layoutComputed.showSidebar && !context.props.isMobile ? 'true' : undefined"
    :data-collapsed="sidebarCollapsed && !context.props.isMobile ? 'true' : undefined"
  >
    <div class="layout-footer__inner flex h-full items-center justify-between px-4">
      <!-- 左侧 -->
      <div class="layout-footer__left">
        <slot name="left" />
      </div>

      <!-- 中间 - 版权信息 -->
      <div class="layout-footer__center flex items-center gap-4 text-sm text-gray-500">
        <slot name="center">
          <template v-if="copyrightConfig.enable">
            <span v-if="copyrightConfig.date">
              © {{ copyrightConfig.date }}
            </span>
            <a
              v-if="copyrightConfig.companyName"
              :href="copyrightConfig.companySiteLink || '#'"
              target="_blank"
              class="hover:text-primary"
            >
              {{ copyrightConfig.companyName }}
            </a>
            <a
              v-if="copyrightConfig.icp"
              :href="copyrightConfig.icpLink || 'https://beian.miit.gov.cn/'"
              target="_blank"
              class="hover:text-primary"
            >
              {{ copyrightConfig.icp }}
            </a>
          </template>
        </slot>
      </div>

      <!-- 右侧 -->
      <div class="layout-footer__right">
        <slot name="right" />
      </div>
    </div>
  </footer>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
