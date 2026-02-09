/**
 * 滑动条设置项组件
 * @description 用于数值范围选择，性能优化：使用 debounce 避免频繁更新
 */
import { SLIDER_DEBOUNCE_MS, type SliderItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useId, useMemo } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

export interface SliderItemProps extends SliderItemBaseProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

export const SliderItem: React.FC<SliderItemProps> = memo(({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  unit = '',
  debounce = SLIDER_DEBOUNCE_MS,
}) => {
  const sliderId = useId();

  // 使用统一的防抖工具
  const { localValue, setLocalValue } = useDebouncedValue({
    value,
    onChange,
    delay: debounce,
  });

  // 计算已滑动百分比（防止除零）
  const range = max - min;
  const progressPercent = range === 0 ? 0 : ((localValue - min) / range) * 100;
  const sliderStyle = useMemo(
    () => ({ '--slider-progress': `${progressPercent}%` }) as React.CSSProperties,
    [progressPercent]
  );

  // 处理滑动变化（防抖）
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
  }, [setLocalValue]);

  return (
    <div
      className={`slider-item ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
    >
      <div className="slider-item-header">
        <label id={`${sliderId}-label`} className="slider-item-label">{label}</label>
        <span className="slider-item-value">{localValue}{unit}</span>
      </div>
      <input
        type="range"
        className="preferences-slider data-disabled:cursor-not-allowed data-disabled:opacity-60"
        min={min}
        max={max}
        step={step}
        value={localValue}
        disabled={disabled}
        data-disabled={disabled ? 'true' : undefined}
        aria-labelledby={`${sliderId}-label`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue}
        style={sliderStyle}
        onChange={handleInput}
      />
    </div>
  );
});

SliderItem.displayName = 'SliderItem';

export default SliderItem;
