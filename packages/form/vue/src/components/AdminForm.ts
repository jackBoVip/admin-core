import type { PropType, VNode } from 'vue';

import type { RenderFieldItem, ResolvedComponentBinding } from '@admin-core/form-core';

import {
  buildActionClass,
  buildFieldComponentBaseProps,
  buildFormActionButtonClass,
  buildControlStateAttrs,
  createControlledValuesBridge,
  createFormPropsSyncTracker,
  createFormApi,
  getByPath,
  getLocaleMessages,
  isFieldHiddenByState,
  isFieldRequiredMark,
  handleFormActionItemClick,
  normalizeEventValue,
  pickFormProps,
  renderTextContent,
  resolveQueryActionItems,
  resolveQueryActionsGridPlacement,
  resolveQueryInitialCollapsed,
  resolveQueryVisibleFields,
  resolveFieldComponentBinding,
  resolveFieldRuntimeContext,
  resolveFormActionPlan,
  resolveFormActionRenderItems,
  resolveGridColumnsClass,
  resolveGridColumnsStyle,
  resolveRenderedComponentContent,
} from '@admin-core/form-core';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue';

import { getVueFormAdapterRegistry } from '../registry';
import { useLocaleVersion } from '../composables/useLocaleVersion';
import type { AdminFormComponentProps } from '../types';
import { normalizeVueAttrs } from '../utils/attrs';

const VXE_TRANSFER_KEYS = new Set(['select', 'date', 'date-range', 'range', 'time']);

function shouldEnableTransfer(
  resolved: ResolvedComponentBinding<any>,
  field: RenderFieldItem
) {
  const resolvedKey = `${resolved.key ?? field.component ?? ''}`;
  if (!VXE_TRANSFER_KEYS.has(resolvedKey)) {
    return false;
  }
  if (resolved.library === 'vxe') {
    return true;
  }
  const componentName =
    (resolved.component as any)?.name ??
    (resolved.component as any)?.__name ??
    '';
  return `${componentName}`.toLowerCase().includes('vxe');
}

function isVxeResolvedComponent(resolved: ResolvedComponentBinding<any>) {
  if (resolved.library === 'vxe') {
    return true;
  }
  const componentName =
    (resolved.component as any)?.name ??
    (resolved.component as any)?.__name ??
    '';
  return `${componentName}`.toLowerCase().includes('vxe');
}

function shouldUseVxeNumberInput(
  resolved: ResolvedComponentBinding<any>,
  rawFieldProps: Record<string, any>
) {
  if (resolved.key !== 'input' || !isVxeResolvedComponent(resolved)) {
    return false;
  }
  return `${rawFieldProps?.type ?? ''}`.toLowerCase() === 'number';
}

function resolveRenderComponentSlots(
  field: RenderFieldItem,
  values: Record<string, any>,
  api: ReturnType<typeof createFormApi>
) {
  const content = resolveRenderedComponentContent({
    api,
    field,
    values,
  });
  if (!content) {
    return undefined;
  }
  const slots: Record<string, () => any> = {};
  for (const [name, value] of Object.entries(content)) {
    slots[name] = () => value;
  }
  return Object.keys(slots).length > 0 ? slots : undefined;
}

