<script setup lang="ts">
import { computed, defineComponent, h, type VNode } from 'vue';
import type { PropType } from 'vue';
import {
  getLayoutUiIconDefinition,
  resolveLayoutIconSize,
  type LayoutUiIconName,
  type SvgNode,
} from '@admin-core/layout';

/**
 * `LayoutIcon` 组件入参。
 * @description 定义图标名称、尺寸以及透传的样式类名配置。
 */
const props = defineProps<{
  /** 图标名称。 */
  name: LayoutUiIconName;
  /** 图标尺寸，可传预设值或 CSS 长度字符串。 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  /** 额外样式类名。 */
  className?: string;
  /** 额外内联样式。 */
  style?: Record<string, string> | string;
}>();

/** 当前图标定义。 */
const iconDef = computed(() => getLayoutUiIconDefinition(props.name));

/** 尺寸对应的类名。 */
const sizeClass = computed(() => {
  return resolveLayoutIconSize(props.size);
});

/** 将传入尺寸解析为 SVG 宽高值。 */
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

/** 合并最终 SVG class。 */
const svgClass = computed(() => {
  if (props.className) return `${sizeClass.value} ${props.className}`;
  return sizeClass.value;
});

/** 合并最终 SVG style。 */
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

/** 图标填充色策略。 */
const fill = computed(() => (iconDef.value?.fill ? 'currentColor' : 'none'));
/** 图标描边色策略。 */
const stroke = computed(() => (iconDef.value?.fill ? 'none' : 'currentColor'));
/** 光学缩放变换字符串。 */
const opticalTransform = computed(() => {
  const scale = iconDef.value?.opticalScale;
  if (!scale || scale === 1) return '';
  return `translate(12 12) scale(${scale}) translate(-12 -12)`;
});

/**
 * 递归渲染 `SvgNode` 树为 Vue `VNode`。
 * @param node 当前节点定义。
 * @param key VNode 键值。
 * @returns 渲染后的 `VNode`。
 */
function renderSvgNode(node: SvgNode, key?: string | number): VNode {
  const children = node.children?.map((child, index) =>
    renderSvgNode(child, `${node.tag}-${index}`)
  );
  return h(node.tag, { ...(node.attrs ?? {}), key }, children);
}

/**
 * `SvgNode` 递归渲染组件。
 * @description 用于在模板中渲染动态 SVG 节点数组。
 */
const SvgNodeRenderer = defineComponent({
  name: 'SvgNodeRenderer',
  props: {
    node: {
      type: Object as PropType<SvgNode>,
      required: true,
    },
  },
  /**
   * `SvgNode` 渲染器 setup。
   * @param props 组件属性。
   * @returns 渲染函数。
   */
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
