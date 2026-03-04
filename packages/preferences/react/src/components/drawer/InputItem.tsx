/**
 * 文本输入设置项组件模块。
 * @description 提供带防抖能力的输入控件，用于偏好设置中的字符串或数值文本录入。
 */
import { INPUT_DEBOUNCE_MS, INPUT_MAX_LENGTH, getIcon, type InputItemBaseProps } from '@admin-core/preferences';
import React, { memo, useCallback, useId } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

/**
 * 文本输入设置项参数。
 */
export interface InputItemProps extends InputItemBaseProps {
  /** 当前值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
}

/**
 * 文本输入设置项组件。
 */
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
  /**
   * 输入框无障碍关联 ID。
   * @description 用于绑定 `label` 与 `input` 的 `aria-labelledby` 关系。
   */
  const inputId = useId();
  /**
   * 帮助图标 SVG 内容。
   * @description 在配置项提供 `tip` 时显示提示入口图标。
   */
  const helpCircleIcon = getIcon('helpCircle');

  /**
   * 输入值防抖控制器。
   * @description 维护本地输入态并延迟触发外部 `onChange`，避免高频更新。
   */
  const { localValue, setLocalValue } = useDebouncedValue({
    value,
    onChange,
    delay: debounce,
  });

  /**
   * 处理输入框内容变化
   * @description 将输入值交给防抖更新器，降低外层状态更新频率。
   * @param e React 输入事件对象。
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, [setLocalValue]);

  return (
    <div
      className={`input-item pref-disabled ${inline ? 'input-item--inline' : ''} ${disabled ? 'disabled' : ''}`}
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

/**
 * 默认导出文本输入配置项组件。
 */
export default InputItem;
