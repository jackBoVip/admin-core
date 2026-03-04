/**
 * Vue 图标组件。
 * @description 将图标名解析为 SVG 字符串并渲染为可复用组件。
 */

import { getIcon, getIconSize, type IconName, type IconSize } from '@admin-core/preferences';
import { defineComponent, h, computed, type PropType, type ExtractPropTypes } from 'vue';

/**
 * 图标组件 Props 定义。
 * @description 约束图标名称、尺寸、颜色与样式类名输入。
 */
export const iconProps = {
  /** 图标名称 */
  name: {
    type: String as PropType<IconName>,
    required: true as const,
  },
  /** 图标尺寸 */
  size: {
    type: [String, Number] as PropType<IconSize | number>,
    default: 'md',
  },
  /** 自定义颜色 */
  color: {
    type: String,
    default: 'currentColor',
  },
  /** 自定义类名 */
  class: {
    type: String,
    default: '',
  },
};

/**
 * 图标组件 Props 类型。
 * @description 基于 `iconProps` 推导得到的标准化类型。
 */
export type IconProps = ExtractPropTypes<typeof iconProps>;

/**
 * 图标组件。
 * @description 提供统一尺寸与颜色控制的 SVG 图标渲染能力。
 */
export const Icon = defineComponent({
  name: 'AdminIcon',
  props: iconProps,
  /**
   * 图标渲染逻辑。
   * @param props 组件属性。
   * @returns 渲染函数。
   */
  setup(props) {
    /**
     * SVG 字符串内容。
     * @description 根据图标名称从核心图标注册表读取并缓存。
     */
    const svgContent = computed(() => getIcon(props.name));
    /**
     * 规范化后的图标尺寸。
     * @description 支持数字与预设尺寸混用，最终统一为像素值。
     */
    const sizeValue = computed(() => getIconSize(props.size));

    return () =>
      h('span', {
        class: props.class ? `admin-icon ${props.class}` : 'admin-icon',
        style: {
          display: 'inline-flex',
          width: `${sizeValue.value}px`,
          height: `${sizeValue.value}px`,
          color: props.color,
        },
        innerHTML: svgContent.value,
      });
  },
});

/**
 * 默认导出图标组件。
 */
export default Icon;
