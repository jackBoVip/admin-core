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

function getNativeForwardAttrs(attrs: Record<string, any>) {
  return omitRecordKeys(attrs, ['class', ...ADMIN_STATE_ATTR_KEYS]);
}

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

const NativeSelect = defineComponent({
  name: 'AdminNativeSelect',
  props: {
    disabled: Boolean,
    modelValue: {
      type: [String, Number],
      default: '',
    },
    options: {
      type: Array as () => Array<{ label: string; value: any }>,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'change'],
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

const NativeCheckbox = defineComponent({
  name: 'AdminNativeCheckbox',
  props: {
    checked: Boolean,
    disabled: Boolean,
  },
  emits: ['update:checked', 'change'],
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

const NativeSwitch = defineComponent({
  name: 'AdminNativeSwitch',
  props: {
    checked: Boolean,
    disabled: Boolean,
  },
  emits: ['update:checked', 'change'],
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

const NativeCheckboxGroup = defineComponent({
  name: 'AdminNativeCheckboxGroup',
  props: {
    disabled: Boolean,
    modelValue: {
      type: Array as () => any[],
      default: () => [],
    },
    options: {
      type: Array as () => Array<{ label: string; value: any }>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'div',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: ['admin-form__choice-group', (attrs as any).class],
        },
        props.options.map((option) =>
          h(
            'label',
            {
              class: ['admin-form__choice', props.disabled ? 'admin-form__choice--disabled' : ''],
              key: String(option.value),
            },
            [
              h('input', {
                ...pickAdminStateAttrs(attrs as any),
                class: 'admin-form__choice-input',
                type: 'checkbox',
                disabled: props.disabled,
                checked: props.modelValue.includes(option.value),
                onChange: (event: Event) => {
                  const values = toggleCollectionValue(
                    props.modelValue,
                    option.value,
                    (event.target as HTMLInputElement).checked
                  );
                  emit('update:modelValue', values);
                  emit('change', values);
                },
              }),
              option.label,
            ]
          )
        )
      );
  },
});

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

const NativeRadioGroup = defineComponent({
  name: 'AdminNativeRadioGroup',
  props: {
    disabled: Boolean,
    modelValue: {
      type: [String, Number],
      default: '',
    },
    options: {
      type: Array as () => Array<{ label: string; value: any }>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'div',
        {
          ...getNativeForwardAttrs(attrs as any),
          ...pickAdminStateAttrs(attrs as any),
          class: ['admin-form__choice-group', (attrs as any).class],
        },
        props.options.map((option) =>
          h(
            'label',
            {
              class: ['admin-form__choice', props.disabled ? 'admin-form__choice--disabled' : ''],
              key: String(option.value),
            },
            [
              h('input', {
                ...pickAdminStateAttrs(attrs as any),
                class: 'admin-form__choice-input',
                type: 'radio',
                disabled: props.disabled,
                checked: props.modelValue === option.value,
                value: option.value,
                onChange: (event: Event) => {
                  const value = (event.target as HTMLInputElement).value;
                  emit('update:modelValue', value);
                  emit('change', value);
                },
              }),
              option.label,
            ]
          )
        )
      );
  },
});

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
  setup(props, { emit, attrs }) {
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

export const nativeVueComponents: Partial<Record<SemanticFormComponentType, Component>> = {
  checkbox: NativeCheckbox,
  'checkbox-group': NativeCheckboxGroup,
  date: NativeDateInput,
  'date-range': defineComponent({
    name: 'AdminNativeDateRange',
    setup(_, { attrs }) {
      return () => h(NativeRange, { ...attrs, type: 'date' });
    },
  }),
  'default-button': NativeButton,
  input: NativeInput,
  password: defineComponent({
    name: 'AdminNativePassword',
    setup(_, { attrs }) {
      return () => h(NativeInput, { ...attrs, type: 'password' });
    },
  }),
  'primary-button': defineComponent({
    name: 'AdminNativePrimaryButton',
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
    setup(_, { attrs }) {
      return () => h(NativeDateInput, { ...attrs, type: 'time' });
    },
  }),
};
