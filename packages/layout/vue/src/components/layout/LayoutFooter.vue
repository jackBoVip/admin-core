<script setup lang="ts">
/**
 * 页脚组件
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed } from '../../composables';

/**
 * 布局上下文
 * @description 提供页脚配置、版权配置与插槽上下文。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 提供页脚高度、主内容偏移与全内容模式标识。
 */
const layoutComputed = useLayoutComputed();
/**
 * 页脚配置
 * @description 读取固定定位等页脚能力配置。
 */
const footerConfig = computed(() => context.props.footer || {});
/**
 * 版权配置
 * @description 控制公司名称、备案号与年份等展示内容。
 */
const copyrightConfig = computed(() => context.props.copyright || {});
/**
 * 页脚是否可见
 * @description 在全内容模式下隐藏页脚区域。
 */
const show = computed(() => !layoutComputed.value.isFullContent);
/**
 * 页脚是否固定
 * @description 固定时脱离文档流并贴附底部。
 */
const isFixed = computed(() => !!footerConfig.value.fixed);

/**
 * 页脚类名集合
 * @description 依据固定状态生成修饰类。
 */
const footerClass = computed(() => [
  'layout-footer',
  {
    'layout-footer--fixed': isFixed.value,
  },
]);

/**
 * 页脚内联样式
 * @description 统一计算高度、显隐位移及左右边距/定位。
 */
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
