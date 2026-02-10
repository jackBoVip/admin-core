<script setup lang="ts">
import { computed, defineComponent, h, type VNode } from 'vue';
import type { PropType } from 'vue';
import {
  getLayoutUiIconDefinition,
  resolveLayoutIconSize,
  type LayoutUiIconName,
  type SvgNode,
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

const sizeValue = computed(() => {
  const size = props.size;
  if (!size) return undefined;
  if (size === 'xs') return 'var(--admin-icon-size-xs)';
  if (size === 'sm') return 'var(--admin-icon-size-sm)';
  if (size === 'md') return 'var(--admin-icon-size-md)';
  if (size === 'lg') return 'var(--admin-icon-size-lg)';
  if (size === 'xl') return 'var(--admin-icon-size-xl)';
  if (typeof size === 'string' && /^(\\d+(\\.\\d+)?)(px|rem|em|%)$/.test(size)) {
    return size;
  }
  return undefined;
});

const svgClass = computed(() => {
  if (props.className) return `${sizeClass.value} ${props.className}`;
  return sizeClass.value;
});

const mergedStyle = computed(() => {
  const base = props.style ?? {};
  if (!sizeValue.value) return base;
  if (typeof base === 'string') {
    return `width:${sizeValue.value};height:${sizeValue.value};${base}`;
  }
  return {
    width: sizeValue.value,
    height: sizeValue.value,
    ...(base as Record<string, string>),
  };
});

const fill = computed(() => (iconDef.value?.fill ? 'currentColor' : 'none'));
const stroke = computed(() => (iconDef.value?.fill ? 'none' : 'currentColor'));
const opticalTransform = computed(() => {
  const scale = iconDef.value?.opticalScale;
  if (!scale || scale === 1) return '';
  return `translate(12 12) scale(${scale}) translate(-12 -12)`;
});

function renderSvgNode(node: SvgNode, key?: string | number): VNode {
  const children = node.children?.map((child, index) =>
    renderSvgNode(child, `${node.tag}-${index}`)
  );
  return h(node.tag, { ...(node.attrs ?? {}), key }, children);
}

const SvgNodeRenderer = defineComponent({
  name: 'SvgNodeRenderer',
  props: {
    node: {
      type: Object as PropType<SvgNode>,
      required: true,
    },
  },
  setup(props) {
    return () => renderSvgNode(props.node);
  },
});
</script>

<template>
  <svg
    v-if="iconDef"
    :class="svgClass"
    :data-icon="props.name"
    :viewBox="iconDef.viewBox"
    :fill="fill"
    :stroke="stroke"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="mergedStyle"
  >
    <g v-if="opticalTransform" :transform="opticalTransform">
      <SvgNodeRenderer
        v-for="(node, index) in iconDef.extraNodes || []"
        :key="`extra-${index}`"
        :node="node"
      />
      <path v-if="iconDef.path" :d="iconDef.path" />
    </g>
    <template v-else>
      <SvgNodeRenderer
        v-for="(node, index) in iconDef.extraNodes || []"
        :key="`extra-${index}`"
        :node="node"
      />
      <path v-if="iconDef.path" :d="iconDef.path" />
    </template>
  </svg>
</template>
