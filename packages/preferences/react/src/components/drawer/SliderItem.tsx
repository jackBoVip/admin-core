/**
 * 滑动条设置项组件
 * @description 用于数值范围选择，性能优化：使用 debounce 避免频繁更新
 */
import React, { memo, useState, useCallback, useRef, useEffect, useId } from 'react';
import { SLIDER_DEBOUNCE_MS } from '@admin-core/preferences';

export interface SliderItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 单位文本 */
  unit?: string;
  /** 防抖延迟 (ms) */
  debounce?: number;
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
  // 本地值用于即时响应UI
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sliderId = useId();

  // 同步外部值变化（使用函数式更新避免依赖 localValue）
  useEffect(() => {
    setLocalValue(prev => prev !== value ? value : prev);
  }, [value]);

  // 计算已滑动百分比（防止除零）
  const range = max - min;
  const progressPercent = range === 0 ? 0 : ((localValue - min) / range) * 100;

  // 处理滑动变化（防抖）
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
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
    <div className={`slider-item ${disabled ? 'disabled' : ''}`}>
      <div className="slider-item-header">
        <label id={`${sliderId}-label`} className="slider-item-label">{label}</label>
        <span className="slider-item-value">{localValue}{unit}</span>
      </div>
      <input
        type="range"
        className="preferences-slider"
        min={min}
        max={max}
        step={step}
        value={localValue}
        disabled={disabled}
        aria-labelledby={`${sliderId}-label`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue}
        style={{ '--slider-progress': `${progressPercent}%` } as React.CSSProperties}
        onChange={handleInput}
      />
    </div>
  );
});

SliderItem.displayName = 'SliderItem';

export default SliderItem;
