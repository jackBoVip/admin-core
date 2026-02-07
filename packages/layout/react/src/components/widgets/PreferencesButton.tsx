/**
 * 偏好设置按钮
 * @description 打开偏好设置抽屉，hover时齿轮旋转
 */
import { memo } from 'react';
import { renderLayoutIcon } from '../../utils';

export interface PreferencesButtonProps {
  onOpenPreferences?: () => void;
}

export const PreferencesButton = memo(function PreferencesButton({
  onOpenPreferences,
}: PreferencesButtonProps) {

  return (
    <button
      type="button"
      className="header-widget-btn"
      data-widget="preferences"
      onClick={onOpenPreferences}
    >
      {renderLayoutIcon('settings', 'sm')}
    </button>
  );
});
