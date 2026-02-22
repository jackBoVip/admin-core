

import type { RenderFieldItem 
 
 
 
} from '@admin-core/form-core';
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
  splitRenderedComponentContent,
  type AdminFormApi,
  type ResolvedComponentBinding 
 
 
 
} from '@admin-core/form-core';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getReactFormAdapterRegistry } from '../registry';
import { useLocaleVersion } from '../hooks/useLocaleVersion';
import type { AdminFormReactProps } from '../types';
import type { CSSProperties, KeyboardEvent, ReactElement } from 'react';

const ANTD_POPUP_KEYS = new Set(['date', 'date-range', 'range', 'select', 'time']);

function shouldInjectAntdPopupProps(
  resolved: ResolvedComponentBinding<any>,
  field: RenderFieldItem
) {
  if (resolved.library !== 'antd') {
    return false;
  }
  const resolvedKey = `${resolved.key ?? field.component ?? ''}`;
  return ANTD_POPUP_KEYS.has(resolvedKey);
}

function resolvePopupContainer() {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.body;
}

function asRecord(value: any): Record<string, any> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, any>;
}

function normalizeAntdPopupProps(componentProps: Record<string, any>) {
  const defaultPopupClassName = 'admin-form-popup';
  const defaultPopupStyle = {
    zIndex: 'var(--admin-form-page-popup-z-index, 2300)',
  };

  const userPopupClassName = componentProps.popupClassName ?? componentProps.dropdownClassName;
  const userPopupStyle = componentProps.popupStyle ?? componentProps.dropdownStyle;

  const classNames = asRecord(componentProps.classNames);
  const popupClassNames = asRecord(classNames?.popup);
  const popupRootClassName =
    popupClassNames?.root ?? userPopupClassName ?? defaultPopupClassName;
  componentProps.classNames = {
    ...(classNames ?? {}),
    popup: {
      ...(popupClassNames ?? {}),
      root: popupRootClassName,
    },
  };

  const styles = asRecord(componentProps.styles);
  const popupStyles = asRecord(styles?.popup);
  const popupRootStyle = popupStyles?.root ?? userPopupStyle ?? defaultPopupStyle;
  componentProps.styles = {
    ...(styles ?? {}),
    popup: {
      ...(popupStyles ?? {}),
      root: popupRootStyle,
    },
  };

  delete componentProps.popupClassName;
  delete componentProps.dropdownClassName;
  delete componentProps.popupStyle;
  delete componentProps.dropdownStyle;
}

function sanitizeReactInteropProps(
  componentProps: Record<string, any>,
  modelPropName: string
) {
  for (const key of Object.keys(componentProps)) {
    if (key.startsWith('onUpdate:') || key.includes(':')) {
      delete componentProps[key];
    }
  }
  if (modelPropName !== 'modelValue' && Object.prototype.hasOwnProperty.call(componentProps, 'modelValue')) {
    if (modelPropName === 'value' && componentProps.value === undefined) {
      componentProps.value = componentProps.modelValue;
    }
    delete componentProps.modelValue;
  }
}

function useFormSelector<TSlice>(
  api: AdminFormApi,
  selector: (snapshot: ReturnType<AdminFormApi['getSnapshot']>) => TSlice,
  isEqual: (a: TSlice, b: TSlice) => boolean = Object.is
) {
  const [slice, setSlice] = useState(() => selector(api.getSnapshot()));

  useEffect(() => {
    return api.store.subscribeSelector(selector, (nextSlice) => {
      setSlice((previous) => (isEqual(previous, nextSlice) ? previous : nextSlice));
    }, isEqual);
  }, [api, selector, isEqual]);

  return slice;
}


interface FormFieldItemProps {
  api: AdminFormApi;
  field: RenderFieldItem;
  index: number;
  resolved: ResolvedComponentBinding<any>;
  runtimeProps: Record<string, any>;
}

