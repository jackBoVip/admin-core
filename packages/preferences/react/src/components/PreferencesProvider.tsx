/**
 * 偏好设置提供者组件
 * @description 自动集成锁屏、快捷键等功能，用户无需手动添加
 * 自动初始化偏好设置管理器，用户无需手动调用 initPreferences
 */
import React, { memo, useCallback, useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import { logger, type PreferencesDrawerUIConfig } from '@admin-core/preferences';
import { usePreferences, useLockScreen, useShortcutKeys, initPreferences, getPreferencesManager } from '../hooks';
import { LockScreen } from './lock-screen';
import { LockPasswordModal } from './lock-screen/LockPasswordModal';
import { PreferencesDrawer, type PreferencesDrawerProps } from './drawer';
import { PreferencesTrigger, type PreferencesTriggerProps } from './drawer/PreferencesTrigger';
import { Watermark } from './Watermark';

// 自动初始化偏好设置管理器（确保在 usePreferences 调用前初始化）
try {
  getPreferencesManager();
} catch (error) {
  logger.warn('Preferences manager not initialized, initializing...', error);
  try {
    initPreferences({ namespace: 'admin-core' });
  } catch (initError) {
    logger.error('Failed to initialize preferences manager', initError);
    throw initError;
  }
}

/**
 * Preferences Context 类型
 */
interface PreferencesContextValue {
  /** 打开偏好设置抽屉 */
  openPreferences: () => void;
  /** 关闭偏好设置抽屉 */
  closePreferences: () => void;
  /** 切换偏好设置抽屉 */
  togglePreferences: () => void;
  /** 抽屉是否打开 */
  isPreferencesOpen: boolean;
  /** 锁定屏幕（如果没有密码会弹出设置弹窗） */
  lock: () => void;
  /** 解锁屏幕 */
  unlock: () => void;
  /** 是否已锁定 */
  isLocked: boolean;
  /** 是否已设置密码 */
  hasPassword: boolean;
  /** 是否启用锁屏功能 */
  isLockEnabled: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * 使用偏好设置上下文
 */
export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}

export interface PreferencesProviderProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 是否显示触发按钮 */
  showTrigger?: boolean;
  /** 触发按钮配置 */
  triggerProps?: Omit<PreferencesTriggerProps, 'onClick'>;
  /** 抽屉配置 */
  drawerProps?: Omit<PreferencesDrawerProps, 'open' | 'onClose'>;
  /** UI 配置（控制功能项显示/禁用）- 便捷属性，等同于 drawerProps.uiConfig */
  uiConfig?: PreferencesDrawerUIConfig;
  /** 退出登录回调 */
  onLogout?: () => void;
  /** 全局搜索回调 */
  onSearch?: () => void;
  /** 锁屏时回调 */
  onLock?: () => void;
  /** 解锁时回调 */
  onUnlock?: () => void;
  /** 用户头像 URL */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 锁屏背景图片 URL，传入空字符串禁用背景，不传则使用默认背景 */
  lockScreenBackground?: string;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = memo(({
  children,
  showTrigger = true,
  triggerProps,
  drawerProps,
  uiConfig,
  onLogout,
  onSearch,
  onLock,
  onUnlock,
  avatar,
  username,
  lockScreenBackground,
}) => {
  const { setPreferences } = usePreferences();
  const {
    isLocked,
    hasPassword,
    isEnabled: isLockEnabled,
    unlock: doUnlock,
  } = useLockScreen();

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 密码设置弹窗状态
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // 使用 ref 存储最新的回调函数，避免 Context 值频繁变化
  const callbacksRef = useRef({ onLock, onUnlock, onSearch, onLogout });
  useEffect(() => {
    callbacksRef.current = { onLock, onUnlock, onSearch, onLogout };
  }, [onLock, onUnlock, onSearch, onLogout]);

  // 打开/关闭抽屉
  const openPreferences = useCallback(() => setDrawerOpen(true), []);
  const closePreferences = useCallback(() => setDrawerOpen(false), []);
  const togglePreferences = useCallback(() => setDrawerOpen(prev => !prev), []);

  // 锁屏操作 - 使用 ref 读取最新回调
  const lock = useCallback(() => {
    // 检查锁屏功能是否启用
    if (!isLockEnabled) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return;
    }

    // 如果没有设置密码，弹出设置密码弹窗
    if (!hasPassword) {
      setPasswordModalOpen(true);
      return;
    }

    // 已有密码，直接锁屏
    setPreferences({ lockScreen: { isLocked: true } });
    callbacksRef.current.onLock?.();
  }, [isLockEnabled, hasPassword, setPreferences]);

  // 密码设置成功后的回调（已锁屏）
  const handlePasswordSuccess = useCallback(() => {
    setPasswordModalOpen(false);
    callbacksRef.current.onLock?.();
  }, []);

  const unlock = useCallback(() => {
    doUnlock();
    callbacksRef.current.onUnlock?.();
  }, [doUnlock]);

  // 搜索回调 - 使用 ref 读取最新回调
  const handleSearch = useCallback(() => {
    callbacksRef.current.onSearch?.();
  }, []);

  // 登出回调 - 使用 ref 读取最新回调
  const handleLogout = useCallback(() => {
    callbacksRef.current.onLogout?.();
  }, []);

  // 注册全局快捷键
  useShortcutKeys({
    onPreferences: togglePreferences,
    onSearch: handleSearch,
    onLockScreen: lock,
    onLogout: handleLogout,
  });

  // Context 值 - 现在依赖更稳定
  const contextValue = useMemo<PreferencesContextValue>(() => ({
    openPreferences,
    closePreferences,
    togglePreferences,
    isPreferencesOpen: drawerOpen,
    lock,
    unlock,
    isLocked,
    hasPassword,
    isLockEnabled,
  }), [openPreferences, closePreferences, togglePreferences, drawerOpen, lock, unlock, isLocked, hasPassword, isLockEnabled]);

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}

      {/* 水印 - 自动渲染 */}
      <Watermark />

      {/* 锁屏页面 - 自动渲染 */}
      <LockScreen
        onLogout={handleLogout}
        avatar={avatar}
        username={username}
        backgroundImage={lockScreenBackground}
      />

      {/* 锁屏密码设置弹窗 */}
      <LockPasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* 触发按钮 */}
      {showTrigger && (
        <PreferencesTrigger
          {...triggerProps}
          onClick={openPreferences}
        />
      )}

      {/* 偏好设置抽屉 */}
      <PreferencesDrawer
        {...drawerProps}
        uiConfig={uiConfig ?? drawerProps?.uiConfig}
        open={drawerOpen}
        onClose={closePreferences}
      />
    </PreferencesContext.Provider>
  );
});

PreferencesProvider.displayName = 'PreferencesProvider';

export default PreferencesProvider;
