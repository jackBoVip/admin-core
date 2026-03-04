/**
 * Vue 布局图标组件。
 * @description 根据布局类型渲染预览图标，并支持选中态样式反馈。
 */

import {
  getLayoutIcon,
  layoutIconTokens,
  borderTokens,
  radiusTokens,
  transitionTokens,
  type LayoutType,
} from '@admin-core/preferences';
import { defineComponent, h, computed, type PropType, type ExtractPropTypes } from 'vue';

/**
 * 布局图标组件 Props 定义。
 * @description 约束布局类型、尺寸与选中态等输入参数。
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
 * 布局图标组件 Props 类型。
 * @description 基于 `layoutIconProps` 推导得到的标准化类型。
 */
export type LayoutIconProps = ExtractPropTypes<typeof layoutIconProps>;

/**
 * 布局图标组件。
 * @description 渲染可点击的布局预览图标，并在点击时抛出布局类型。
 */
export const LayoutIcon = defineComponent({
  name: 'AdminLayoutIcon',
  props: layoutIconProps,
  emits: ['click'],
  /**
   * 布局图标渲染逻辑。
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit }) {
    /**
     * 当前布局对应的 SVG 内容。
     * @description 从核心布局图标工厂读取，随 `layout` 变化更新。
     */
    const svgContent = computed(() => getLayoutIcon(props.layout));

    /**
     * 规范化后的宽度值。
     * @description 数字输入自动补齐 `px` 单位，字符串保持原值。
     */
    const widthValue = computed(() =>
      typeof props.width === 'number' ? `${props.width}px` : props.width
    );

    /**
     * 规范化后的高度值。
     * @description 数字输入自动补齐 `px` 单位，字符串保持原值。
     */
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

/**
 * 默认导出布局预览图标组件。
 */
export default LayoutIcon;
