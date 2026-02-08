/**
 * 偏好设置触发按钮
 */
import { getIcon, getLocaleByPreferences } from '@admin-core/preferences';
import React, { memo } from 'react';
import { usePreferences } from '../../hooks';

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
  const { preferences } = usePreferences();
  const locale = getLocaleByPreferences(preferences);
  const title = locale.preferences?.title || 'Preferences';

  if (!show) return null;

  return (
    <button 
      className="preferences-trigger" 
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      <span dangerouslySetInnerHTML={{ __html: settingsIcon }} aria-hidden="true" />
    </button>
  );
});

PreferencesTrigger.displayName = 'PreferencesTrigger';

export default PreferencesTrigger;
