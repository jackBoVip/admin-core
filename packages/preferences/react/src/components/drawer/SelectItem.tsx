/**
 * 选择设置项组件
 */
import type { ChangeEvent } from 'react';
import { memo, useCallback } from 'react';

export interface SelectItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 变更回调 */
  onChange: (value: string | number) => void;
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 选择组件 - 使用 memo 优化重渲染
 */
export const SelectItem = memo<SelectItemProps>(function SelectItem({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="select-item">
      <span className="select-item-label">{label}</span>
      <select
        className="select-item-select"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export default SelectItem;
