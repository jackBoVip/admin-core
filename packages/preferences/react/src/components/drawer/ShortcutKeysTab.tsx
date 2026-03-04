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

/**
 * 快捷键标签页组件属性。
 */
export interface ShortcutKeysTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** 界面配置（控制功能项显示/禁用） */
  uiConfig?: ShortcutKeysTabConfig;
}

/**
 * 单个快捷键开关项属性。
 */
interface ShortcutItemProps {
  /** 显示标签。 */
  label: string;
  /** 快捷键组合展示。 */
  shortcutKeys?: string[];
  /** 当前是否开启。 */
  checked: boolean;
  /** 点击或键盘触发时的开关回调。 */
  onChange: () => void;
  /** 是否禁用。 */
  disabled?: boolean;
}

/**
 * 快捷键开关行组件。
 * @param props 快捷键项参数。
 * @returns 快捷键行节点。
 */
const ShortcutItem = memo<ShortcutItemProps>(function ShortcutItem({
  label,
  shortcutKeys,
  checked,
  onChange,
  disabled = false,
}) {
  /**
   * 处理快捷键项点击
   * @description 在可操作状态下触发开关切换回调。
   */
  const handleClick = useCallback(() => {
    if (!disabled) onChange();
  }, [disabled, onChange]);

  /**
   * 处理快捷键项键盘交互
   * @description 在可操作状态下，空格或回车触发开关切换。
   * @param e React 键盘事件对象。
   */
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

/**
 * 快捷键设置标签页组件。
 * @param props 组件参数。
 * @returns 快捷键设置标签页节点。
 */
export const ShortcutKeysTab: React.FC<ShortcutKeysTabProps> = memo(({ locale, uiConfig }) => {
  const { preferences, setPreferences } = usePreferences();

  /**
   * UI 配置解析区。
   * @description 解析快捷键分组及子项的显示与禁用状态。
   */
  /**
   * 读取快捷键标签页功能配置
   * @description 按分组与子项解析配置，返回可见/禁用状态。
   * @param blockKey 配置分组键。
   * @param itemKey 分组内功能项键。
   * @returns 解析后的功能配置对象。
   */
  const getConfig = useCallback(
    (blockKey: keyof ShortcutKeysTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  /**
   * 快捷键标签页配置快照。
   * @description 统一收拢主开关与各快捷键子项配置，便于渲染层直接读取。
   */
  const configs = useMemo(() => ({
    shortcuts: getConfig('shortcuts'),
    enable: getConfig('shortcuts', 'enable'),
    globalPreferences: getConfig('shortcuts', 'globalPreferences'),
    globalSearch: getConfig('shortcuts', 'globalSearch'),
    globalLockScreen: getConfig('shortcuts', 'globalLockScreen'),
    globalLogout: getConfig('shortcuts', 'globalLogout'),
  }), [getConfig]);

  /**
   * 当前是否为 macOS 运行环境。
   * @description 用于决定快捷键展示时使用 `Command` 或 `Ctrl` 等差异文案。
   */
  const isMac = useMemo(() => isMacOs(), []);

  /**
   * 获取快捷键显示按键
   * @description 根据操作系统返回对应快捷键组合文案。
   * @param key 快捷键配置键名。
   * @returns 按键字符串数组。
   */
  const getKeys = useCallback(
    (key: string) => getShortcutKeys(key, isMac),
    [isMac]
  );

  /**
   * 偏好设置快照引用。
   * @description 供稳定回调读取最新开关值，避免依赖膨胀导致回调重建。
   */
  const preferencesRef = React.useRef(preferences);
  
  /**
   * 同步最新偏好设置到引用。
   * @description 在副作用阶段更新，避免渲染阶段写 ref 产生副作用。
   */
  React.useEffect(() => {
    preferencesRef.current = preferences;
  });
  
  /**
   * 切换快捷键总开关
   * @description 开启或关闭整套快捷键能力。
   */
  const handleToggleEnable = useCallback(() => {
    setPreferences({ shortcutKeys: { enable: !preferencesRef.current.shortcutKeys.enable } });
  }, [setPreferences]);

  /**
   * 切换“打开偏好设置”快捷键
   * @description 控制该快捷键是否生效。
   */
  const handleToggleGlobalPreferences = useCallback(() => {
    setPreferences({ shortcutKeys: { globalPreferences: !preferencesRef.current.shortcutKeys.globalPreferences } });
  }, [setPreferences]);

  /**
   * 切换“全局搜索”快捷键
   * @description 控制该快捷键是否生效。
   */
  const handleToggleGlobalSearch = useCallback(() => {
    setPreferences({ shortcutKeys: { globalSearch: !preferencesRef.current.shortcutKeys.globalSearch } });
  }, [setPreferences]);

  /**
   * 切换“锁屏”快捷键
   * @description 控制该快捷键是否生效。
   */
  const handleToggleGlobalLockScreen = useCallback(() => {
    setPreferences({ shortcutKeys: { globalLockScreen: !preferencesRef.current.shortcutKeys.globalLockScreen } });
  }, [setPreferences]);

  /**
   * 切换“退出登录”快捷键
   * @description 控制该快捷键是否生效。
   */
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

/**
 * 默认导出快捷键设置 Tab 组件。
 */
export default ShortcutKeysTab;