const AdminFormField = defineComponent({
  name: 'AdminFormField',
  props: {
    api: {
      required: true,
      type: Object as PropType<ReturnType<typeof createFormApi>>,
    },
    field: {
      required: true,
      type: Object as PropType<RenderFieldItem>,
    },
    fieldSlot: {
      default: undefined,
      type: Function as PropType<((context: any) => any) | undefined>,
    },
    index: {
      required: true,
      type: Number,
    },
    resolved: {
      required: true,
      type: Object as PropType<ResolvedComponentBinding<any>>,
    },
    runtimeProps: {
      required: true,
      type: Object as PropType<Record<string, any>>,
    },
  },
  setup(props) {
    const currentInstance = getCurrentInstance();
    const appComponents = currentInstance?.appContext.components ?? {};
    const vxeNumberInputComponent =
      appComponents.VxeNumberInput ??
      appComponents['vxe-number-input'];
    const modelValue = ref(getByPath(props.api.getSnapshot().values, props.field.fieldName));
    const error = ref(props.api.getSnapshot().errors[props.field.fieldName]);
    const renderComponentValues = ref(
      typeof props.field.renderComponentContent === 'function'
        ? props.api.getSnapshot().values
        : undefined
    );

    const unsubscribeValue = props.api.store.subscribeSelector(
      (state) => getByPath(state.values, props.field.fieldName),
      (nextValue) => {
        modelValue.value = nextValue;
      }
    );
    const unsubscribeError = props.api.store.subscribeSelector(
      (state) => state.errors[props.field.fieldName],
      (nextValue) => {
        error.value = nextValue;
      }
    );
    const unsubscribeRenderValues = props.api.store.subscribeSelector(
      (state) =>
        typeof props.field.renderComponentContent === 'function'
          ? state.values
          : undefined,
      (nextValue) => {
        renderComponentValues.value = nextValue as Record<string, any> | undefined;
      }
    );

    onBeforeUnmount(() => {
      unsubscribeValue();
      unsubscribeError();
      unsubscribeRenderValues();
    });

    return () => {
      const field = props.field;
      const api = props.api;
      const resolved = props.resolved;
      const runtimeProps = props.runtimeProps;
      const fieldRuntime = resolveFieldRuntimeContext({
        error: error.value,
        field,
        frameworkDefaultModelPropName: 'modelValue',
        modelValue: modelValue.value,
        resolvedModelPropName: resolved.modelPropName,
        runtimeProps,
      });
      const commonConfig = fieldRuntime.commonConfig;
      const finalModelPropName = fieldRuntime.fieldModelPropName;
      const displayModelValue = fieldRuntime.displayModelValue;
      const validateOnModelUpdate = fieldRuntime.validateOnModelUpdate;
      const validateOnChange = fieldRuntime.validateOnChange;
      const validateOnInput = fieldRuntime.validateOnInput;
      const validateOnBlur = fieldRuntime.validateOnBlur;
      const rawFieldProps = fieldRuntime.rawFieldProps;
      const updateEventName = `onUpdate:${finalModelPropName}`;
      const userOnModelUpdate = rawFieldProps[updateEventName];
      const disabled = fieldRuntime.disabled;
      const resolvedStatus = fieldRuntime.resolvedStatus;
      const controlStateAttrs = buildControlStateAttrs(resolvedStatus);
      const componentProps = {
        ...buildFieldComponentBaseProps({
          disabled,
          displayModelValue,
          field,
          modelPropName: finalModelPropName,
          rawFieldProps,
          resolvedStatus,
        }),
        [updateEventName]: async (value: any) => {
          userOnModelUpdate?.(value);
          const normalized = normalizeEventValue(value, finalModelPropName);
          await api.setFieldValue(field.fieldName, normalized, validateOnModelUpdate);
        },
        onChange: async (value: any) => {
          rawFieldProps.onChange?.(value);
          if (
            field.disabledOnChangeListener ??
            commonConfig.disabledOnChangeListener
          ) {
            return;
          }
          const normalized = normalizeEventValue(value, finalModelPropName);
          await api.setFieldValue(field.fieldName, normalized, !!validateOnChange);
        },
        onInput: async (value: any) => {
          rawFieldProps.onInput?.(value);
          if (
            field.disabledOnInputListener ??
            commonConfig.disabledOnInputListener
          ) {
            return;
          }
          const normalized = normalizeEventValue(value, finalModelPropName);
          await api.setFieldValue(field.fieldName, normalized, !!validateOnInput);
        },
        onBlur: async (event: any) => {
          rawFieldProps.onBlur?.(event);
          if (!validateOnBlur) return;
          await api.validateField(field.fieldName);
        },
      } as Record<string, any>;
      if (componentProps.transfer === undefined && shouldEnableTransfer(resolved, field)) {
        componentProps.transfer = true;
      }
      const renderComponent =
        shouldUseVxeNumberInput(resolved, rawFieldProps) && vxeNumberInputComponent
          ? toRaw(vxeNumberInputComponent as any)
          : toRaw(resolved.component as any);
      const hideLabel = fieldRuntime.hideLabel;
      const hideRequiredMark = fieldRuntime.hideRequiredMark;
      const required = isFieldRequiredMark(field) && !hideRequiredMark;
      const labelAlign = fieldRuntime.labelAlign;
      const labelWidth = fieldRuntime.labelWidth;
      const renderComponentSlots = resolveRenderComponentSlots(
        field,
        (renderComponentValues.value as Record<string, any>) ?? {},
        api
      );

      return h(
        'div',
        {
          key: `${field.fieldName}-${props.index}`,
          class: [
            'admin-form__item',
            runtimeProps.layout === 'vertical' ? 'admin-form__item--vertical' : '',
            field.hiddenByCollapse ? 'admin-form__item--hidden' : '',
            field.formItemClass || '',
          ],
        },
        [
          hideLabel
            ? null
            : h(
                'label',
                {
                  class: ['admin-form__label', field.labelClass || ''],
                  style:
                    runtimeProps.layout === 'vertical'
                      ? { textAlign: labelAlign }
                      : { textAlign: labelAlign, width: `${labelWidth}px` },
                },
                [
                  required ? h('span', { class: 'admin-form__required' }, '*') : null,
                  renderTextContent(field.label || field.fieldName),
                  field.help
                    ? h('span', { class: 'admin-form__help' }, renderTextContent(field.help))
                    : null,
                  field.colon ? ':' : null,
                ]
              ),
          h(
            'div',
            {
              ref: (element: unknown) => {
                if (element) {
                  api.registerFieldComponentRef(field.fieldName, element);
                } else {
                  api.removeFieldComponentRef(field.fieldName);
                }
              },
              ...controlStateAttrs,
              class: [
                'admin-form__control',
                resolvedStatus ? `admin-form__control--${resolvedStatus}` : '',
                field.wrapperClass || '',
              ],
            },
            [
              props.fieldSlot
                ? props.fieldSlot({
                    value: modelValue.value,
                    disabled,
                    setValue: (value: any) => api.setFieldValue(field.fieldName, value),
                    field,
                  })
                : h(renderComponent, componentProps, renderComponentSlots),
              field.suffix
                ? h('div', { class: 'admin-form__suffix' }, renderTextContent(field.suffix))
                : null,
              field.description
                ? h('div', { class: 'admin-form__hint' }, renderTextContent(field.description))
                : null,
              error.value ? h('div', { class: 'admin-form__error' }, error.value) : null,
            ]
          ),
        ]
      );
    };
  },
});

