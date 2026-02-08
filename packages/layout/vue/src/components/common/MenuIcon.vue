<script setup lang="ts">
import { computed } from 'vue';
import { resolveMenuIconMeta, resolveLayoutIconSize } from '@admin-core/layout';

const props = defineProps<{
  icon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
}>();

const meta = computed(() => resolveMenuIconMeta(props.icon));
const sizeClass = computed(() => resolveLayoutIconSize(props.size));
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
