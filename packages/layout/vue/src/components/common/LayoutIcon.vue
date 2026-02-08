<script setup lang="ts">
import { computed } from 'vue';
import {
  getLayoutUiIconDefinition,
  resolveLayoutIconSize,
  type LayoutUiIconName,
} from '@admin-core/layout';

const props = defineProps<{
  name: LayoutUiIconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
  style?: Record<string, string> | string;
}>();

const iconDef = computed(() => getLayoutUiIconDefinition(props.name));

const sizeClass = computed(() => {
  return resolveLayoutIconSize(props.size);
});

const svgClass = computed(() => {
  if (props.className) return `${sizeClass.value} ${props.className}`;
  return sizeClass.value;
});

const fill = computed(() => (iconDef.value?.fill ? 'currentColor' : 'none'));
const stroke = computed(() => (iconDef.value?.fill ? 'none' : 'currentColor'));
</script>

<template>
  <svg
    v-if="iconDef"
    :class="svgClass"
    :viewBox="iconDef.viewBox"
    :fill="fill"
    :stroke="stroke"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="style"
  >
    <g v-if="iconDef.extra" v-html="iconDef.extra" />
    <path v-if="iconDef.path" :d="iconDef.path" />
  </svg>
</template>
