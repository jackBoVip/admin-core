/**
 * 输入框设置项组件
 * @description 用于文本输入，支持防抖
 */
import { INPUT_DEBOUNCE_MS, INPUT_MAX_LENGTH, getIcon, type InputItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useId } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

export interface InputItemProps extends InputItemBaseProps {
  /** 当前值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
}

export const InputItem: React.FC<InputItemProps> = memo(({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  debounce = INPUT_DEBOUNCE_MS,
  maxLength = INPUT_MAX_LENGTH,
  type = 'text',
  inputMode,
  min,
  max,
  step,
  inline = false,
  tip,
}) => {
  const inputId = useId();
  const helpCircleIcon = getIcon('helpCircle');

  // 使用统一的防抖工具
  const { localValue, setLocalValue } = useDebouncedValue({
    value,
    onChange,
    delay: debounce,
  });

  // 处理输入变化
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, [setLocalValue]);

  return (
    <div
      className={`input-item ${inline ? 'input-item--inline' : ''} ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
    >
      <label id={`${inputId}-label`} className="input-item-label">
        <span className="input-item-label-text">{label}</span>
        {tip ? (
          <span
            className="help-icon"
            data-preference-tooltip={tip}
            aria-label="help"
            dangerouslySetInnerHTML={{ __html: helpCircleIcon }}
          />
        ) : null}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        className="preferences-input"
        value={localValue}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        aria-labelledby={`${inputId}-label`}
        onChange={handleInput}
      />
    </div>
  );
});

InputItem.displayName = 'InputItem';

export default InputItem;
