/**
 * Form React 主表单组件实现。
 * @description 负责字段渲染、值同步、动作区布局与查询模式交互行为。
 */

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

/** 需要注入 Ant Design 弹层容器属性的语义组件键集合。 */
const ANTD_POPUP_KEYS = new Set(['date', 'date-range', 'range', 'select', 'time']);

/**
 * 判断当前字段是否需要注入 Ant Design 弹层属性。
 * @param resolved 组件解析结果。
 * @param field 字段配置。
 * @returns 是否需要注入弹层属性。
 */
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

/**
 * 获取弹层容器节点。
 */
function resolvePopupContainer() {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.body;
}

/**
 * 将未知值安全转换为普通对象。
 * @param value 待转换值。
 * @returns 对象值，非对象返回 `undefined`。
 */
function asRecord(value: any): Record<string, any> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, any>;
}

/**
 * 规范化 Ant Design 弹层相关属性，统一 className 与 style 写法。
 * @param componentProps 组件属性对象。
 */
function normalizeAntdPopupProps(componentProps: Record<string, any>) {
  const defaultPopupClassName = 'admin-form-popup';
  const defaultPopupStyle = {
    zIndex: 'var(--admin-form-page-popup-z-index, 2300)',
  };

  const userPopupClassName =
    componentProps.popupClassName ?? componentProps.dropdownClassName;
  const userPopupStyle = componentProps.popupStyle ?? componentProps.dropdownStyle;

  const classNames = asRecord(componentProps.classNames);
  const popupClassNames = asRecord(classNames?.popup);
  const mergedPopupClassName =
    [defaultPopupClassName, userPopupClassName].filter(Boolean).join(' ') ||
    defaultPopupClassName;
  const popupRootClassName =
    popupClassNames?.root ?? mergedPopupClassName;
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

/**
 * 清理跨框架互操作遗留属性，确保 React 组件可安全接收。
 * @param componentProps 组件属性对象。
 * @param modelPropName 当前 model 属性名。
 */
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

/**
 * 订阅表单快照切片并返回派生值。
 * @param api 表单 API。
 * @param selector 快照选择器。
 * @param isEqual 切片比较函数。
 * @returns 当前切片值。
 */
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

/**
 * 单个字段渲染组件属性。
 */
interface FormFieldItemProps {
  /** 表单 API。 */
  api: AdminFormApi;
  /** 字段配置。 */
  field: RenderFieldItem;
  /** 索引。 */
  index: number;
  /** 组件解析结果。 */
  resolved: ResolvedComponentBinding<any>;
  /** 运行时 props。 */
  runtimeProps: Record<string, any>;
}

/**
 * 单字段渲染组件。
 * @description 负责字段值订阅、状态计算与组件事件桥接。
 */
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
  const requiredMarkFollowTheme = fieldRuntime.requiredMarkFollowTheme;
  const requiredByRule = isFieldRequiredMark(field);
  const required = requiredByRule && !hideRequiredMark;
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
        requiredByRule ? 'admin-form__item--required' : '',
        requiredByRule && requiredMarkFollowTheme
          ? 'admin-form__item--required-follow-theme'
          : '',
        field.hiddenByCollapse ? 'admin-form__item--hidden' : '',
        field.formItemClass ?? '',
      ].join(' ')}
    >
      {hideLabel ? null : (
        <label
          className={['admin-form__label', field.labelClass ?? ''].join(' ')}
          style={labelStyle}
        >
          {required ? (
            <span
              className={[
                'admin-form__required',
                requiredMarkFollowTheme
                  ? 'admin-form__required--follow-theme'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              *
            </span>
          ) : null}
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

/**
 * 管理表单组件。
 * @description 负责解析 schema、挂载适配器组件并驱动联动校验与提交流程。
 */
export const AdminForm = memo(function AdminForm(props: AdminFormReactProps) {
  /**
   * 首次解析后的表单 props 快照。
   * @description 仅用于内部创建 formApi 时的初始化输入，避免重复取值带来漂移。
   */
  const initialFormPropsRef = useRef<Record<string, any> | null>(null);
  if (!initialFormPropsRef.current) {
    initialFormPropsRef.current = pickFormProps(props as Record<string, any>);
  }
  /**
   * 当前生效表单 API。
   * @description 优先使用外部注入实例，缺省时在组件内创建。
   */
  const api = useMemo(
    () => props.formApi ?? createFormApi(initialFormPropsRef.current ?? {}),
    [props.formApi]
  );
  /**
   * 表单语言版本号订阅值。
   */
  const localeVersion = useLocaleVersion();
  /**
   * 运行时快照（触发订阅刷新）。
   */
  const runtime = useFormSelector(api, useCallback((snapshot) => snapshot.runtime, []));
  /**
   * 运行时 props（触发订阅刷新）。
   */
  const runtimeProps = useFormSelector(api, useCallback((snapshot) => snapshot.props, []));
  void runtime;
  void runtimeProps;
  /**
   * 表单渲染态快照。
   */
  const renderState = api.getRenderState();
  /**
   * 当前语言下表单文案集合。
   */
  const messages = useMemo(() => {
    void localeVersion;
    return getLocaleMessages().form;
  }, [localeVersion]);
  /**
   * 字段组件解析缓存。
   */
  const resolvedBindingCacheRef = useRef(
    new Map<string, ResolvedComponentBinding<any> | null>()
  );
  /**
   * props 同步追踪器。
   */
  const propsSyncTrackerRef = useRef(createFormPropsSyncTracker());
  /**
   * 受控值同步桥接器。
   */
  const controlledValuesBridgeRef = useRef(
    createControlledValuesBridge<Record<string, any>>()
  );
  /**
   * 是否已自动注入 query 折叠初始值。
   */
  const queryAutoCollapsedRef = useRef(false);
  /**
   * 外部值变化回调引用快照。
   */
  const onValuesChange = props.onValuesChange;
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
    if (!onValuesChange) {
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
        onValuesChange(nextValues);
      },
      Object.is
    );
  }, [api, onValuesChange]);

  useEffect(() => {
    resolvedBindingCacheRef.current.clear();
  }, [runtimeProps.schema, runtimeProps.commonConfig?.modelPropName]);

  /**
   * 显式可见字段集合。
   * @description 当存在 `visibleFieldNames` 时用于快速过滤字段。
   */
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
  /**
   * 当前是否处于查询模式。
   */
  const queryMode = !!runtimeProps.queryMode;

  /**
   * 渲染单个表单字段节点。
   * @param field 字段渲染描述。
   * @param index 字段索引。
   * @returns 字段节点或错误提示节点。
   */
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
  /**
   * 过滤后的可渲染字段列表。
   */
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
  /**
   * 查询模式下字段可见性解析结果。
   */
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
  /**
   * 最终参与渲染的字段列表。
   */
  const fieldsToRender = queryMode ? queryVisible.fields : filteredFields;
  /**
   * 当前动作按钮渲染项。
   */
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
  /**
   * 是否存在动作按钮。
   */
  const hasActionItems = actionItems.length > 0;
  /**
   * 查询模式下动作区域栅格位置。
   */
  const queryActionsPlacement =
    queryMode && hasActionItems
      ? resolveQueryActionsGridPlacement({
          columns: queryVisible.columns,
          visibleCount: fieldsToRender.length,
        })
      : null;
  /**
   * 动作按钮节点集合。
   */
  const actionNodes: ReactElement[] = [];

  /**
   * 处理默认重置动作。
   * @returns 无返回值。
   */
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

  /**
   * 字段网格 className。
   */
  const gridClassName = [
    'admin-form__grid',
    resolveGridColumnsClass(runtimeProps.gridColumns, 1),
    runtimeProps.wrapperClass ?? '',
  ].join(' ');
  /**
   * 字段网格内联样式。
   */
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
