/**
 * 偏好设置按钮。
 * @description 点击后打开偏好设置抽屉，悬停时齿轮图标按样式规则旋转。
 */
import { memo } from 'react';
import { renderLayoutIcon } from '../../utils';

/**
 * 偏好设置按钮参数。
 */
export interface PreferencesButtonProps {
  /** 点击按钮时触发。 */
  onOpenPreferences?: () => void;
}

/**
 * 顶栏偏好设置按钮组件。
 * @param props 组件参数。
 * @returns 偏好设置按钮节点。
 */
export const PreferencesButton = memo(function PreferencesButton({
  onOpenPreferences,
}: PreferencesButtonProps) {
  /**
   * 点击处理器。
   * @description 直接复用上层传入的打开偏好抽屉回调。
   */
  const handleClick = onOpenPreferences;
  return (
    <button
      type="button"
      className="header-widget-btn"
      data-widget="preferences"
      onClick={handleClick}
    >
      {renderLayoutIcon('settings', 'sm')}
    </button>
  );
});
