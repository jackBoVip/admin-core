/**
 * 开关设置项组件
 * @description 与 Vue 版本保持一致的 API 设计
 */
import { memo, useCallback, useId } from 'react';

export interface SwitchItemProps {
  /** 标签文本 */
  label: string;
  /** 图标 SVG 字符串 */
  icon?: string;
  /** 是否选中 */
  checked: boolean;
  /** 变更回调 */
  onChange: (checked: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 提示文本 */
  tip?: string;
}

/**
 * 开关组件 - 使用 memo 优化重渲染
 * @description 增强无障碍性，支持键盘操作
 */
export const SwitchItem = memo<SwitchItemProps>(function SwitchItem({
  label,
  icon,
  checked,
  onChange,
  disabled = false,
  tip,
}) {
  const switchId = useId();

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      // 空格或回车触发切换
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [disabled, checked, onChange]
  );

  return (
    <div
      className={`switch-item ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tip}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={`${switchId}-label`}
      tabIndex={disabled ? -1 : 0}
    >
      <span id={`${switchId}-label`} className="switch-item-label">
        {icon && <span className="switch-item-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        {label}
      </span>
      <div
        className={`preferences-switch ${checked ? 'checked' : ''}`}
        aria-hidden="true"
      >
        <span className="preferences-switch-thumb" />
      </div>
    </div>
  );
});

export default SwitchItem;
