/**
 * 偏好设置触发按钮。
 * @description 提供浮动入口用于打开偏好抽屉，可按需通过 `show` 控制显隐。
 */
import { getIcon, getLocaleByPreferences } from '@admin-core/preferences';
import React, { memo } from 'react';
import { usePreferences } from '../../hooks';

/**
 * 设置图标缓存。
 * @description 提升渲染性能，避免组件每次渲染都重新读取图标 SVG 文本。
 */
const settingsIcon = getIcon('settings');

/**
 * 偏好设置触发按钮参数。
 */
export interface PreferencesTriggerProps {
  /** 是否显示 */
  show?: boolean;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 偏好设置抽屉触发按钮组件。
 */
export const PreferencesTrigger: React.FC<PreferencesTriggerProps> = memo(({
  show = true,
  onClick,
}) => {
  /**
   * 当前偏好快照。
   */
  const { preferences } = usePreferences();
  /**
   * 当前语言包。
   */
  const locale = getLocaleByPreferences(preferences);
  /**
   * 触发按钮标题文案。
   */
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

/**
 * 默认导出偏好设置触发按钮组件。
 */
export default PreferencesTrigger;
