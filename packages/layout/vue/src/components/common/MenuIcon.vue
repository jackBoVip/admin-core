<script setup lang="ts">
import { computed } from 'vue';
import { resolveMenuIconMeta, resolveLayoutIconSize } from '@admin-core/layout';

/**
 * 菜单图标组件入参。
 */
const props = defineProps<{
  /** 图标编码或文本图标内容。 */
  icon?: string;
  /** 图标尺寸等级。 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  /** 额外类名。 */
  className?: string;
}>();

/**
 * 图标元信息（SVG 路径或文本）。
 */
const meta = computed(() => resolveMenuIconMeta(props.icon));
/**
 * 尺寸类名。
 */
const sizeClass = computed(() => resolveLayoutIconSize(props.size));
/**
 * 最终图标样式类名。
 */
const svgClass = computed(() => {
  if (props.className) return `${sizeClass.value} ${props.className}`;
  return sizeClass.value;
});
</script>

<template>
  <span v-if="meta">
    <svg
      v-if="meta.type === 'svg'"
      :class="svgClass"
      :viewBox="meta.viewBox"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path v-if="meta.path" :d="meta.path" />
    </svg>
    <span v-else :class="svgClass">{{ meta.raw }}</span>
  </span>
</template>
