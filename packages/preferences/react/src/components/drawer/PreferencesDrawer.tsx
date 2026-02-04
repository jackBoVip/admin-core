/**
 * 偏好设置抽屉组件
 * @description 完整的偏好设置面板
 */
import {
  getIcon,
  getLocaleByPreferences,
  getVisibleDrawerTabs,
  getDrawerHeaderActions,
  copyPreferencesConfig,
  importPreferencesConfig,
  getIconStyle,
  createCopyButtonController,
  getCopyButtonA11yProps,
  getFeatureConfig,
  mergeDrawerUIConfig,
  logger,
  type CopyButtonState,
  type DrawerTabType,
  type DrawerHeaderActionType,
  type PreferencesDrawerUIConfig,
} from '@admin-core/preferences';
import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../../hooks';
import { AppearanceTab } from './AppearanceTab';
import { GeneralTab } from './GeneralTab';
import { LayoutTab } from './LayoutTab';
import { ShortcutKeysTab } from './ShortcutKeysTab';

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
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: PreferencesDrawerUIConfig;
}

export const PreferencesDrawer: React.FC<PreferencesDrawerProps> = memo(({
  open,
  onClose,
  showOverlay = true,
  closeOnOverlay = true,
  showPinButton = true,
  onPinChange,
  uiConfig,
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

  const handleTabClick = useCallback((e: React.MouseEvent) => {
    const tab = (e.currentTarget as HTMLElement).dataset.value as DrawerTabType | undefined;
    if (tab) {
      handleTabChange(tab);
    }
  }, [handleTabChange]);

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

  // 使用 ref 存储上一次的 preferences 引用，避免 useEffect 频繁触发
  const prevPreferencesRef = useRef(preferences);
  
  // 监听偏好设置变化，自动重置复制状态
  // 注意：只依赖 preferences，不依赖 copyState，避免循环触发
  useEffect(() => {
    // 只在引用实际变化时检查
    if (prevPreferencesRef.current !== preferences) {
      prevPreferencesRef.current = preferences;
      // 使用函数式更新获取最新 copyState
      setCopyState((currentCopyState) => {
        if (copyControllerRef.current.shouldResetOnChange(currentCopyState, preferences)) {
          return copyControllerRef.current.reset();
        }
        return currentCopyState;
      });
    }
  }, [preferences]);

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

  // 合并后的 UI 配置
  const mergedUIConfig = useMemo(
    () => mergeDrawerUIConfig(uiConfig),
    [uiConfig]
  );

  // 标签配置（根据 uiConfig 过滤）
  const tabs = useMemo(
    () => getVisibleDrawerTabs(locale, mergedUIConfig),
    [locale, mergedUIConfig]
  );

  const tabsIndexMap = useMemo(() => {
    const map = new Map<DrawerTabType, number>();
    tabs.forEach((tab, index) => map.set(tab.value, index));
    return map;
  }, [tabs]);

  // 计算当前激活 tab 的索引（用于滑动指示器动画）
  const activeTabIndex = useMemo(() => {
    const index = tabsIndexMap.get(activeTab);
    return index !== undefined ? index : 0;
  }, [tabsIndexMap, activeTab]);

  // 缓存 tabs 样式对象，避免每次渲染创建新对象
  const tabsStyle = useMemo(() => ({
    '--pref-tab-columns': tabs.length,
    '--pref-active-tab-index': activeTabIndex,
  } as React.CSSProperties), [tabs.length, activeTabIndex]);

  // 确保 activeTab 在可见 Tab 中
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.value === activeTab)) {
      setActiveTab(tabs[0].value);
    }
  }, [tabs, activeTab]);

  // 头部操作按钮配置（使用 core 的共享配置）
  const headerActions = useMemo(() => {
    const excludeActions: DrawerHeaderActionType[] = [];
    
    // 根据 showPinButton prop 和 uiConfig 过滤
    if (!showPinButton || !getFeatureConfig(mergedUIConfig, 'headerActions.pin').visible) {
      excludeActions.push('pin');
    }
    if (!getFeatureConfig(mergedUIConfig, 'headerActions.import').visible) {
      excludeActions.push('import');
    }
    if (!getFeatureConfig(mergedUIConfig, 'headerActions.reset').visible) {
      excludeActions.push('reset');
    }
    if (!getFeatureConfig(mergedUIConfig, 'headerActions.close').visible) {
      excludeActions.push('close');
    }
    
    const actions = getDrawerHeaderActions(locale, {
      hasChanges,
      isPinned,
      exclude: excludeActions,
    });

    // 应用 uiConfig 的 disabled 状态
    return actions.map(action => ({
      ...action,
      disabled: action.disabled || getFeatureConfig(mergedUIConfig, `headerActions.${action.type}`).disabled,
    }));
  }, [locale, hasChanges, isPinned, showPinButton, mergedUIConfig]);

  // 复制按钮配置
  const copyButtonConfig = useMemo(
    () => getFeatureConfig(mergedUIConfig, 'footerActions.copy'),
    [mergedUIConfig]
  );

  // 复制按钮是否可见
  const showCopyButton = copyButtonConfig.visible;

  // 复制按钮是否禁用
  const copyButtonDisabled = !hasChanges || copyState.isCopied || copyButtonConfig.disabled;

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

  const handleHeaderActionClick = useCallback((e: React.MouseEvent) => {
    const type = (e.currentTarget as HTMLElement).dataset.value as DrawerHeaderActionType | undefined;
    if (type) {
      handleHeaderAction(type);
    }
  }, [handleHeaderAction]);

  // 复制配置（使用 core 的工具函数和控制器，带错误处理）
  const handleCopyConfig = useCallback(async () => {
    if (preferences && !copyState.isCopied) {
      try {
        const success = await copyPreferencesConfig(preferences);
        if (success) {
          setCopyState(copyControllerRef.current.handleCopySuccess(preferences));
          // 设置自动恢复定时器
          copyControllerRef.current.scheduleAutoReset(() => {
            setCopyState(copyControllerRef.current.getInitialState());
          });
        }
      } catch (error) {
        logger.error('[PreferencesDrawer] Failed to copy config:', error);
        // 可以在这里添加用户提示
      }
    }
  }, [preferences, copyState.isCopied]);

  // 无障碍属性
  const copyButtonA11y = useMemo(
    () => getCopyButtonA11yProps(copyState.isCopied),
    [copyState.isCopied]
  );

  // 渲染当前标签内容（使用 useMemo 优化）
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceTab locale={locale} uiConfig={mergedUIConfig.appearance} />;
      case 'layout':
        return <LayoutTab locale={locale} uiConfig={mergedUIConfig.layout} />;
      case 'shortcutKeys':
        return <ShortcutKeysTab locale={locale} uiConfig={mergedUIConfig.shortcutKeys} />;
      case 'general':
        return <GeneralTab locale={locale} uiConfig={mergedUIConfig.general} />;
      default:
        return null;
    }
  }, [activeTab, locale, mergedUIConfig]);

  return (
    <>
      {/* 遮罩层 */}
      {showOverlay && (
        <div
          className={`preferences-drawer-overlay ${open ? 'open' : ''}`}
          data-state={open ? 'open' : 'closed'}
          onClick={handleOverlayClick}
        />
      )}

      {/* 抽屉 */}
      <div className={`preferences-drawer ${open ? 'open' : ''}`} data-state={open ? 'open' : 'closed'}>
        {/* 头部（标题+副标题同行） */}
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
                className={`preferences-btn-icon data-disabled:opacity-50 aria-disabled:opacity-50${action.showIndicator ? ' relative' : ''}`}
                disabled={action.disabled}
                aria-disabled={action.disabled || undefined}
                data-disabled={action.disabled ? 'true' : undefined}
                aria-label={action.tooltip}
                data-preference-tooltip={action.tooltip || undefined}
                data-value={action.type}
                onClick={handleHeaderActionClick}
              >
                {action.showIndicator && <span className="dot" />}
                <span
                  dangerouslySetInnerHTML={{ __html: action.icon }}
                  style={ICON_STYLES.md}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div ref={bodyRef} className="preferences-drawer-body">
          {/* 分段标签 */}
          <div
            className={`preferences-tabs-wrapper${isPinned ? ' sticky' : ''}`}
            data-sticky={isPinned ? 'true' : undefined}
          >
            <div 
              className="preferences-segmented" 
              role="tablist" 
              aria-label="设置分类"
              style={tabsStyle}
            >
              {/* 滑动指示器（水流动画） */}
              <div className="preferences-segmented-indicator" aria-hidden="true" />
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  role="tab"
                  id={`pref-tab-${tab.value}`}
                  className={`preferences-segmented-item data-active:text-foreground data-active:font-semibold aria-selected:text-foreground ${activeTab === tab.value ? 'active' : ''}`}
                  aria-selected={activeTab === tab.value}
                  aria-controls={`pref-tabpanel-${tab.value}`}
                  data-state={activeTab === tab.value ? 'active' : 'inactive'}
                  data-value={tab.value}
                  onClick={handleTabClick}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 标签内容 */}
          <div 
            id={`pref-tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`pref-tab-${activeTab}`}
          >
            {tabContent}
          </div>
        </div>

        {/* 底部 */}
        {showCopyButton && (
          <div className="preferences-drawer-footer">
            <button
              className={`preferences-btn preferences-btn-primary data-disabled:opacity-50 aria-disabled:opacity-50${copyState.isCopied ? ' is-copied' : ''}`}
              disabled={copyButtonDisabled}
              aria-disabled={copyButtonDisabled || undefined}
              data-disabled={copyButtonDisabled ? 'true' : undefined}
              data-state={copyState.isCopied ? 'copied' : 'idle'}
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
        )}
      </div>

      {/* 导入错误弹窗 */}
      {importError.show && createPortal(
        <div className="preferences-modal-overlay" onClick={closeImportError}>
          <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preferences-modal-header">
            <span
              className="preferences-modal-icon error"
              data-status="error"
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
                className="preferences-btn preferences-btn-primary data-disabled:opacity-50 aria-disabled:opacity-50"
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
});

PreferencesDrawer.displayName = 'PreferencesDrawer';

export default PreferencesDrawer;
