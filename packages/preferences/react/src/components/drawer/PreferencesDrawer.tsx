/**
 * 偏好设置抽屉组件
 * @description 完整的偏好设置面板，保持与 Vben Admin 一致的样式
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePreferences } from '../../hooks';
import { createPortal } from 'react-dom';
import {
  getIcon,
  getLocaleByPreferences,
  getDrawerTabs,
  getDrawerHeaderActions,
  copyPreferencesConfig,
  importPreferencesConfig,
  getIconStyle,
  createCopyButtonController,
  getCopyButtonA11yProps,
  type CopyButtonState,
  type DrawerTabType,
  type DrawerHeaderActionType,
} from '@admin-core/preferences';
import { AppearanceTab } from './AppearanceTab';
import { LayoutTab } from './LayoutTab';
import { ShortcutKeysTab } from './ShortcutKeysTab';
import { GeneralTab } from './GeneralTab';

// 图标缓存（移到组件外部避免重复获取）
const ICONS = {
  copy: getIcon('copy'),
  check: getIcon('check'),
  alertCircle: getIcon('alertCircle'),
} as const;

// 图标样式缓存（移到组件外部避免重复计算）
const ICON_STYLES = {
  md: getIconStyle('md'),
  sm: getIconStyle('sm'),
} as const;

export interface PreferencesDrawerProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlay?: boolean;
  /** 是否显示固定按钮 */
  showPinButton?: boolean;
  /** 固定状态变化回调 */
  onPinChange?: (pinned: boolean) => void;
}

