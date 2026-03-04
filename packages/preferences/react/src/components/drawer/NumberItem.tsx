/**
 * 数字输入设置项组件
 * @description 带 +/- 步进控制的数字输入
 */
import { getIcon, clamp, type InputItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useEffect, useId, useState } from 'react';

/**
 * 数字输入设置项参数。
 */
export interface NumberItemProps extends InputItemBaseProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
}

/**
 * 数字输入设置项组件。
 */
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
  /**
   * 输入框无障碍关联 ID。
   */
  const inputId = useId();
  /**
   * 本地输入文本。
   * @description 用于承载用户输入中的中间态（例如空字符串、未完成数字）。
   */
  const [localText, setLocalText] = useState(String(value ?? 0));
  /**
   * 帮助图标 SVG 内容。
   */
  const helpCircleIcon = getIcon('helpCircle');

  /**
   * 同步外部值到本地文本。
   * @description 当外层数值变化时刷新输入显示，避免本地值滞后。
   */
  useEffect(() => {
    const next = String(value ?? 0);
    setLocalText((prev) => (prev === next ? prev : next));
  }, [value]);

  /**
   * 约束数值到可用范围
   * @description 对非法值兜底后按最小/最大边界裁剪。
   * @param val 待约束的数值。
   * @returns 约束后的数值。
   */
  const clampValue = useCallback((val: number) => {
    const next = Number.isFinite(val) ? val : 0;
    return clamp(next, min, max);
  }, [min, max]);

  /**
   * 提交数字值
   * @description 将数值规范化后写入外层，并同步本地显示文本。
   * @param val 待提交的数值。
   */
  const commit = useCallback((val: number) => {
    const next = clampValue(val);
    onChange(next);
    setLocalText(String(next));
  }, [clampValue, onChange]);

  /**
   * 处理输入框变化
   * @description 仅更新本地文本，实际提交延迟到失焦或步进操作。
   * @param e React 输入事件对象。
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  }, []);

  /**
   * 处理输入框失焦
   * @description 将文本解析为整数并提交；解析失败时回退当前值。
   */
  const handleBlur = useCallback(() => {
    const parsed = Number.parseInt(localText, 10);
    commit(Number.isNaN(parsed) ? (value ?? 0) : parsed);
  }, [commit, localText, value]);

  /**
   * 处理步进按钮点击
   * @description 根据步进方向增减当前值并提交。
   * @param direction 步进方向，`1` 为增加，`-1` 为减少。
   */
  const handleStep = useCallback((direction: number) => {
    if (disabled) return;
    const parsed = Number.parseInt(localText, 10);
    const base = Number.isNaN(parsed) ? (value ?? 0) : parsed;
    commit(base + (step ?? 1) * direction);
  }, [commit, disabled, localText, step, value]);

  return (
    <div
      className={`number-item pref-disabled ${disabled ? 'disabled' : ''}`}
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
          className="preferences-stepper__btn pref-disabled"
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
          className="preferences-stepper__btn pref-disabled"
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

/**
 * 默认导出数字输入配置项组件。
 */
export default NumberItem;
