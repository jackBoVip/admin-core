<script setup lang="ts">
/**
 * 水印组件
 * @description 根据偏好设置渲染全局水印，带缓存优化
 */
import { computed, watch, shallowRef } from 'vue';
import { usePreferences } from '../composables';

const { preferences } = usePreferences();

// 水印配置 - 使用 computed 仅订阅需要的字段
const watermarkConfig = computed(() => ({
  enabled: preferences.value?.app?.watermark ?? false,
  content: preferences.value?.app?.watermarkContent ?? '',
  angle: preferences.value?.app?.watermarkAngle ?? -22,
  appendDate: preferences.value?.app?.watermarkAppendDate ?? false,
  fontSize: preferences.value?.app?.watermarkFontSize ?? 16,
}));

// 生成水印文本
const watermarkText = computed(() => {
  const { content, appendDate } = watermarkConfig.value;
  if (!content) return '';
  
  if (appendDate) {
    const date = new Date();
    const dateStr = date.toLocaleDateString();
    return `${content} ${dateStr}`;
  }
  
  return content;
});

// 生成配置的缓存 key
const cacheKey = computed(() => {
  const { enabled, angle, fontSize } = watermarkConfig.value;
  if (!enabled || !watermarkText.value) return '';
  return `${watermarkText.value}|${angle}|${fontSize}`;
});

// 水印 canvas 数据 URL（使用 shallowRef 避免深度响应式）
const watermarkDataUrl = shallowRef('');

// 缓存：避免重复生成相同配置的水印
const watermarkCache = new Map<string, string>();

// 复用的 canvas 元素
let reusableCanvas: HTMLCanvasElement | null = null;

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

// 生成水印图片的函数（带缓存，SSR 安全）
function generateWatermark() {
  const key = cacheKey.value;
  
  if (!key) {
    watermarkDataUrl.value = '';
    return;
  }

  // SSR 环境检查
  if (typeof document === 'undefined') return;

  // 检查缓存
  const cached = watermarkCache.get(key);
  if (cached) {
    watermarkDataUrl.value = cached;
    return;
  }

  // 复用 canvas 元素
  if (!reusableCanvas) {
    reusableCanvas = document.createElement('canvas');
  }
  const canvas = reusableCanvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { angle, fontSize } = watermarkConfig.value;
  const text = watermarkText.value;
  const angleRad = (angle * Math.PI) / 180;

  // 设置字体来测量文本
  ctx.font = `${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  // 计算旋转后的边界框
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  const rotatedWidth = textWidth * cos + textHeight * sin;
  const rotatedHeight = textWidth * sin + textHeight * cos;

  // 设置 canvas 尺寸（添加间距）
  const padding = 80;
  canvas.width = rotatedWidth + padding;
  canvas.height = rotatedHeight + padding;

  // 清除并设置透明背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 移动到中心并旋转
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(angleRad);

  // 绘制水印文本
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  
  // 存入缓存（限制缓存大小）
  if (watermarkCache.size > 10) {
    const firstKey = watermarkCache.keys().next().value;
    if (firstKey) watermarkCache.delete(firstKey);
  }
  watermarkCache.set(key, dataUrl);
  
  watermarkDataUrl.value = dataUrl;
}

// 监听配置变化（使用 cacheKey 减少不必要的重新生成）
watch(cacheKey, () => generateWatermark(), { immediate: true });
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
