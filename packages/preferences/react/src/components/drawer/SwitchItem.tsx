/**
 * 开关设置项组件
 * @description 与 Vue 版本保持一致的 API 设计
 */
import { memo, useCallback, useId } from 'react';
import type { SwitchItemBaseProps } from '@admin-core/preferences';

export interface SwitchItemProps extends SwitchItemBaseProps {
  /** 是否选中 */
  checked: boolean;
  /** 变更回调 */
  onChange: (checked: boolean) => void;
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
      className={`switch-item pref-disabled ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tip}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={`${switchId}-label`}
      tabIndex={disabled ? -1 : 0}
    >
      <span id={`${switchId}-label`} className="switch-item-label pref-disabled-label">
        {icon && <span className="switch-item-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        {label}
      </span>
      <div
        className={`preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30 ${checked ? 'checked' : ''}`}
        data-state={checked ? 'checked' : 'unchecked'}
        aria-hidden="true"
      >
        <span className="preferences-switch-thumb" />
      </div>
    </div>
  );
});

export default SwitchItem;
