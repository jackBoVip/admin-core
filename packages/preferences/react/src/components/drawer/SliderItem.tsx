/**
 * React 滑动条控件
 * @description 使用 Headless Logic 重构，逻辑与 Vue 完全同步
 */
import React, { memo, useCallback, useMemo } from 'react';
import { createSliderController } from '@admin-core/preferences';

export interface SliderItemProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 格式化显示值 */
  formatValue?: (value: number) => string;
}

/**
 * 滑动条控件
 */
export const SliderItem = memo<SliderItemProps>(function SliderItem({
  value,
  onChange,
  min,
  max,
  step = 0.05,
  disabled = false,
  formatValue = (v) => `${Math.round(v * 100)}%`,
}) {
  // 创建控制器实例 (Headless)
  const controller = useMemo(() => createSliderController({
    min,
    max,
    step,
  }), [min, max, step]);

  // 计算背景样式
  const backgroundStyle = useMemo(() => {
    return controller.getBackgroundStyle(
      value,
      'var(--primary)',
      'var(--muted)'
    );
  }, [controller, value]);

  // 处理滑动条变化
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      // 使用控制器限制和舍入数值
      onChange(controller.clamp(newValue));
    },
    [onChange, controller]
  );

  // 格式化显示值
  const displayValue = useMemo(() => formatValue(value), [value, formatValue]);

  return (
    <div className="slider-control">
      <div className="slider-wrapper">
        <input
          type="range"
          className="slider-native"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          style={{ background: backgroundStyle }}
        />
      </div>
      <span className="slider-value">{displayValue}</span>
    </div>
  );
});

export default SliderItem;