const FormFieldItem = memo(function FormFieldItem({
  api,
  field,
  index,
  resolved,
  runtimeProps,
}: FormFieldItemProps) {
  const modelValue = useFormSelector(
    api,
    useCallback((snapshot) => getByPath(snapshot.values, field.fieldName), [field.fieldName])
  );
  const error = useFormSelector(
    api,
    useCallback((snapshot) => snapshot.errors[field.fieldName], [field.fieldName])
  );
  const renderContentValues = useFormSelector(
    api,
    useCallback(
      (snapshot) =>
        typeof field.renderComponentContent === 'function' ? snapshot.values : undefined,
      [field.renderComponentContent]
    )
  );
  const Component = resolved.component as any;
  const fieldRuntime = resolveFieldRuntimeContext({
    error,
    field,
    frameworkDefaultModelPropName: 'value',
    modelValue,
    resolvedModelPropName: resolved.modelPropName,
    runtimeProps,
  });
  const modelPropName = fieldRuntime.fieldModelPropName;
  const displayModelValue = fieldRuntime.displayModelValue;
  const validateOnChange = fieldRuntime.validateOnChange;
  const validateOnInput = fieldRuntime.validateOnInput;
  const validateOnBlur = fieldRuntime.validateOnBlur;
  const rawFieldProps = fieldRuntime.rawFieldProps;
  const userOnChange = rawFieldProps.onChange;
  const userOnInput = rawFieldProps.onInput;
  const userOnBlur = rawFieldProps.onBlur;
  const commonFieldConfig = fieldRuntime.commonConfig;
  const disabled = fieldRuntime.disabled;
  const resolvedStatus = fieldRuntime.resolvedStatus;
  const renderedContent = resolveRenderedComponentContent({
    api,
    field,
    values: (renderContentValues as Record<string, any>) ?? {},
  });
  const { defaultContent: componentChildren, renderComponentProps } =
    splitRenderedComponentContent(renderedContent);

  const componentProps = {
    ...buildFieldComponentBaseProps({
      disabled,
      displayModelValue,
      field,
      modelPropName,
      rawFieldProps,
      resolvedStatus,
    }),
    ...(renderComponentProps ?? {}),
    onChange: async (value: any) => {
      userOnChange?.(value);
      if (field.disabledOnChangeListener ?? commonFieldConfig.disabledOnChangeListener) {
        return;
      }
      const normalized = normalizeEventValue(value, modelPropName);
      await api.setFieldValue(field.fieldName, normalized, !!validateOnChange);
    },
    onInput: async (value: any) => {
      userOnInput?.(value);
      if (field.disabledOnInputListener ?? commonFieldConfig.disabledOnInputListener) {
        return;
      }
      const normalized = normalizeEventValue(value, modelPropName);
      await api.setFieldValue(field.fieldName, normalized, !!validateOnInput);
    },
    onBlur: async (event: any) => {
      userOnBlur?.(event);
      if (!validateOnBlur) return;
      await api.validateField(field.fieldName);
    },
  } as Record<string, any>;
  sanitizeReactInteropProps(componentProps, modelPropName);
  if (shouldInjectAntdPopupProps(resolved, field)) {
    if (componentProps.getPopupContainer === undefined) {
      componentProps.getPopupContainer = resolvePopupContainer;
    }
    normalizeAntdPopupProps(componentProps);
  }
  const hideLabel = fieldRuntime.hideLabel;
  const hideRequiredMark = fieldRuntime.hideRequiredMark;
  const required = isFieldRequiredMark(field) && !hideRequiredMark;
  const labelAlign = fieldRuntime.labelAlign;
  const labelWidth = fieldRuntime.labelWidth;
  const labelStyle: CSSProperties | undefined =
    runtimeProps.layout === 'vertical'
      ? { textAlign: labelAlign }
      : { textAlign: labelAlign, width: `${labelWidth}px` };

  return (
    <div
      key={`${field.fieldName}-${index}`}
      className={[
        'admin-form__item',
        runtimeProps.layout === 'vertical' ? 'admin-form__item--vertical' : '',
        field.hiddenByCollapse ? 'admin-form__item--hidden' : '',
        field.formItemClass ?? '',
      ].join(' ')}
    >
      {hideLabel ? null : (
        <label
          className={['admin-form__label', field.labelClass ?? ''].join(' ')}
          style={labelStyle}
        >
          {required ? <span className="admin-form__required">*</span> : null}
          {renderTextContent(field.label || field.fieldName)}
          {field.help ? <span className="admin-form__help">{renderTextContent(field.help)}</span> : null}
          {field.colon ? ':' : null}
        </label>
      )}
      <div
        ref={(element) => {
          if (element) {
            api.registerFieldComponentRef(field.fieldName, element);
          } else {
            api.removeFieldComponentRef(field.fieldName);
          }
        }}
        className={[
          'admin-form__control',
          resolvedStatus ? `admin-form__control--${resolvedStatus}` : '',
          field.wrapperClass ?? '',
        ].join(' ')}
        {...buildControlStateAttrs(resolvedStatus)}
      >
        <Component {...componentProps}>{componentChildren}</Component>
        {field.suffix ? <div className="admin-form__suffix">{renderTextContent(field.suffix)}</div> : null}
        {field.description ? (
          <div className="admin-form__hint">{renderTextContent(field.description)}</div>
        ) : null}
        {error ? <div className="admin-form__error">{error}</div> : null}
      </div>
    </div>
  );
},
(previous, next) =>
  previous.api === next.api &&
  previous.field === next.field &&
  previous.index === next.index &&
  previous.resolved === next.resolved &&
  previous.runtimeProps === next.runtimeProps
);

