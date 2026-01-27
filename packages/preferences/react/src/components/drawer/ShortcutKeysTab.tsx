/**
 * 快捷键设置标签页
 * @description 全局快捷键、搜索、锁屏等设置
 */
import React, { memo, useCallback } from 'react';
import { usePreferences } from '../../hooks';
import type { LocaleMessages } from '@admin-core/preferences';
import { Block } from './Block';
import { SwitchItem } from './SwitchItem';

export interface ShortcutKeysTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

export const ShortcutKeysTab: React.FC<ShortcutKeysTabProps> = memo(({ locale }) => {
  const { preferences, setPreferences } = usePreferences();

  // ========== 稳定的回调函数 ==========
  const handleSetEnable = useCallback((v: boolean) => {
    setPreferences({ shortcutKeys: { enable: v } });
  }, [setPreferences]);

  const handleSetGlobalSearch = useCallback((v: boolean) => {
    setPreferences({ shortcutKeys: { globalSearch: v } });
  }, [setPreferences]);

  const handleSetGlobalLockScreen = useCallback((v: boolean) => {
    setPreferences({ shortcutKeys: { globalLockScreen: v } });
  }, [setPreferences]);

  return (
    <Block title={locale.shortcutKeys.title}>
      <SwitchItem
        label={locale.shortcutKeys.enable}
        checked={preferences.shortcutKeys.enable}
        onChange={handleSetEnable}
      />
      <SwitchItem
        label={locale.shortcutKeys.globalSearch}
        checked={preferences.shortcutKeys.globalSearch}
        onChange={handleSetGlobalSearch}
        disabled={!preferences.shortcutKeys.enable}
      />
      <SwitchItem
        label={locale.shortcutKeys.globalLockScreen}
        checked={preferences.shortcutKeys.globalLockScreen}
        onChange={handleSetGlobalLockScreen}
        disabled={!preferences.shortcutKeys.enable}
      />
    </Block>
  );
});

ShortcutKeysTab.displayName = 'ShortcutKeysTab';

export default ShortcutKeysTab;