export const AdminForm = defineComponent({
  name: 'AdminForm',
  inheritAttrs: false,
  emits: ['update:values'],
  props: {
    formApi: {
      default: undefined,
      type: Object as PropType<AdminFormComponentProps['formApi']>,
    },
    onValuesChange: {
      default: undefined,
      type: Function as PropType<((values: Record<string, any>) => void) | undefined>,
    },
    values: {
      default: undefined,
      type: Object as PropType<Record<string, any> | undefined>,
    },
    visibleFieldNames: {
      default: undefined,
      type: Array as PropType<string[] | undefined>,
    },
  },
  setup(rawProps: AdminFormComponentProps, { attrs, emit, slots, expose }) {
    const initialFormProps = pickFormProps(normalizeVueAttrs(attrs as any));
    const api = rawProps.formApi ?? createFormApi(initialFormProps);
    const runtime = ref(api.getSnapshot().runtime);
    const runtimeProps = ref(api.getSnapshot().props);
    const resolvedBindingCache = new Map<string, ResolvedComponentBinding<any> | null>();
    const propsSyncTracker = createFormPropsSyncTracker();
    const controlledValuesBridge = createControlledValuesBridge<Record<string, any>>();
    const queryAutoCollapsed = ref(false);
    const renderState = computed(() => {
      void runtime.value;
      void runtimeProps.value;
      return api.getRenderState();
    });
    const visibleFieldSet = computed(() => {
      const names = runtimeProps.value.visibleFieldNames;
      if (!Array.isArray(names) || names.length === 0) {
        return null;
      }
      return new Set(names);
    });

    const unsubscribeRuntime = api.store.subscribeSelector(
      (state) => state.runtime,
      (nextValue) => {
        runtime.value = nextValue;
      }
    );
    const unsubscribeProps = api.store.subscribeSelector(
      (state) => state.props,
      (nextValue) => {
        runtimeProps.value = nextValue;
      }
    );
    const unsubscribeValues = api.store.subscribeSelector(
      (state) => state.values,
      (nextValue) => {
        if (controlledValuesBridge.isExternalSyncing()) {
          return;
        }
        if (!controlledValuesBridge.shouldEmit(nextValue)) {
          return;
        }
        controlledValuesBridge.markEmitted(nextValue);
        emit('update:values', nextValue);
        rawProps.onValuesChange?.(nextValue);
      }
    );

    watch(
      () => [normalizeVueAttrs(attrs as Record<string, any>), rawProps.visibleFieldNames] as const,
      ([normalizedAttrs, visibleFieldNames]) => {
        const nextAttrs = pickFormProps(normalizedAttrs);
        if (visibleFieldNames !== undefined) {
          nextAttrs.visibleFieldNames = visibleFieldNames;
        }
        const hasExplicitCollapsed = Object.prototype.hasOwnProperty.call(
          normalizedAttrs,
          'collapsed'
        );
        if (nextAttrs.queryMode) {
          if (!hasExplicitCollapsed && !queryAutoCollapsed.value) {
            nextAttrs.collapsed = resolveQueryInitialCollapsed({
              hasExplicitCollapsed,
              queryMode: true,
            });
            queryAutoCollapsed.value = true;
          }
        } else {
          queryAutoCollapsed.value = false;
        }
        if (!propsSyncTracker.hasChanges(nextAttrs)) {
          return;
        }
        resolvedBindingCache.clear();
        api.setState(nextAttrs);
      },
      { immediate: true }
    );
    watch(
      () => rawProps.values,
      (nextValues) => {
        if (!controlledValuesBridge.shouldSyncIncoming(nextValues, api.getSnapshot().values)) {
          return;
        }
        const incoming = controlledValuesBridge.resolveIncoming(nextValues);
        const token = controlledValuesBridge.beginExternalSync(incoming);
        void api.setValues(incoming, false).finally(() => {
          controlledValuesBridge.endExternalSync(token);
        });
      },
      { immediate: true }
    );
    watch(
      () => [runtimeProps.value.schema, runtimeProps.value.commonConfig?.modelPropName],
      () => {
        resolvedBindingCache.clear();
      }
    );

    onMounted(() => {
      api.mount();
    });

    onBeforeUnmount(() => {
      unsubscribeRuntime();
      unsubscribeProps();
      unsubscribeValues();
      if (!rawProps.formApi) {
        api.unmount();
      }
    });

    expose({
      getFormApi: () => api,
    });

    const renderField = (field: RenderFieldItem, index: number): VNode | null => {
      const fieldSlot = slots[field.fieldName];

      const registry = getVueFormAdapterRegistry();
      const { key, resolved } = resolveFieldComponentBinding({
        cache: resolvedBindingCache,
        field,
        globalModelPropName: runtimeProps.value.commonConfig?.modelPropName,
        registry,
      });

      if (!resolved) {
        return h('div', { class: 'admin-form__error' }, `Unresolved component: ${key}`);
      }

      return h(AdminFormField, {
        api,
        field,
        fieldSlot,
        index,
        resolved,
        runtimeProps: runtimeProps.value,
      });
    };

    const queryMode = computed(() => !!runtimeProps.value.queryMode);
    const localeVersion = useLocaleVersion();
    const filteredFields = computed(() =>
      renderState.value.fields.filter((field) => {
        if (visibleFieldSet.value && !visibleFieldSet.value.has(field.fieldName)) {
          return false;
        }
        if (isFieldHiddenByState(field)) {
          return false;
        }
        return true;
      })
    );
    const queryVisible = computed(() =>
      resolveQueryVisibleFields({
        collapsed: renderState.value.collapsed,
        collapsedRows: runtimeProps.value.collapsedRows,
        fields: filteredFields.value,
        gridColumns: runtimeProps.value.gridColumns,
        queryMode: queryMode.value,
      })
    );
    const fieldsToRender = computed(() =>
      queryMode.value ? queryVisible.value.fields : filteredFields.value
    );
    const actionItems = computed(() => {
      const localeTick = localeVersion.value;
      void localeTick;
      const currentProps = runtimeProps.value;
      const messages = getLocaleMessages().form;
      if (queryMode.value) {
        return resolveQueryActionItems({
          actionButtonsReverse: currentProps.actionButtonsReverse,
          collapsed: renderState.value.collapsed,
          hasOverflow: queryVisible.value.hasOverflow,
          messages,
          resetButtonOptions: currentProps.resetButtonOptions,
          showCollapseButton: currentProps.showCollapseButton,
          showDefaultActions: currentProps.showDefaultActions,
          submitButtonOptions: currentProps.submitButtonOptions,
        });
      }
      const actionPlan = resolveFormActionPlan({
        actionButtonsReverse: currentProps.actionButtonsReverse,
        collapsed: renderState.value.collapsed,
        messages,
        resetButtonOptions: currentProps.resetButtonOptions,
        showCollapseButton: currentProps.showCollapseButton,
        showDefaultActions: currentProps.showDefaultActions,
        submitButtonOptions: currentProps.submitButtonOptions,
      });
      return resolveFormActionRenderItems(actionPlan);
    });
    const hasActionItems = computed(() => actionItems.value.length > 0);
    const queryActionsPlacement = computed(() => {
      if (!queryMode.value || !hasActionItems.value) {
        return null;
      }
      return resolveQueryActionsGridPlacement({
        columns: queryVisible.value.columns,
        visibleCount: fieldsToRender.value.length,
      });
    });

    const buildActionNodes = () => {
      const handleResetAction = async () => {
        await api.resetForm();
      };

      const buttons: any[] = [];
      const pushSlotNodes = (slotName?: null | string) => {
        if (!slotName) {
          return;
        }
        const rendered = slots[slotName]?.({});
        if (rendered === null || rendered === undefined) {
          return;
        }
        if (Array.isArray(rendered)) {
          for (const node of rendered) {
            if (node === null || node === undefined) {
              continue;
            }
            buttons.push(node);
          }
          return;
        }
        buttons.push(rendered);
      };

      for (const item of actionItems.value) {
        pushSlotNodes(item.beforeSlot);

        buttons.push(
          h(
            'button',
            {
              type: 'button',
              class:
                item.kind === 'collapse'
                  ? buildFormActionButtonClass({ variant: 'collapse' })
                  : buildFormActionButtonClass({
                      className: item.options.className,
                      variant: item.variant,
                    }),
              ...(item.kind === 'button' ? item.options.attrs : {}),
              onClick: (event: Event) => {
                void handleFormActionItemClick(item, event, {
                  onCollapse: async () => {
                    const next = !api.getState().collapsed;
                    api.setState({ collapsed: next });
                  },
                  onReset: handleResetAction,
                  onSubmit: async () => {
                    await api.validateAndSubmitForm();
                  },
                });
              },
            },
            item.label
          )
        );
        pushSlotNodes(item.afterSlot);
      }
      return buttons.filter((node) => node !== null && node !== undefined);
    };

    const renderActionsOutsideGrid = () => {
      if (queryMode.value || !hasActionItems.value) {
        return null;
      }
      return h('div', { class: buildActionClass(runtimeProps.value) }, buildActionNodes());
    };

    const gridClass = computed(() => [
      'admin-form__grid',
      resolveGridColumnsClass(runtimeProps.value.gridColumns, 1),
      runtimeProps.value.wrapperClass || '',
    ]);
    const gridStyle = computed(() =>
      resolveGridColumnsStyle(runtimeProps.value.gridColumns, 1)
    );

    return () =>
      h(
        'form',
        {
          class: [
            'admin-form',
            runtimeProps.value.compact ? 'admin-form--compact' : '',
            queryMode.value ? 'admin-form--query' : '',
          ],
          onSubmit: (event: Event) => {
            event.preventDefault();
            void api.validateAndSubmitForm();
          },
          onKeydown: (event: KeyboardEvent) => {
            if (!api.getState().submitOnEnter) return;
            if (event.key !== 'Enter') return;
            if (event.target instanceof HTMLTextAreaElement) return;
            event.preventDefault();
            void api.validateAndSubmitForm();
          },
        },
        [
          h(
            'div',
            {
              class: gridClass.value,
              style: gridStyle.value,
            },
            [
              ...fieldsToRender.value
                .filter((field): field is RenderFieldItem => !!field)
                .map((field, index) => renderField(field, index)),
              queryMode.value && hasActionItems.value
                ? h(
                    'div',
                    {
                      class: [
                        'admin-form__actions-item',
                        queryActionsPlacement.value?.newRow
                          ? 'admin-form__actions-item--new-row'
                          : '',
                        runtimeProps.value.actionWrapperClass || '',
                      ],
                      style: {
                        gridColumn: queryActionsPlacement.value?.gridColumn,
                      },
                    },
                    buildActionNodes()
                  )
                : null,
            ]
          ),
          renderActionsOutsideGrid(),
          slots.default?.(),
        ]
      );
  },
});
