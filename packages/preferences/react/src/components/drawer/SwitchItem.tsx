/**
 * 开关设置项组件模块。
 * @description 提供可键盘操作的布尔开关控件，并保持与 Vue 版本一致的 API 语义。
 */
import { memo, useCallback, useId } from 'react';
import type { SwitchItemBaseProps } from '@admin-core/preferences';

/**
 * 开关设置项参数。
 */
export interface SwitchItemProps extends SwitchItemBaseProps {
  /** 是否选中 */
  checked: boolean;
  /** 变更回调 */
  onChange: (checked: boolean) => void;
}

/**
 * 开关设置项组件。
 * @description 使用 `memo` 降低无关重渲染，并内建点击与键盘双通道交互。
 */
export const SwitchItem = memo<SwitchItemProps>(function SwitchItem({
  label,
  icon,
  checked,
  onChange,
  disabled = false,
  tip,
}) {
  /**
   * 开关无障碍关联 ID。
   */
  const switchId = useId();

  /**
   * 处理开关点击
   * @description 在可操作状态下翻转开关值并通知外层。
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  /**
   * 处理开关键盘事件
   * @description 在可操作状态下，空格或回车触发开关切换。
   * @param e React 键盘事件对象。
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      /**
       * 键盘触发条件。
       * @description 仅空格与回车键可触发开关切换。
       */
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

/**
 * 默认导出开关配置项组件。
 */
export default SwitchItem;
