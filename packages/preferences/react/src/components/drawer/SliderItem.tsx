/**
 * 滑动条设置项组件模块。
 * @description 提供带防抖能力的范围输入控件，用于数值型偏好设置的平滑调节。
 */
import { SLIDER_DEBOUNCE_MS, type SliderItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useId, useMemo } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

/**
 * 滑动条设置项参数。
 */
export interface SliderItemProps extends SliderItemBaseProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

/**
 * 滑动条设置项组件。
 */
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
  /**
   * 滑块无障碍关联 ID。
   */
  const sliderId = useId();

  /**
   * 滑块值防抖控制器。
   * @description 缓存本地值并延迟向外部同步，降低拖拽过程状态写入频率。
   */
  const { localValue, setLocalValue } = useDebouncedValue({
    value,
    onChange,
    delay: debounce,
  });

  /**
   * 滑块进度百分比。
   * @description 根据当前值与区间计算进度，并处理区间长度为 0 的边界场景。
   */
  const range = max - min;
  /**
   * 当前滑块进度百分比。
   */
  const progressPercent = range === 0 ? 0 : ((localValue - min) / range) * 100;
  /**
   * 滑块样式变量。
   * @description 通过 CSS 变量将进度百分比传递给轨道渐变样式。
   */
  const sliderStyle = useMemo(
    () => ({ '--slider-progress': `${progressPercent}%` }) as React.CSSProperties,
    [progressPercent]
  );

  /**
   * 处理滑块值变化
   * @description 将字符串输入转换为数字并通过防抖回调写回外层状态。
   * @param e React 输入事件对象。
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
  }, [setLocalValue]);

  return (
    <div
      className={`slider-item pref-disabled ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
    >
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

/**
 * 默认导出滑块配置项组件。
 */
export default SliderItem;
