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

const { preferences } = usePreferences();

// 水印配置 - 使用 computed 仅订阅需要的字段
const watermarkConfig = computed<WatermarkConfig>(() => ({
  enabled: preferences.value?.app?.watermark ?? false,
  content: preferences.value?.app?.watermarkContent ?? '',
  angle: preferences.value?.app?.watermarkAngle ?? -22,
  appendDate: preferences.value?.app?.watermarkAppendDate ?? false,
  fontSize: preferences.value?.app?.watermarkFontSize ?? 16,
}));

// 生成水印文本
const watermarkText = computed(() => getWatermarkText(watermarkConfig.value));

// 水印 canvas 数据 URL（使用 shallowRef 避免深度响应式）
const watermarkDataUrl = shallowRef('');

const watermarkGenerator = createWatermarkGenerator();

// 是否应该显示水印
const shouldShow = computed(() => 
  watermarkConfig.value.enabled && !!watermarkText.value && !!watermarkDataUrl.value
);

// 水印样式 - 使用内联样式确保生效
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

const generateWatermark = () => {
  watermarkDataUrl.value = watermarkGenerator.getDataUrl(watermarkConfig.value);
};

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
