/**
 * Form React 原生组件映射。
 * @description 提供无 UI 库依赖的基础表单组件实现，作为适配器兜底能力。
 */
import {
  ensureDateRangeValue,
  isNativeEmptyValue,
  mergeClassValue,
  normalizeNativeInputValue,
  pickAdminStateAttrs,
  resolveNativeModelValue,
  toggleCollectionValue,
  updateDateRangeValue,
  type SemanticFormComponentType,
} from '@admin-core/form-core';
import type { ComponentType } from 'react';

/**
 * 原生组件选项项结构。
 */
type Option = {
  /** 显示标签。 */
  label: string;
  /** 值。 */
  value: any;
};

/**
 * 原生下拉组件属性。
 */
interface NativeSelectProps extends Record<string, any> {
  /** 样式类名。 */
  className?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 受控值。 */
  modelValue: any;
  /** 配置项。 */
  options?: Option[];
  /** 原生 `select` 变更事件回调。 */
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  /** 占位提示。 */
  placeholder?: string;
}

/**
 * 原生复选框组组件属性。
 */
interface NativeCheckboxGroupProps extends Record<string, any> {
  /** 样式类名。 */
  className?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 受控值数组。 */
  modelValue: any[];
  /** 复选项切换时触发。 */
  onChange: (event: any) => void;
  /** 配置项。 */
  options: Option[];
}

/**
 * 原生单选组组件属性。
 */
interface NativeRadioGroupProps extends Record<string, any> {
  /** 样式类名。 */
  className?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 受控值。 */
  modelValue: any;
  /** 单选值变化时触发。 */
  onChange: (value: any) => void;
  /** 配置项。 */
  options: Option[];
  /** 值。 */
  value?: any;
}

/**
 * 原生区间输入组件属性。
 */
interface NativeRangeProps extends Record<string, any> {
  /** 样式类名。 */
  className?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 结束输入占位符。 */
  endPlaceholder?: string;
  /** 结束输入类型。 */
  endType?: string;
  /** 受控区间值。 */
  modelValue?: [string, string];
  /** 区间值变化时触发。 */
  onChange?: (value: [string, string]) => void;
  /** 输入过程中的区间值变更回调。 */
  onInput?: (value: [string, string]) => void;
  /** 区间分隔符。 */
  separator?: string;
  /** 开始输入占位符。 */
  startPlaceholder?: string;
  /** 开始输入类型。 */
  startType?: string;
  /** 类型。 */
  type?: string;
  /** 值。 */
  value?: [string, string];
}

/**
 * 原生输入框组件。
 * @param props 组件属性。
 * @returns 输入框节点。
 */
