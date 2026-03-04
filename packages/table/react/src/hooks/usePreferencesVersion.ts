/**
 * Table React 偏好主题版本 Hook。
 * @description 订阅偏好中心主题相关字段变化，并输出稳定版本摘要字符串。
 */
import {
  getActualThemeMode,
  getDefaultPreferencesStore,
} from '@admin-core/preferences';
import { useSyncExternalStore } from 'react';

/**
 * 默认偏好设置存储实例。
 */
const preferencesStore = getDefaultPreferencesStore();

/**
 * 生成主题快照版本字符串。
 * @returns 主题版本摘要。
 */
function getThemeSnapshotVersion() {
  /**
   * 当前偏好快照。
   * @description 来源于默认偏好 store，用于生成主题签名。
   */
  const preferences = preferencesStore.getPreferences();
  if (!preferences) {
    return '';
  }
  const theme = preferences.theme;
  /**
   * 实际生效主题模式。
   * @description 将 `auto` 模式解析为当前环境真实模式。
   */
  const actualMode = getActualThemeMode(theme.mode);
  return [
    theme.builtinType,
    theme.mode,
    actualMode,
    theme.colorPrimary,
    theme.fontScale,
    theme.radius,
  ].join('|');
}

/**
 * 偏好主题版本摘要值类型。
 */
type PreferencesThemeVersion = ReturnType<typeof getThemeSnapshotVersion>;

/**
 * 订阅主题偏好版本变化。
 * @returns 主题版本摘要字符串。
 */
export function usePreferencesVersion(): PreferencesThemeVersion {
  return useSyncExternalStore(
    (listener) => preferencesStore.subscribe(listener),
    getThemeSnapshotVersion,
    getThemeSnapshotVersion
  );
}
