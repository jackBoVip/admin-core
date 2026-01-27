/**
 * 偏好设置触发按钮
 */
import React from 'react';
import { getIcon } from '@admin-core/preferences';

export interface PreferencesTriggerProps {
  /** 是否显示 */
  show?: boolean;
  /** 点击回调 */
  onClick: () => void;
}

export const PreferencesTrigger: React.FC<PreferencesTriggerProps> = ({
  show = true,
  onClick,
}) => {
  const settingsIcon = getIcon('settings');

  if (!show) return null;

  return (
    <button className="preferences-trigger" onClick={onClick}>
      <span dangerouslySetInnerHTML={{ __html: settingsIcon }} />
    </button>
  );
};

export default PreferencesTrigger;
