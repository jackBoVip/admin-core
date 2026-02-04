/**
 * 偏好设置触发按钮
 */
import { getIcon } from '@admin-core/preferences';
import React, { memo } from 'react';

// 图标缓存（移到组件外部，避免每次渲染重复获取）
const settingsIcon = getIcon('settings');

export interface PreferencesTriggerProps {
  /** 是否显示 */
  show?: boolean;
  /** 点击回调 */
  onClick: () => void;
}

export const PreferencesTrigger: React.FC<PreferencesTriggerProps> = memo(({
  show = true,
  onClick,
}) => {
  if (!show) return null;

  return (
    <button 
      className="preferences-trigger" 
      onClick={onClick}
      aria-label="打开偏好设置"
      title="偏好设置"
    >
      <span dangerouslySetInnerHTML={{ __html: settingsIcon }} aria-hidden="true" />
    </button>
  );
});

PreferencesTrigger.displayName = 'PreferencesTrigger';

export default PreferencesTrigger;
