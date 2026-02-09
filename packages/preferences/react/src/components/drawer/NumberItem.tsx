/**
 * 数字输入设置项组件
 * @description 带 +/- 步进控制的数字输入
 */
import { getIcon, clamp, type InputItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useEffect, useId, useState } from 'react';

export interface NumberItemProps extends InputItemBaseProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

export const NumberItem: React.FC<NumberItemProps> = memo(({
  label,
  value,
  onChange,
  disabled = false,
  min,
  max,
  step = 1,
  tip,
}) => {
  const inputId = useId();
  const [localText, setLocalText] = useState(String(value ?? 0));
  const helpCircleIcon = getIcon('helpCircle');

  useEffect(() => {
    const next = String(value ?? 0);
    setLocalText((prev) => (prev === next ? prev : next));
  }, [value]);

  const clampValue = useCallback((val: number) => {
    const next = Number.isFinite(val) ? val : 0;
    return clamp(next, min, max);
  }, [min, max]);

  const commit = useCallback((val: number) => {
    const next = clampValue(val);
    onChange(next);
    setLocalText(String(next));
  }, [clampValue, onChange]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    const parsed = Number.parseInt(localText, 10);
    commit(Number.isNaN(parsed) ? (value ?? 0) : parsed);
  }, [commit, localText, value]);

  const handleStep = useCallback((direction: number) => {
    if (disabled) return;
    const parsed = Number.parseInt(localText, 10);
    const base = Number.isNaN(parsed) ? (value ?? 0) : parsed;
    commit(base + (step ?? 1) * direction);
  }, [commit, disabled, localText, step, value]);

  return (
    <div
      className={`number-item ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
    >
      <label id={`${inputId}-label`} className="number-item__label">
        <span className="number-item__label-text">{label}</span>
        {tip ? (
          <span
            className="help-icon"
            data-preference-tooltip={tip}
            aria-label="help"
            dangerouslySetInnerHTML={{ __html: helpCircleIcon }}
          />
        ) : null}
      </label>
      <div className="preferences-stepper">
        <button
          type="button"
          className="preferences-stepper__btn"
          disabled={disabled}
          aria-label="decrease"
          onClick={() => handleStep(-1)}
        >
          -
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          className="preferences-stepper__input"
          value={localText}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-labelledby={`${inputId}-label`}
          onChange={handleInput}
          onBlur={handleBlur}
        />
        <button
          type="button"
          className="preferences-stepper__btn"
          disabled={disabled}
          aria-label="increase"
          onClick={() => handleStep(1)}
        >
          +
        </button>
      </div>
    </div>
  );
});

NumberItem.displayName = 'NumberItem';

export default NumberItem;
