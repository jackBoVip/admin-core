/**
 * 输入框设置项组件
 * @description 用于文本输入，支持防抖
 */
import { INPUT_DEBOUNCE_MS, INPUT_MAX_LENGTH, type InputItemBaseProps } from '@admin-core/preferences';
import React, { memo, useState, useCallback, useRef, useEffect, useId } from 'react';

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
}) => {
  // 本地值用于即时响应UI
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();

  // 同步外部值变化（使用函数式更新避免依赖 localValue）
  useEffect(() => {
    setLocalValue(prev => prev !== value ? value : prev);
  }, [value]);

  // 处理输入变化（防抖）
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (debounce <= 0) {
      onChange(newValue);
      return;
    }
    
    // 防抖更新
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  }, [onChange, debounce]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`input-item ${disabled ? 'disabled' : ''}`} data-disabled={disabled ? 'true' : undefined}>
      <label id={`${inputId}-label`} className="input-item-label">{label}</label>
      <input
        type="text"
        className="preferences-input"
        value={localValue}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-labelledby={`${inputId}-label`}
        onChange={handleInput}
      />
    </div>
  );
});

InputItem.displayName = 'InputItem';

export default InputItem;