export const PreferencesDrawer: React.FC<PreferencesDrawerProps> = ({
  open,
  onClose,
  showOverlay = true,
  closeOnOverlay = true,
  showPinButton = true, // 默认显示固定按钮（与 Vben 一致）
  onPinChange,
}) => {
  const { preferences, resetPreferences, setPreferences, hasChanges } = usePreferences();

  // 当前激活的标签
  const [activeTab, setActiveTab] = useState<DrawerTabType>('appearance');

  // 内容容器引用
  const bodyRef = useRef<HTMLDivElement>(null);

  // 切换标签
  const handleTabChange = useCallback((tab: DrawerTabType) => {
    setActiveTab(tab);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, []);

  // 是否固定标签栏
  const [isPinned, setIsPinned] = useState(false);

  // 导入错误弹窗状态
  const [importError, setImportError] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // 关闭错误弹窗
  const closeImportError = useCallback(() => {
    setImportError({ show: false, message: '' });
  }, []);

  // 复制按钮控制器
  const copyControllerRef = useRef(createCopyButtonController());
  const [copyState, setCopyState] = useState<CopyButtonState>(() => 
    copyControllerRef.current.getInitialState()
  );

  // 监听偏好设置变化，自动重置复制状态
  useEffect(() => {
    if (copyControllerRef.current.shouldResetOnChange(copyState, preferences)) {
      setCopyState(copyControllerRef.current.reset());
    }
  }, [preferences, copyState]);

  // 组件销毁时清理
  useEffect(() => {
    const controller = copyControllerRef.current;
    return () => {
      controller.dispose();
    };
  }, []);

  // 国际化文本（使用 core 的工具函数）
  const locale = useMemo(
    () => getLocaleByPreferences(preferences),
    [preferences]
  );

  // 标签配置（使用 core 的工具函数）
  const tabs = useMemo(() => getDrawerTabs(locale), [locale]);

  // 头部操作按钮配置（使用 core 的共享配置）
  const headerActions = useMemo(() => {
    const excludeActions: DrawerHeaderActionType[] = showPinButton ? [] : ['pin'];
    return getDrawerHeaderActions(locale, {
      hasChanges,
      isPinned,
      exclude: excludeActions,
    });
  }, [locale, hasChanges, isPinned, showPinButton]);

  // 点击遮罩
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlay) {
      onClose();
    }
  }, [closeOnOverlay, onClose]);

  // 导入配置
  const handleImportConfig = useCallback(async () => {
    const result = await importPreferencesConfig();
    
    if (result.success && result.config) {
      // 导入成功，更新配置
      setPreferences(result.config);
    } else {
      // 导入失败，显示错误弹窗
      let errorMessage = '';
      switch (result.errorType) {
        case 'CLIPBOARD_ACCESS_DENIED':
          errorMessage = locale.preferences.importErrorClipboardAccess;
          break;
        case 'EMPTY_CLIPBOARD':
          errorMessage = locale.preferences.importErrorEmpty;
          break;
        case 'PARSE_ERROR':
          errorMessage = locale.preferences.importErrorParse;
          break;
        case 'VALIDATION_ERROR':
          errorMessage = locale.preferences.importErrorValidation;
          break;
        default:
          errorMessage = locale.preferences.importErrorValidation;
      }
      setImportError({ show: true, message: errorMessage });
    }
  }, [locale.preferences, setPreferences]);

  // 处理头部操作按钮点击
  const handleHeaderAction = useCallback((type: DrawerHeaderActionType) => {
    switch (type) {
      case 'import':
        handleImportConfig();
        break;
      case 'reset':
        resetPreferences();
        break;
      case 'pin':
        setIsPinned((prev) => {
          const next = !prev;
          onPinChange?.(next);
          return next;
        });
        break;
      case 'close':
        onClose();
        break;
    }
  }, [handleImportConfig, resetPreferences, onClose, onPinChange]);

  // 复制配置（使用 core 的工具函数和控制器）
  const handleCopyConfig = useCallback(async () => {
    if (preferences && !copyState.isCopied) {
      const success = await copyPreferencesConfig(preferences);
      if (success) {
        setCopyState(copyControllerRef.current.handleCopySuccess(preferences));
        // 设置自动恢复定时器
        copyControllerRef.current.scheduleAutoReset(() => {
          setCopyState(copyControllerRef.current.getInitialState());
        });
      }
    }
  }, [preferences, copyState.isCopied]);

  // 无障碍属性
  const copyButtonA11y = useMemo(
    () => getCopyButtonA11yProps(copyState.isCopied),
    [copyState.isCopied]
  );

  // 渲染当前标签内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceTab locale={locale} />;
      case 'layout':
        return <LayoutTab locale={locale} />;
      case 'shortcutKeys':
        return <ShortcutKeysTab locale={locale} />;
      case 'general':
        return <GeneralTab locale={locale} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      {showOverlay && (
        <div
          className={`preferences-drawer-overlay ${open ? 'open' : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* 抽屉 */}
      <div className={`preferences-drawer ${open ? 'open' : ''}`}>
        {/* 头部（Vben 风格：标题+副标题同行） */}
        <div className="preferences-drawer-header">
          <div className="preferences-drawer-title-wrapper">
            <div className="preferences-drawer-title">{locale.preferences.title}</div>
            <div className="preferences-drawer-description">
              {locale.preferences.description}
            </div>
          </div>
          <div className="preferences-drawer-actions">
            {headerActions.map((action) => (
              <button
                key={action.type}
                className={`preferences-btn-icon${action.showIndicator ? ' relative' : ''}`}
                disabled={action.disabled}
                data-preference-tooltip={action.tooltip || undefined}
                onClick={() => handleHeaderAction(action.type)}
              >
                {action.showIndicator && <span className="dot" />}
                <span
                  dangerouslySetInnerHTML={{ __html: action.icon }}
                  style={ICON_STYLES.md}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div ref={bodyRef} className="preferences-drawer-body">
          {/* 分段标签（Vben Segmented 风格） */}
          <div className={`preferences-tabs-wrapper${isPinned ? ' sticky' : ''}`}>
            <div className="preferences-segmented">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`preferences-segmented-item ${activeTab === tab.value ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 标签内容 */}
          {renderTabContent()}
        </div>

        {/* 底部 */}
        <div className="preferences-drawer-footer">
          <button
            className={`preferences-btn preferences-btn-primary${copyState.isCopied ? ' is-copied' : ''}`}
            disabled={!hasChanges || copyState.isCopied}
            onClick={handleCopyConfig}
            {...copyButtonA11y}
          >
            <span
              className="copy-btn-icon"
              dangerouslySetInnerHTML={{ __html: copyState.isCopied ? ICONS.check : ICONS.copy }}
              style={ICON_STYLES.sm}
            />
            <span className="copy-btn-text">
              {copyState.isCopied ? locale.preferences.copied : locale.preferences.copyConfig}
            </span>
          </button>
        </div>
      </div>

      {/* 导入错误弹窗 */}
      {importError.show && createPortal(
        <div className="preferences-modal-overlay" onClick={closeImportError}>
          <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preferences-modal-header">
              <span
                className="preferences-modal-icon error"
                dangerouslySetInnerHTML={{ __html: ICONS.alertCircle }}
              />
              <span className="preferences-modal-title">
                {locale.preferences.importErrorTitle}
              </span>
            </div>
            <div className="preferences-modal-body">
              {importError.message}
            </div>
            <div className="preferences-modal-footer">
              <button
                className="preferences-btn preferences-btn-primary"
                onClick={closeImportError}
              >
                {locale.common.confirm}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PreferencesDrawer;
