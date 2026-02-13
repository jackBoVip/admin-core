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


type Option = {
  label: string;
  value: any;
};

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
  } = props as {
    modelValue: any;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
    disabled?: boolean;
    options?: Option[];
    placeholder?: string;
    className?: string;
    [key: string]: any;
  };
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

function NativeCheckboxGroup(props: any) {
  const {
    modelValue,
    value,
    onChange,
    options = [],
    disabled,
    className,
    ...rest
  } = props as {
    modelValue: any[];
    onChange: (event: any) => void;
    options: Option[];
    disabled?: boolean;
    className?: string;
    [key: string]: any;
  };
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

function NativeRadioGroup(props: any) {
  const { modelValue, value, onChange, options = [], disabled, className, ...rest } = props as {
    modelValue: any;
    value?: any;
    onChange: (value: any) => void;
    options: Option[];
    disabled?: boolean;
    className?: string;
    [key: string]: any;
  };
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
  } = props as {
    modelValue?: [string, string];
    value?: [string, string];
    onChange?: (value: [string, string]) => void;
    onInput?: (value: [string, string]) => void;
    disabled?: boolean;
    className?: string;
    separator?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    startType?: string;
    endType?: string;
    type?: string;
    [key: string]: any;
  };
  const resolvedValue = resolveNativeModelValue(modelValue, value);
  const stateAttrs = pickAdminStateAttrs(rest);
  const dateRange = ensureDateRangeValue(resolvedValue);
  const leftInputType = startType ?? type;
  const rightInputType = endType ?? type;

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

function NativeSectionTitle(props: any) {
  const { className, description, title } = props ?? {};
  return (
    <div className={mergeClassValue('admin-form__section', className)}>
      {title ? <h4 className="admin-form__section-title">{title}</h4> : null}
      {description ? <div className="admin-form__section-description">{description}</div> : null}
    </div>
  );
}

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
