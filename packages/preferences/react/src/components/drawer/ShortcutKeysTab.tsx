/**
 * 快捷键设置标签页
 * @description 全局快捷键、搜索、锁屏等设置，显示快捷键组合
 */
import { 
  getShortcutKeys, 
  isMacOs, 
  getFeatureItemConfig,
  type LocaleMessages,
  type ShortcutKeysTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import React, { memo, useCallback, useMemo } from 'react';
import { usePreferences } from '../../hooks';
import { Block } from './Block';

export interface ShortcutKeysTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: ShortcutKeysTabConfig;
}

interface ShortcutItemProps {
  label: string;
  shortcutKeys?: string[];
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ShortcutItem = memo<ShortcutItemProps>(function ShortcutItem({
  label,
  shortcutKeys,
  checked,
  onChange,
  disabled = false,
}) {
  const handleClick = useCallback(() => {
    if (!disabled) onChange();
  }, [disabled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange();
      }
    },
    [disabled, onChange]
  );

  return (
    <div
      className={`shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground ${disabled ? 'disabled' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      data-state={checked ? 'active' : 'inactive'}
      data-disabled={disabled ? 'true' : undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="shortcut-item-label pref-disabled-label">{label}</span>
      <div className="shortcut-item-right">
        {shortcutKeys && shortcutKeys.length > 0 && (
          <div className="shortcut-keys">
            {shortcutKeys.map((key) => (
              <kbd key={key} className="shortcut-key">{key}</kbd>
            ))}
          </div>
        )}
        <div
          className={`preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30 ${checked ? 'checked' : ''}`}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={disabled ? 'true' : undefined}
        >
          <span className="preferences-switch-thumb" />
        </div>
      </div>
    </div>
  );
});

export const ShortcutKeysTab: React.FC<ShortcutKeysTabProps> = memo(({ locale, uiConfig }) => {
  const { preferences, setPreferences } = usePreferences();

  // ========== UI 配置解析（使用 useMemo 缓存） ==========
  const getConfig = useCallback(
    (blockKey: keyof ShortcutKeysTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  // 缓存常用配置项
  const configs = useMemo(() => ({
    shortcuts: getConfig('shortcuts'),
    enable: getConfig('shortcuts', 'enable'),
    globalPreferences: getConfig('shortcuts', 'globalPreferences'),
    globalSearch: getConfig('shortcuts', 'globalSearch'),
    globalLockScreen: getConfig('shortcuts', 'globalLockScreen'),
    globalLogout: getConfig('shortcuts', 'globalLogout'),
  }), [getConfig]);

  // 检测是否为 Mac 系统
  const isMac = useMemo(() => isMacOs(), []);

  // 获取快捷键按键列表
  const getKeys = useCallback(
    (key: string) => getShortcutKeys(key, isMac),
    [isMac]
  );

  // ========== 稳定的回调函数（使用 ref 获取最新值，避免依赖变化导致重渲染） ==========
  const preferencesRef = React.useRef(preferences);
  
  // 在 useEffect 中更新 ref，避免在渲染期间产生副作用
  React.useEffect(() => {
    preferencesRef.current = preferences;
  });
  
  const handleToggleEnable = useCallback(() => {
    setPreferences({ shortcutKeys: { enable: !preferencesRef.current.shortcutKeys.enable } });
  }, [setPreferences]);

  const handleToggleGlobalPreferences = useCallback(() => {
    setPreferences({ shortcutKeys: { globalPreferences: !preferencesRef.current.shortcutKeys.globalPreferences } });
  }, [setPreferences]);

  const handleToggleGlobalSearch = useCallback(() => {
    setPreferences({ shortcutKeys: { globalSearch: !preferencesRef.current.shortcutKeys.globalSearch } });
  }, [setPreferences]);

  const handleToggleGlobalLockScreen = useCallback(() => {
    setPreferences({ shortcutKeys: { globalLockScreen: !preferencesRef.current.shortcutKeys.globalLockScreen } });
  }, [setPreferences]);

  const handleToggleGlobalLogout = useCallback(() => {
    setPreferences({ shortcutKeys: { globalLogout: !preferencesRef.current.shortcutKeys.globalLogout } });
  }, [setPreferences]);

  const isEnabled = preferences.shortcutKeys.enable;

  if (!configs.shortcuts.visible) {
    return null;
  }

  return (
    <Block title={locale.shortcutKeys.title}>
      {/* 启用快捷键 - 主开关 */}
      {configs.enable.visible && (
        <ShortcutItem
          label={locale.shortcutKeys.enable}
          checked={isEnabled}
          onChange={handleToggleEnable}
          disabled={configs.enable.disabled}
        />
      )}

      {/* 打开设置 */}
      {configs.globalPreferences.visible && (
        <ShortcutItem
          label={locale.shortcutKeys.globalPreferences}
          shortcutKeys={getKeys('globalPreferences')}
          checked={preferences.shortcutKeys.globalPreferences}
          onChange={handleToggleGlobalPreferences}
          disabled={!isEnabled || configs.globalPreferences.disabled}
        />
      )}

      {/* 全局搜索 */}
      {configs.globalSearch.visible && (
        <ShortcutItem
          label={locale.shortcutKeys.globalSearch}
          shortcutKeys={getKeys('globalSearch')}
          checked={preferences.shortcutKeys.globalSearch}
          onChange={handleToggleGlobalSearch}
          disabled={!isEnabled || configs.globalSearch.disabled}
        />
      )}

      {/* 锁屏 */}
      {configs.globalLockScreen.visible && (
        <ShortcutItem
          label={locale.shortcutKeys.globalLockScreen}
          shortcutKeys={getKeys('globalLockScreen')}
          checked={preferences.shortcutKeys.globalLockScreen}
          onChange={handleToggleGlobalLockScreen}
          disabled={!isEnabled || configs.globalLockScreen.disabled}
        />
      )}

      {/* 登出 */}
      {configs.globalLogout.visible && (
        <ShortcutItem
          label={locale.shortcutKeys.globalLogout}
          shortcutKeys={getKeys('globalLogout')}
          checked={preferences.shortcutKeys.globalLogout}
          onChange={handleToggleGlobalLogout}
          disabled={!isEnabled || configs.globalLogout.disabled}
        />
      )}
    </Block>
  );
});

ShortcutKeysTab.displayName = 'ShortcutKeysTab';

export default ShortcutKeysTab;
