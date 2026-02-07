<script setup lang="ts">
/**
 * 页脚组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed } from '../../composables';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
// 配置
const footerConfig = computed(() => context.props.footer || {});
const copyrightConfig = computed(() => context.props.copyright || {});
const show = computed(() => !layoutComputed.value.isFullContent);
const isFixed = computed(() => !!footerConfig.value.fixed);

// 类名
const footerClass = computed(() => [
  'layout-footer',
  {
    'layout-footer--fixed': isFixed.value,
  },
]);

// 样式
const footerStyle = computed(() => {
  const { footerHeight, mainStyle } = layoutComputed.value;
  const style: Record<string, string> = {
    height: `${footerHeight}px`,
    marginBottom: show.value ? '0' : `-${footerHeight}px`,
    position: isFixed.value ? 'fixed' : 'static',
  };

  if (isFixed.value) {
    style.left = mainStyle.marginLeft;
    style.right = mainStyle.marginRight;
  } else {
    style.marginLeft = mainStyle.marginLeft;
    style.marginRight = mainStyle.marginRight;
  }

  return style;
});
</script>

<template>
  <footer
    :class="footerClass"
    :style="footerStyle"
    :data-fixed="footerConfig.fixed ? 'true' : undefined"
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
