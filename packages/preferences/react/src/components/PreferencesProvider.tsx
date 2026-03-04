/**
 * 偏好设置提供者组件。
 * @description 自动集成锁屏、快捷键、水印与设置抽屉能力，并在首次加载时自动初始化管理器。
 */
import { logger, type PreferencesDrawerUIConfig } from '@admin-core/preferences';
import React, { memo, useCallback, useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import { usePreferences, useLockScreen, useShortcutKeys, initPreferences, isPreferencesInitialized, getPreferencesManager } from '../hooks';
import { PreferencesDrawer, type PreferencesDrawerProps } from './drawer';
import { PreferencesTrigger, type PreferencesTriggerProps } from './drawer/PreferencesTrigger';
import { LockScreen } from './lock-screen';
import { LockPasswordModal } from './lock-screen/LockPasswordModal';
import { Watermark } from './Watermark';

/**
 * 自动初始化偏好设置管理器，确保后续 Hook 可直接读取实例。
 */
if (!isPreferencesInitialized()) {
  try {
    initPreferences({ namespace: 'admin-core' });
  } catch (initError) {
    logger.error('Failed to initialize preferences manager', initError);
    throw initError;
  }
}

/**
 * Preferences 上下文类型。
 * @description 向子组件暴露抽屉控制与锁屏控制等全局能力。
 */
export interface PreferencesContextValue {
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

/**
 * Provider 内部回调引用结构。
 * @description 使用 `ref` 保存最新外部回调，避免因回调引用变化导致上下文对象频繁重建。
 */
interface ProviderCallbacksRef {
  /** 锁屏回调。 */
  onLock?: () => void;
  /** 解锁回调。 */
  onUnlock?: () => void;
  /** 搜索回调。 */
  onSearch?: () => void;
  /** 退出登录回调。 */
  onLogout?: () => void;
}

/**
 * 偏好设置上下文对象。
 * @description 承载抽屉、锁屏等全局能力，供树内任意子组件消费。
 */
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * 使用偏好设置上下文。
 * @description 必须在 `PreferencesProvider` 作用域内调用。
 * @returns 偏好设置上下文对象。
 * @throws 当未处于 `PreferencesProvider` 子树时抛出错误。
 */
export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}

/**
 * 偏好设置 Provider 组件参数。
 * @description 定义 Provider 的功能开关、外部回调和用户信息输入。
 */
export interface PreferencesProviderProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 是否显示触发按钮 */
  showTrigger?: boolean;
  /** 触发按钮配置 */
  triggerProps?: Omit<PreferencesTriggerProps, 'onClick'>;
  /** 抽屉配置 */
  drawerProps?: Omit<PreferencesDrawerProps, 'open' | 'onClose'>;
  /** 界面配置（控制功能项显示/禁用）- 便捷属性，等同于 drawerProps.uiConfig */
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

/**
 * 偏好设置 Provider 组件。
 * @description 提供抽屉、锁屏、水印与快捷键等全局能力。
 */
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
  /**
   * 偏好写入方法。
   * @description 用于在锁屏流程中更新锁定状态。
   */
  const { setPreferences } = usePreferences();
  const {
    isLocked,
    hasPassword,
    isEnabled: isLockEnabled,
    unlock: doUnlock,
  } = useLockScreen();

  /**
   * 偏好抽屉开关状态。
   */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /**
   * 锁屏密码设置弹窗开关状态。
   */
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  /**
   * 使用 ref 存储最新回调，避免 Context 值因回调变化频繁重建。
   */
  const callbacksRef = useRef<ProviderCallbacksRef>({
    onLock,
    onUnlock,
    onSearch,
    onLogout,
  });
  /**
   * 同步外部回调引用。
   * @description 让快捷键与锁屏流程始终调用到最新回调实现。
   */
  useEffect(() => {
    callbacksRef.current = { onLock, onUnlock, onSearch, onLogout };
  }, [onLock, onUnlock, onSearch, onLogout]);

  /**
   * 打开偏好设置抽屉
   * @description 将抽屉状态设置为打开。
   */
  const openPreferences = useCallback(() => setDrawerOpen(true), []);
  /**
   * 关闭偏好设置抽屉
   * @description 将抽屉状态设置为关闭。
   */
  const closePreferences = useCallback(() => setDrawerOpen(false), []);
  /**
   * 切换偏好设置抽屉状态
   * @description 在打开与关闭状态之间翻转。
   */
  const togglePreferences = useCallback(() => setDrawerOpen(prev => !prev), []);

  /**
   * 锁屏重入保护标记。
   */
  const isLockingRef = useRef(false);

  /**
   * 执行锁屏流程
   * @description
   * 仅在锁屏功能可用时生效；未设置密码时弹出设置弹窗，
   * 已设置密码时进入锁屏并触发外部锁屏回调。
   */
  const lock = useCallback(() => {
    /** 检查锁屏功能是否启用。 */
    if (!isLockEnabled) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return;
    }

    /** 已锁定或锁屏流程进行中时直接返回，避免重复调用。 */
    if (isLocked || isLockingRef.current) {
      return;
    }

    /** 未设置密码时弹出密码设置弹窗。 */
    if (!hasPassword) {
      setTimeout(() => setPasswordModalOpen(true), 0);
      return;
    }

    /** 已有密码时执行锁屏。 */
    isLockingRef.current = true;
    setTimeout(() => {
      try {
        setPreferences({ lockScreen: { isLocked: true } });
        /*
         * `setPreferences` 内部已具备防抖落盘逻辑，
         * 这里无需手动调用 `flush`，避免重复保存。
         */
        callbacksRef.current.onLock?.();
      } finally {
        /** 延迟重置标记，避免快速连续触发。 */
        setTimeout(() => {
          isLockingRef.current = false;
        }, 100);
      }
    }, 0);
  }, [isLockEnabled, hasPassword, isLocked, setPreferences]);

  /**
   * 处理密码设置成功事件
   * @description 关闭密码设置弹窗并通知外层锁屏已完成。
   */
  const handlePasswordSuccess = useCallback(() => {
    setPasswordModalOpen(false);
    callbacksRef.current.onLock?.();
  }, []);

  /**
   * 执行解锁流程
   * @description 调用锁屏 Hook 解锁并刷新持久化状态，随后通知外层。
   */
  const unlock = useCallback(() => {
    doUnlock();
    try {
      getPreferencesManager()?.flush?.();
    } catch {}
    callbacksRef.current.onUnlock?.();
  }, [doUnlock]);

  /**
   * 触发全局搜索回调
   * @description 将搜索事件转发给外部传入的回调函数。
   */
  const handleSearch = useCallback(() => {
    callbacksRef.current.onSearch?.();
  }, []);

  /**
   * 触发登出回调
   * @description 将登出事件转发给外部传入的回调函数。
   */
  const handleLogout = useCallback(() => {
    callbacksRef.current.onLogout?.();
  }, []);

  /**
   * 注册全局快捷键。
   * @description 将快捷键触发行为绑定到抽屉切换、搜索、锁屏与登出动作。
   */
  useShortcutKeys({
    onPreferences: togglePreferences,
    onSearch: handleSearch,
    onLockScreen: lock,
    onLogout: handleLogout,
  });

  /**
   * 提供给子组件的偏好上下文值。
   * @description 通过 `useMemo` 保持对象引用稳定，减少子树不必要重渲染。
   */
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

/**
 * 默认导出偏好设置 Provider 组件。
 */
export default PreferencesProvider;