function NativeInput(props: any) {
  const {
    modelValue,
    value,
    onChange,
    onInput,
    placeholder,
    disabled,
    type = 'text',
    className,
    ...rest
  } = props;
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  return (
    <input
      className={mergeClassValue('admin-form__input', className)}
      value={normalizeNativeInputValue(resolvedValue)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      onInput={onInput}
      onChange={onChange}
      {...rest}
      {...stateAttrs}
    />
  );
}

/**
 * 原生多行输入框组件。
 * @param props 组件属性。
 * @returns 文本域节点。
 */
function NativeTextarea(props: any) {
  const { modelValue, value, onChange, onInput, placeholder, disabled, className, ...rest } =
    props;
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  return (
    <textarea
      className={mergeClassValue('admin-form__textarea', className)}
      value={normalizeNativeInputValue(resolvedValue)}
      placeholder={placeholder}
      disabled={disabled}
      onInput={onInput}
      onChange={onChange}
      {...rest}
      {...stateAttrs}
    />
  );
}

/**
 * 原生下拉选择组件。
 * @param props 组件属性。
 * @returns 下拉选择节点。
 */
function NativeSelect(props: any) {
  const {
    modelValue,
    value,
    onChange,
    disabled,
    options = [],
    placeholder,
    className,
    ...rest
  } = props as NativeSelectProps;
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  const isEmpty = isNativeEmptyValue(resolvedValue);
  return (
    <select
      className={mergeClassValue('admin-form__select', className)}
      value={normalizeNativeInputValue(resolvedValue)}
      disabled={disabled}
      data-admin-empty={isEmpty ? 'true' : undefined}
      onChange={onChange}
      {...rest}
      {...stateAttrs}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * 原生复选框组件。
 * @param props 组件属性。
 * @returns 复选框节点。
 */
function NativeCheckbox(props: any) {
  const { checked, onChange, disabled, children, className, ...rest } = props;
  const stateAttrs = pickAdminStateAttrs(rest);
  return (
    <label
      className={[
        'admin-form__choice',
        disabled ? 'admin-form__choice--disabled' : '',
        className ?? '',
      ].join(' ')}
      {...stateAttrs}
    >
      <input
        className="admin-form__choice-input"
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
        {...stateAttrs}
      />
      {children ? <span>{children}</span> : null}
    </label>
  );
}

/**
 * 原生复选框组组件。
 * @param props 组件属性。
 * @returns 复选框组节点。
 */
function NativeCheckboxGroup(props: any) {
  const {
    modelValue,
    value,
    onChange,
    options = [],
    disabled,
    className,
    ...rest
  } = props as NativeCheckboxGroupProps;
  const resolvedValue = resolveNativeModelValue(modelValue, value) ?? [];
  const stateAttrs = pickAdminStateAttrs(rest);
  const values = new Set(resolvedValue);
  const inputAttrs = {
    ...rest,
    ...stateAttrs,
  } as Record<string, any>;
  return (
    <div className={mergeClassValue('admin-form__choice-group', className)} {...stateAttrs}>
      {options.map((option) => (
        <label
          key={String(option.value)}
          className={[
            'admin-form__choice',
            disabled ? 'admin-form__choice--disabled' : '',
          ].join(' ')}
        >
          <input
            className="admin-form__choice-input"
            type="checkbox"
            disabled={disabled}
            checked={values.has(option.value)}
            {...inputAttrs}
            onChange={(event) => {
              onChange(
                toggleCollectionValue(
                  resolvedValue,
                  option.value,
                  (event.target as HTMLInputElement).checked
                )
              );
            }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/**
 * 原生单选组组件。
 * @param props 组件属性。
 * @returns 单选组节点。
 */
function NativeRadioGroup(props: any) {
  const { modelValue, value, onChange, options = [], disabled, className, ...rest } =
    props as NativeRadioGroupProps;
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  const inputAttrs = {
    ...rest,
    ...stateAttrs,
  } as Record<string, any>;
  return (
    <div className={mergeClassValue('admin-form__choice-group', className)} {...stateAttrs}>
      {options.map((option) => (
        <label
          key={String(option.value)}
          className={[
            'admin-form__choice',
            disabled ? 'admin-form__choice--disabled' : '',
          ].join(' ')}
        >
          <input
            className="admin-form__choice-input"
            type="radio"
            disabled={disabled}
            checked={resolvedValue === option.value}
            {...inputAttrs}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/**
 * 原生单选组件。
 * @param props 组件属性。
 * @returns 单选按钮节点。
 */
function NativeRadio(props: any) {
  const { checked, onChange, disabled, children, value, className, ...rest } = props;
  const stateAttrs = pickAdminStateAttrs(rest);
  return (
    <label
      className={[
        'admin-form__choice',
        disabled ? 'admin-form__choice--disabled' : '',
        className ?? '',
      ].join(' ')}
      {...stateAttrs}
    >
      <input
        className="admin-form__choice-input"
        type="radio"
        value={value}
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
        {...stateAttrs}
      />
      {children ? <span>{children}</span> : null}
    </label>
  );
}

/**
 * 原生开关组件。
 * @param props 组件属性。
 * @returns 开关节点。
 */
function NativeSwitch(props: any) {
  const { checked, onChange, disabled, children, className, ...rest } = props;
  const stateAttrs = pickAdminStateAttrs(rest);
  return (
    <label
      className={[
        'admin-form__switch',
        disabled ? 'admin-form__switch--disabled' : '',
        className ?? '',
      ].join(' ')}
      {...stateAttrs}
    >
      <input
        className="admin-form__switch-input"
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
        {...stateAttrs}
      />
      <span className="admin-form__switch-track">
        <span className="admin-form__switch-thumb" />
      </span>
      {children ? <span className="admin-form__switch-label">{children}</span> : null}
    </label>
  );
}

/**
 * 原生按钮组件。
 * @param props 组件属性。
 * @returns 按钮节点。
 */
function NativeButton(props: any) {
  const { className, variant = 'default', ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        'admin-form__button',
        variant === 'primary' ? 'admin-form__button--primary' : '',
        className ?? '',
      ].join(' ')}
    />
  );
}

/**
 * 原生区间输入组件。
 * @param props 组件属性。
 * @returns 区间输入节点。
 */
function NativeRange(props: any) {
  const {
    modelValue,
    value,
    onChange,
    onInput,
    disabled,
    className,
    separator = '~',
    startPlaceholder,
    endPlaceholder,
    startType,
    endType,
    type = 'text',
    ...rest
  } = props as NativeRangeProps;
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  const dateRange = ensureDateRangeValue(resolvedValue);
  const leftInputType = startType ?? type;
  const rightInputType = endType ?? type;

  /**
   * 更新区间指定端点并派发回调。
   *
   * @param index 端点索引（`0` 起始端，`1` 结束端）。
   * @param event 输入事件对象。
   * @param callback 目标回调。
   * @returns 无返回值。
   */
  const updateAt = (
    index: 0 | 1,
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: (value: [string, string]) => void
  ) => {
    const next = updateDateRangeValue(dateRange, index, event.target.value);
    callback?.(next);
  };

  return (
    <div className={mergeClassValue('admin-form__range', className)} {...stateAttrs}>
      <input
        className="admin-form__input"
        type={leftInputType}
        placeholder={startPlaceholder}
        value={dateRange[0] ?? ''}
        disabled={disabled}
        {...rest}
        {...stateAttrs}
        onInput={(event) => updateAt(0, event as any, onInput)}
        onChange={(event) => updateAt(0, event, onChange)}
      />
      <span className="admin-form__range-separator">{separator}</span>
      <input
        className="admin-form__input"
        type={rightInputType}
        placeholder={endPlaceholder}
        value={dateRange[1] ?? ''}
        disabled={disabled}
        {...rest}
        {...stateAttrs}
        onInput={(event) => updateAt(1, event as any, onInput)}
        onChange={(event) => updateAt(1, event, onChange)}
      />
    </div>
  );
}

/**
 * 分组标题组件。
 * @param props 组件属性。
 * @returns 分组标题节点。
 */
function NativeSectionTitle(props: any) {
  const { className, description, title } = props ?? {};
  return (
    <div className={mergeClassValue('admin-form__section', className)}>
      {title ? <h4 className="admin-form__section-title">{title}</h4> : null}
      {description ? <div className="admin-form__section-description">{description}</div> : null}
    </div>
  );
}

/**
 * React 原生适配组件映射表。
 * @description 将语义组件类型映射到可渲染的 React 组件实现。
 */
export const nativeReactComponents: Partial<
  Record<SemanticFormComponentType, ComponentType<any>>
> = {
  checkbox: NativeCheckbox,
  'checkbox-group': NativeCheckboxGroup,
  date: (props: any) => <NativeInput {...props} type="date" />,
  'date-range': (props: any) => <NativeRange {...props} type="date" />,
  'default-button': NativeButton,
  input: NativeInput,
  password: (props: any) => <NativeInput {...props} type="password" />,
  'primary-button': (props: any) => <NativeButton {...props} variant="primary" />,
  radio: NativeRadio,
  'radio-group': NativeRadioGroup,
  range: NativeRange,
  'section-title': NativeSectionTitle,
  select: NativeSelect,
  switch: NativeSwitch,
  textarea: NativeTextarea,
  time: (props: any) => <NativeInput {...props} type="time" />,
};
