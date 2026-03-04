/**
 * Form Vue 原生组件映射。
 * @description 提供无 UI 库依赖的基础表单组件实现，作为适配器兜底能力。
 */
import type { Component, PropType } from 'vue';

import { defineComponent, h } from 'vue';

import {
  ADMIN_STATE_ATTR_KEYS,
  ensureDateRangeValue,
  isNativeEmptyValue,
  normalizeNativeInputValue,
  omitRecordKeys,
  pickAdminStateAttrs,
  toggleCollectionValue,
  updateDateRangeValue,
  type SemanticFormComponentType,
} from '@admin-core/form-core';

/**
 * 提取可透传给原生表单元素的属性。
 * 会剔除状态 class 与内部状态属性键，避免重复注入。
 *
 * @param attrs 组件 attrs。
 * @returns 透传后的属性对象。
 */
function getNativeForwardAttrs(attrs: Record<string, any>) {
  return omitRecordKeys(attrs, ['class', ...ADMIN_STATE_ATTR_KEYS]);
}

/**
 * 原生单选/多选选项。
 */
interface NativeChoiceOption {
  /** 显示标签。 */
  label: string;
  /** 值。 */
  value: any;
}

/**
 * 渲染原生单选/多选组所需配置。
 */
interface RenderNativeChoiceGroupOptions {
  /** 外层容器属性。 */
  attrs: Record<string, any>;
  /** 是否禁用。 */
  disabled: boolean;
  /** 输入控件类型。 */
  inputType: 'checkbox' | 'radio';
  /** 判断某个选项是否选中的函数。 */
  isChecked: (value: any) => boolean;
  /** 选项变更回调。 */
  onChange: (event: Event, option: NativeChoiceOption) => void;
  /** 选项列表。 */
  options: NativeChoiceOption[];
}

/**
 * 渲染原生单选/多选组。
 *
 * @param options 渲染配置。
 * @returns 渲染后的虚拟节点。
 */
function renderNativeChoiceGroup(options: RenderNativeChoiceGroupOptions) {
  const attrs = options.attrs;

  return h(
    'div',
    {
      ...getNativeForwardAttrs(attrs),
      ...pickAdminStateAttrs(attrs),
      class: ['admin-form__choice-group', attrs.class],
    },
    options.options.map((option) =>
      h(
        'label',
        {
          class: ['admin-form__choice', options.disabled ? 'admin-form__choice--disabled' : ''],
          key: String(option.value),
        },
        [
          h('input', {
            ...pickAdminStateAttrs(attrs),
            class: 'admin-form__choice-input',
            type: options.inputType,
            disabled: options.disabled,
            checked: options.isChecked(option.value),
            value: option.value,
            onChange: (event: Event) => {
              options.onChange(event, option);
            },
          }),
          option.label,
        ]
      )
    )
  );
}

/**
 * 原生单行输入组件。
 */
