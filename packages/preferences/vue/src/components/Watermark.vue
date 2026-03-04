<script setup lang="ts">
/**
 * 水印组件
 * @description 根据偏好设置渲染全局水印，带缓存优化
 */
import { computed, watch, shallowRef } from 'vue';
import { usePreferences } from '../composables';
import {
  createWatermarkGenerator,
  getWatermarkText,
  type WatermarkConfig,
} from '@admin-core/preferences';

/**
 * 偏好状态引用
 * @description 提供水印开关、文本、角度等配置字段来源。
 */
const { preferences } = usePreferences();

/**
 * 水印配置响应式快照
 * @description 仅订阅水印相关字段，减少不必要的响应式触发。
 */
const watermarkConfig = computed<WatermarkConfig>(() => ({
  enabled: preferences.value?.app?.watermark ?? false,
  content: preferences.value?.app?.watermarkContent ?? '',
  angle: preferences.value?.app?.watermarkAngle ?? -22,
  appendDate: preferences.value?.app?.watermarkAppendDate ?? false,
  fontSize: preferences.value?.app?.watermarkFontSize ?? 16,
}));

/**
 * 水印文本内容
 * @description 根据当前配置拼接展示文本，可按设置附带日期信息。
 */
const watermarkText = computed(() => getWatermarkText(watermarkConfig.value));

/**
 * 水印图像数据 URL
 * @description 缓存生成器产出的 Data URL，使用 `shallowRef` 避免深层代理开销。
 */
const watermarkDataUrl = shallowRef('');

/**
 * 水印生成器实例
 * @description 复用生成器逻辑，避免每次配置变化都重复创建 Canvas 上下文。
 */
const watermarkGenerator = createWatermarkGenerator();

/**
 * 是否展示水印覆盖层
 * @description 仅当开关启用、文本存在且 Data URL 可用时渲染遮罩层。
 */
const shouldShow = computed(() => 
  watermarkConfig.value.enabled && !!watermarkText.value && !!watermarkDataUrl.value
);

/**
 * 水印覆盖层样式
 * @description 使用内联样式写入固定定位与平铺背景，确保在不同宿主样式下稳定生效。
 */
const watermarkStyle = computed(() => {
  if (!watermarkDataUrl.value) return {};
  return {
    position: 'fixed' as const,
    inset: '0',
    zIndex: 9999,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    backgroundImage: `url(${watermarkDataUrl.value})`,
    backgroundRepeat: 'repeat' as const,
  };
});

/**
 * 生成水印图片数据
 * @description 根据当前水印配置重新生成 canvas Data URL，并更新展示源。
 */
const generateWatermark = () => {
  watermarkDataUrl.value = watermarkGenerator.getDataUrl(watermarkConfig.value);
};

/**
 * 监听水印配置变化。
 * @description 配置变更后立即重新生成水印图像，并在首次挂载时执行一次初始化生成。
 */
watch(watermarkConfig, () => generateWatermark(), { immediate: true });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="shouldShow"
      :style="watermarkStyle"
      aria-hidden="true"
    />
  </Teleport>
</template>
