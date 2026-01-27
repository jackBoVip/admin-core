/**
 * 开关设置项组件
 */
import { memo, useCallback } from 'react';

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
}

/**
 * 开关组件 - 使用 memo 优化重渲染
 */
export const SwitchItem = memo<SwitchItemProps>(function SwitchItem({
  label,
  icon,
  checked,
  onChange,
  disabled = false,
}) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  return (
    <div
      className={`switch-item ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      <span className="switch-item-label">
        {icon && <span className="switch-item-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        {label}
      </span>
      <div className={`preferences-switch ${checked ? 'checked' : ''}`}>
        <span className="preferences-switch-thumb" />
      </div>
    </div>
  );
});

export default SwitchItem;