const NativeInput = defineComponent({
  name: 'AdminNativeInput',
  props: {
    disabled: Boolean,
    modelValue: {
      type: [String, Number],
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
  },
  emits: ['update:modelValue', 'change', 'input'],
  /**
   * 原生输入框组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...getNativeForwardAttrs(attrs as any),
        ...pickAdminStateAttrs(attrs as any),
        class: ['admin-form__input', (attrs as any).class],
        disabled: props.disabled,
        placeholder: props.placeholder,
        type: props.type,
        value: normalizeNativeInputValue(props.modelValue),
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value;
          emit('update:modelValue', value);
          emit('input', event);
        },
        onChange: (event: Event) => emit('change', event),
      });
  },
});

/**
 * 原生多行文本输入组件。
 */
const NativeTextarea = defineComponent({
  name: 'AdminNativeTextarea',
  props: {
    disabled: Boolean,
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'change', 'input'],
  /**
   * 原生文本域组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      h('textarea', {
        ...getNativeForwardAttrs(attrs as any),
        ...pickAdminStateAttrs(attrs as any),
        class: ['admin-form__textarea', (attrs as any).class],
        disabled: props.disabled,
        placeholder: props.placeholder,
        value: normalizeNativeInputValue(props.modelValue),
        onInput: (event: Event) => {
          const value = (event.target as HTMLTextAreaElement).value;
          emit('update:modelValue', value);
          emit('input', event);
        },
        onChange: (event: Event) => emit('change', event),
      });
  },
});

/**
 * 原生下拉选择组件。
 */
const NativeSelect = defineComponent({
  name: 'AdminNativeSelect',
  props: {
    disabled: Boolean,
    modelValue: {
      type: [String, Number],
      default: '',
    },
    options: {
      type: Array as PropType<NativeChoiceOption[]>,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'change'],
  /**
   * 原生下拉选择组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: ['admin-form__select', (attrs as any).class],
          disabled: props.disabled,
          value: normalizeNativeInputValue(props.modelValue),
          'data-admin-empty': isNativeEmptyValue(props.modelValue) ? 'true' : undefined,
          onChange: (event: Event) => {
            const value = (event.target as HTMLSelectElement).value;
            emit('update:modelValue', value);
            emit('change', event);
          },
        },
        [
          props.placeholder
            ? h(
                'option',
                {
                  value: '',
                  disabled: true,
                },
                props.placeholder
              )
            : null,
          ...props.options.map((option) =>
            h(
              'option',
              {
                key: option.value,
                value: option.value,
              },
              option.label
            )
          ),
        ]
      );
  },
});

/**
 * 原生单个复选框组件。
 */
const NativeCheckbox = defineComponent({
  name: 'AdminNativeCheckbox',
  props: {
    checked: Boolean,
    disabled: Boolean,
  },
  emits: ['update:checked', 'change'],
  /**
   * 原生复选框组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'label',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: [
            'admin-form__choice',
            props.disabled ? 'admin-form__choice--disabled' : '',
            (attrs as any).class,
          ],
        },
        [
          h('input', {
            ...pickAdminStateAttrs(attrs as any),
            class: 'admin-form__choice-input',
            type: 'checkbox',
            disabled: props.disabled,
            checked: props.checked,
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked;
              emit('update:checked', checked);
              emit('change', event);
            },
          }),
          slots.default?.(),
        ]
      );
  },
});

/**
 * 原生开关组件。
 */
const NativeSwitch = defineComponent({
  name: 'AdminNativeSwitch',
  props: {
    checked: Boolean,
    disabled: Boolean,
  },
  emits: ['update:checked', 'change'],
  /**
   * 原生开关组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'label',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: [
            'admin-form__switch',
            props.disabled ? 'admin-form__switch--disabled' : '',
            (attrs as any).class,
          ],
        },
        [
          h('input', {
            ...pickAdminStateAttrs(attrs as any),
            class: 'admin-form__switch-input',
            type: 'checkbox',
            disabled: props.disabled,
            checked: props.checked,
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked;
              emit('update:checked', checked);
              emit('change', event);
            },
          }),
          h('span', { class: 'admin-form__switch-track' }, [
            h('span', { class: 'admin-form__switch-thumb' }),
          ]),
          slots.default ? h('span', { class: 'admin-form__switch-label' }, slots.default()) : null,
        ]
      );
  },
});

/**
 * 原生复选框组组件。
 */
const NativeCheckboxGroup = defineComponent({
  name: 'AdminNativeCheckboxGroup',
  props: {
    disabled: Boolean,
    modelValue: {
      type: Array as () => any[],
      default: () => [],
    },
    options: {
      type: Array as PropType<NativeChoiceOption[]>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'change'],
  /**
   * 原生复选框组组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      renderNativeChoiceGroup({
        attrs: attrs as any,
        disabled: props.disabled,
        options: props.options,
        inputType: 'checkbox',
        isChecked: (value) => props.modelValue.includes(value),
        onChange: (event, option) => {
          const values = toggleCollectionValue(
            props.modelValue,
            option.value,
            (event.target as HTMLInputElement).checked
          );
          emit('update:modelValue', values);
          emit('change', values);
        },
      });
  },
});

/**
 * 原生单个单选框组件。
 */
const NativeRadio = defineComponent({
  name: 'AdminNativeRadio',
  props: {
    checked: Boolean,
    disabled: Boolean,
    value: {
      type: [String, Number, Boolean],
      default: '',
    },
  },
  emits: ['update:checked', 'change'],
  /**
   * 原生单选框组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'label',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: [
            'admin-form__choice',
            props.disabled ? 'admin-form__choice--disabled' : '',
            (attrs as any).class,
          ],
        },
        [
          h('input', {
            ...pickAdminStateAttrs(attrs as any),
            class: 'admin-form__choice-input',
            type: 'radio',
            disabled: props.disabled,
            checked: props.checked,
            value: props.value,
            onChange: (event: Event) => {
              const checked = (event.target as HTMLInputElement).checked;
              emit('update:checked', checked);
              emit('change', event);
            },
          }),
          slots.default?.(),
        ]
      );
  },
});

/**
 * 原生单选框组组件。
 */
const NativeRadioGroup = defineComponent({
  name: 'AdminNativeRadioGroup',
  props: {
    disabled: Boolean,
    modelValue: {
      type: [String, Number],
      default: '',
    },
    options: {
      type: Array as PropType<NativeChoiceOption[]>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'change'],
  /**
   * 原生单选框组组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      renderNativeChoiceGroup({
        attrs: attrs as any,
        disabled: props.disabled,
        options: props.options,
        inputType: 'radio',
        isChecked: (value) => props.modelValue === value,
        onChange: (event) => {
          const value = (event.target as HTMLInputElement).value;
          emit('update:modelValue', value);
          emit('change', value);
        },
      });
  },
});

/**
 * 原生按钮组件。
 */
const NativeButton = defineComponent({
  name: 'AdminNativeButton',
  props: {
    disabled: Boolean,
    type: {
      type: String,
      default: 'button',
    },
    variant: {
      type: String,
      default: 'default',
    },
  },
  /**
   * 原生按钮组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: props.type,
          disabled: props.disabled,
          class: [
            'admin-form__button',
            props.variant === 'primary' ? 'admin-form__button--primary' : '',
            attrs.class,
          ],
        },
        slots.default?.()
      );
  },
});

/**
 * 原生日期/时间输入组件。
 */
const NativeDateInput = defineComponent({
  name: 'AdminNativeDateInput',
  props: {
    disabled: Boolean,
    modelValue: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'date',
    },
  },
  emits: ['update:modelValue', 'change'],
  /**
   * 原生日期时间输入组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...getNativeForwardAttrs(attrs as any),
        ...pickAdminStateAttrs(attrs as any),
        class: ['admin-form__input', (attrs as any).class],
        disabled: props.disabled,
        type: props.type,
        value: normalizeNativeInputValue(props.modelValue),
        onChange: (event: Event) => {
          const value = (event.target as HTMLInputElement).value;
          emit('update:modelValue', value);
          emit('change', value);
        },
      });
  },
});

/**
 * 原生区间输入组件。
 */
const NativeRange = defineComponent({
  name: 'AdminNativeRange',
  props: {
    disabled: Boolean,
    modelValue: {
      type: Array as unknown as PropType<[string, string]>,
      default: () => ['', ''] as [string, string],
    },
  },
  emits: ['update:modelValue', 'change', 'input'],
  /**
   * 原生区间输入组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { emit, attrs }) {
    /**
     * 更新区间指定端点并派发事件。
     *
     * @param index 端点索引（`0` 起始端，`1` 结束端）。
     * @param event 原生输入事件。
     * @param eventName 需要派发的事件名称。
     * @returns 无返回值。
     */
    function updateAt(index: 0 | 1, event: Event, eventName: 'change' | 'input') {
      const next = updateDateRangeValue(
        ensureDateRangeValue(props.modelValue),
        index,
        (event.target as HTMLInputElement).value
      );
      emit('update:modelValue', next);
      emit(eventName, next);
    }

    return () =>
      h(
        'div',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: ['admin-form__range', (attrs as any).class],
        },
        [
        h('input', {
          ...pickAdminStateAttrs(attrs as any),
          class: 'admin-form__input',
          type: (attrs as any).startType ?? (attrs as any).type ?? 'text',
          disabled: props.disabled,
          placeholder: (attrs as any).startPlaceholder,
          value: normalizeNativeInputValue(props.modelValue?.[0]),
          onInput: (event: Event) => updateAt(0, event, 'input'),
          onChange: (event: Event) => updateAt(0, event, 'change'),
        }),
        h('span', { class: 'admin-form__range-separator' }, (attrs as any).separator ?? '~'),
        h('input', {
          ...pickAdminStateAttrs(attrs as any),
          class: 'admin-form__input',
          type: (attrs as any).endType ?? (attrs as any).type ?? 'text',
          disabled: props.disabled,
          placeholder: (attrs as any).endPlaceholder,
          value: normalizeNativeInputValue(props.modelValue?.[1]),
          onInput: (event: Event) => updateAt(1, event, 'input'),
          onChange: (event: Event) => updateAt(1, event, 'change'),
        }),
        ]
      );
  },
});

/**
 * 原生分区标题组件。
 */
const NativeSectionTitle = defineComponent({
  inheritAttrs: false,
  name: 'AdminNativeSectionTitle',
  props: {
    description: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
  /**
   * 原生分区标题组件组合逻辑。
   *
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { attrs }) {
    return () =>
      h(
        'div',
        {
          class: ['admin-form__section', (attrs as any).class],
        },
        [
          props.title ? h('h4', { class: 'admin-form__section-title' }, props.title) : null,
          props.description
            ? h('div', { class: 'admin-form__section-description' }, props.description)
            : null,
        ]
      );
  },
});

/**
 * Vue 原生适配组件映射表。
 * @description 将语义组件类型映射到可渲染的 Vue 组件实现。
 */
export const nativeVueComponents: Partial<Record<SemanticFormComponentType, Component>> = {
  checkbox: NativeCheckbox,
  'checkbox-group': NativeCheckboxGroup,
  date: NativeDateInput,
  'date-range': defineComponent({
    name: 'AdminNativeDateRange',
    /**
     * 原生日期区间包装组件组合逻辑。
     *
     * @param _props 组件属性。
     * @param context 组件上下文。
     * @returns 渲染函数。
     */
    setup(_, { attrs }) {
      return () => h(NativeRange, { ...attrs, type: 'date' });
    },
  }),
  'default-button': NativeButton,
  input: NativeInput,
  password: defineComponent({
    name: 'AdminNativePassword',
    /**
     * 原生密码输入包装组件组合逻辑。
     *
     * @param _props 组件属性。
     * @param context 组件上下文。
     * @returns 渲染函数。
     */
    setup(_, { attrs }) {
      return () => h(NativeInput, { ...attrs, type: 'password' });
    },
  }),
  'primary-button': defineComponent({
    name: 'AdminNativePrimaryButton',
    /**
     * 原生主按钮包装组件组合逻辑。
     *
     * @param _props 组件属性。
     * @param context 组件上下文。
     * @returns 渲染函数。
     */
    setup(_, { attrs, slots }) {
      return () =>
        h(
          NativeButton,
          {
            ...attrs,
            variant: 'primary',
          },
          slots
        );
    },
  }),
  radio: NativeRadio,
  'radio-group': NativeRadioGroup,
  range: NativeRange,
  'section-title': NativeSectionTitle,
  select: NativeSelect,
  switch: NativeSwitch,
  textarea: NativeTextarea,
  time: defineComponent({
    name: 'AdminNativeTimeInput',
    /**
     * 原生时间输入包装组件组合逻辑。
     *
     * @param _props 组件属性。
     * @param context 组件上下文。
     * @returns 渲染函数。
     */
    setup(_, { attrs }) {
      return () => h(NativeDateInput, { ...attrs, type: 'time' });
    },
  }),
};
