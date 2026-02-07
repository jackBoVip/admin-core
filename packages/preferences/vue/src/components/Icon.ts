/**
 * Vue Icon 组件
 * @description 将 SVG 字符串渲染为组件
 */

import { getIcon, getIconSize, type IconName, type IconSize } from '@admin-core/preferences';
import { defineComponent, h, computed, type PropType, type ExtractPropTypes } from 'vue';

/**
 * Icon 组件 Props 定义
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
 * Icon 组件 Props 类型
 */
export type IconProps = ExtractPropTypes<typeof iconProps>;

/**
 * 图标组件
 */
export const Icon = defineComponent({
  name: 'AdminIcon',
  props: iconProps,
  setup(props) {
    const svgContent = computed(() => getIcon(props.name));
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

export default Icon;
