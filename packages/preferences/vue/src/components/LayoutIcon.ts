/**
 * Vue 布局图标组件
 * @description 显示布局预览图标
 */

import { defineComponent, h, computed, type PropType, type ExtractPropTypes } from 'vue';
import {
  getLayoutIcon,
  layoutIconTokens,
  borderTokens,
  radiusTokens,
  transitionTokens,
  type LayoutType,
} from '@admin-core/preferences';

/**
 * LayoutIcon 组件 Props 定义
 */
export const layoutIconProps = {
  /** 布局类型 */
  layout: {
    type: String as PropType<LayoutType>,
    required: true as const,
  },
  /** 宽度 */
  width: {
    type: [String, Number] as PropType<string | number>,
    default: layoutIconTokens.width,
  },
  /** 高度 */
  height: {
    type: [String, Number] as PropType<string | number>,
    default: layoutIconTokens.height,
  },
  /** 是否选中 */
  active: {
    type: Boolean,
    default: false,
  },
  /** 自定义类名 */
  class: {
    type: String,
    default: '',
  },
};

/**
 * LayoutIcon 组件 Props 类型
 */
export type LayoutIconProps = ExtractPropTypes<typeof layoutIconProps>;

/**
 * 布局图标组件
 */
export const LayoutIcon = defineComponent({
  name: 'AdminLayoutIcon',
  props: layoutIconProps,
  emits: ['click'],
  setup(props, { emit }) {
    const svgContent = computed(() => getLayoutIcon(props.layout));

    const widthValue = computed(() =>
      typeof props.width === 'number' ? `${props.width}px` : props.width
    );

    const heightValue = computed(() =>
      typeof props.height === 'number' ? `${props.height}px` : props.height
    );

    return () =>
      h(
        'div',
        {
          class: (() => {
            const classes: string[] = ['admin-layout-icon'];
            if (props.active) classes.push('admin-layout-icon--active');
            if (props.class) classes.push(props.class as string);
            return classes.join(' ');
          })(),
          'data-state': props.active ? 'active' : 'inactive',
          style: {
            display: 'inline-flex',
            width: widthValue.value,
            height: heightValue.value,
            cursor: 'pointer',
            borderRadius: `var(--radius, ${radiusTokens.defaultPx}px)`,
            border: props.active
              ? `${borderTokens.activeWidth}px solid var(--primary)`
              : `${borderTokens.activeWidth}px solid transparent`,
            transition: `border-color ${transitionTokens.normal}ms`,
          },
          onClick: () => emit('click', props.layout),
          innerHTML: svgContent.value,
        }
      );
  },
});

export default LayoutIcon;