export const AdminForm = memo(function AdminForm(props: AdminFormReactProps) {
  const api = useMemo(
    () => props.formApi ?? createFormApi(pickFormProps(props as Record<string, any>)),
    [props.formApi]
  );
  const localeVersion = useLocaleVersion();
  const runtime = useFormSelector(api, useCallback((snapshot) => snapshot.runtime, []));
  const runtimeProps = useFormSelector(api, useCallback((snapshot) => snapshot.props, []));
  const renderState = useMemo(() => api.getRenderState(), [api, runtime, runtimeProps]);
  const messages = useMemo(() => getLocaleMessages().form, [localeVersion]);
  const resolvedBindingCacheRef = useRef(
    new Map<string, ResolvedComponentBinding<any> | null>()
  );
  const propsSyncTrackerRef = useRef(createFormPropsSyncTracker());
  const controlledValuesBridgeRef = useRef(
    createControlledValuesBridge<Record<string, any>>()
  );
  const queryAutoCollapsedRef = useRef(false);
  useEffect(() => {
    api.mount();
    return () => {
      if (!props.formApi) {
        api.unmount();
      }
    };
  }, [api, props.formApi]);

  useEffect(() => {
    const nextProps = pickFormProps(props as Record<string, any>);
    const hasExplicitCollapsed = Object.prototype.hasOwnProperty.call(
      props,
      'collapsed'
    );
    if (nextProps.queryMode) {
      if (!hasExplicitCollapsed && !queryAutoCollapsedRef.current) {
        nextProps.collapsed = resolveQueryInitialCollapsed({
          hasExplicitCollapsed,
          queryMode: true,
        });
        queryAutoCollapsedRef.current = true;
      }
    } else {
      queryAutoCollapsedRef.current = false;
    }
    if (!propsSyncTrackerRef.current.hasChanges(nextProps)) {
      return;
    }
    api.setState(nextProps);
  }, [api, props]);

  useEffect(() => {
    const bridge = controlledValuesBridgeRef.current;
    if (!bridge.shouldSyncIncoming(props.values, api.getSnapshot().values)) {
      return;
    }
    const incoming = bridge.resolveIncoming(props.values);
    const token = bridge.beginExternalSync(incoming);
    void api.setValues(incoming, false).finally(() => {
      bridge.endExternalSync(token);
    });
  }, [api, props.values]);

  useEffect(() => {
    if (!props.onValuesChange) {
      return;
    }
    return api.store.subscribeSelector(
      (snapshot) => snapshot.values,
      (nextValues) => {
        const bridge = controlledValuesBridgeRef.current;
        if (bridge.isExternalSyncing()) {
          return;
        }
        if (!bridge.shouldEmit(nextValues)) {
          return;
        }
        bridge.markEmitted(nextValues);
        props.onValuesChange?.(nextValues);
      },
      Object.is
    );
  }, [api, props.onValuesChange]);

  useEffect(() => {
    resolvedBindingCacheRef.current.clear();
  }, [runtimeProps.schema, runtimeProps.commonConfig?.modelPropName]);

  const visibleFieldSet = useMemo(() => {
    const effectiveVisibleFieldNames = runtimeProps.visibleFieldNames;
    if (
      !Array.isArray(effectiveVisibleFieldNames) ||
      effectiveVisibleFieldNames.length === 0
    ) {
      return null;
    }
    return new Set(effectiveVisibleFieldNames);
  }, [runtimeProps.visibleFieldNames]);
  const queryMode = !!runtimeProps.queryMode;

  const renderField = (field: RenderFieldItem, index: number) => {
    const registry = getReactFormAdapterRegistry();
    const { key, resolved } = resolveFieldComponentBinding({
      cache: resolvedBindingCacheRef.current,
      field,
      globalModelPropName: runtimeProps.commonConfig?.modelPropName,
      registry,
    });

    if (!resolved) {
      return (
        <div key={field.fieldName} className="admin-form__error">
          Unresolved component: {key}
        </div>
      );
    }

    return (
      <FormFieldItem
        key={`${field.fieldName}-${index}`}
        api={api}
        field={field}
        index={index}
        resolved={resolved}
        runtimeProps={runtimeProps}
      />
    );
  };
  const filteredFields = useMemo(
    () =>
      renderState.fields.filter((field) => {
        if (visibleFieldSet && !visibleFieldSet.has(field.fieldName)) {
          return false;
        }
        if (isFieldHiddenByState(field)) {
          return false;
        }
        return true;
      }),
    [renderState.fields, visibleFieldSet]
  );
  const queryVisible = useMemo(
    () =>
      resolveQueryVisibleFields({
        collapsed: renderState.collapsed,
        collapsedRows: runtimeProps.collapsedRows,
        fields: filteredFields,
        gridColumns: runtimeProps.gridColumns,
        queryMode,
      }),
    [
      filteredFields,
      queryMode,
      renderState.collapsed,
      runtimeProps.collapsedRows,
      runtimeProps.gridColumns,
    ]
  );
  const fieldsToRender = queryMode ? queryVisible.fields : filteredFields;
  const actionItems = queryMode
    ? resolveQueryActionItems({
        actionButtonsReverse: runtimeProps.actionButtonsReverse,
        collapsed: renderState.collapsed,
        hasOverflow: queryVisible.hasOverflow,
        messages,
        resetButtonOptions: runtimeProps.resetButtonOptions,
        showCollapseButton: runtimeProps.showCollapseButton,
        showDefaultActions: runtimeProps.showDefaultActions,
        submitButtonOptions: runtimeProps.submitButtonOptions,
      })
    : resolveFormActionRenderItems(
        resolveFormActionPlan({
          actionButtonsReverse: runtimeProps.actionButtonsReverse,
          collapsed: renderState.collapsed,
          messages,
          resetButtonOptions: runtimeProps.resetButtonOptions,
          showCollapseButton: runtimeProps.showCollapseButton,
          showDefaultActions: runtimeProps.showDefaultActions,
          submitButtonOptions: runtimeProps.submitButtonOptions,
        })
      );
  const hasActionItems = actionItems.length > 0;
  const queryActionsPlacement =
    queryMode && hasActionItems
      ? resolveQueryActionsGridPlacement({
          columns: queryVisible.columns,
          visibleCount: fieldsToRender.length,
        })
      : null;
  const actionNodes: ReactElement[] = [];

  const handleResetAction = async () => {
    await api.resetForm();
  };

  for (const item of actionItems) {
    const className =
      item.kind === 'collapse'
        ? buildFormActionButtonClass({ variant: 'collapse' })
        : buildFormActionButtonClass({
            className: item.options.className,
            variant: item.variant,
          });

    actionNodes.push(
      <button
        key={item.actionKey}
        type="button"
        className={className}
        {...(item.kind === 'button' ? item.options.attrs : {})}
        onClick={(event) => {
          void handleFormActionItemClick(item, event, {
            onCollapse: async () => {
              api.setState({ collapsed: !api.getState().collapsed });
            },
            onReset: handleResetAction,
            onSubmit: async () => {
              await api.validateAndSubmitForm();
            },
          });
        }}
      >
        {item.label}
      </button>
    );
  }

  const gridClassName = [
    'admin-form__grid',
    resolveGridColumnsClass(runtimeProps.gridColumns, 1),
    runtimeProps.wrapperClass ?? '',
  ].join(' ');
  const gridStyle = resolveGridColumnsStyle(runtimeProps.gridColumns, 1) as CSSProperties;

  return (
    <form
      className={[
        'admin-form',
        runtimeProps.compact ? 'admin-form--compact' : '',
        queryMode ? 'admin-form--query' : '',
      ].join(' ')}
      onSubmit={(event) => {
        event.preventDefault();
        void api.validateAndSubmitForm();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => {
        if (!api.getState().submitOnEnter) return;
        if (event.key !== 'Enter') return;
        if (event.target instanceof HTMLTextAreaElement) return;
        event.preventDefault();
        void api.validateAndSubmitForm();
      }}
    >
      <div className={gridClassName} style={gridStyle}>
        {fieldsToRender.map(renderField)}
        {queryMode && hasActionItems ? (
          <div
            className={[
              'admin-form__actions-item',
              queryActionsPlacement?.newRow ? 'admin-form__actions-item--new-row' : '',
              runtimeProps.actionWrapperClass ?? '',
            ].join(' ')}
            style={
              {
                gridColumn: queryActionsPlacement?.gridColumn,
              } as CSSProperties
            }
          >
            {actionNodes}
          </div>
        ) : null}
      </div>

      {!queryMode && hasActionItems ? (
        <div
          className={buildActionClass({
            actionLayout: runtimeProps.actionLayout,
            actionPosition: runtimeProps.actionPosition,
            actionWrapperClass: runtimeProps.actionWrapperClass,
          })}
        >
          {actionNodes}
        </div>
      ) : null}
    </form>
  );
});
