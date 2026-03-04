/**
 * 偏好设置抽屉组件模块。
 * @description 提供偏好配置查看、修改、导入、复制与重置等完整交互能力。
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
  setupPreferenceTooltip,
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

/**
 * 抽屉常用图标缓存。
 * @description 提升到模块级以避免组件重渲染时重复获取图标资源。
 */
const ICONS = {
  copy: getIcon('copy'),
  check: getIcon('check'),
  alertCircle: getIcon('alertCircle'),
} as const;

/**
 * 图标尺寸样式缓存。
 * @description 复用静态样式对象，减少渲染期间重复创建。
 */
const ICON_STYLES = {
  md: getIconStyle('md'),
  sm: getIconStyle('sm'),
} as const;

/**
 * 偏好设置抽屉组件属性。
 */
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
  /** 界面配置（控制功能项显示/禁用） */
  uiConfig?: PreferencesDrawerUIConfig;
}

/**
 * 偏好导入错误状态。
 */
interface PreferencesImportErrorState {
  /** 是否显示导入错误弹窗。 */
  show: boolean;
  /** 错误提示文案。 */
  message: string;
}

/**
 * 偏好设置抽屉组件。
 */
export const PreferencesDrawer: React.FC<PreferencesDrawerProps> = memo(({
  open,
  onClose,
  showOverlay = true,
  closeOnOverlay = true,
  showPinButton = true,
  onPinChange,
  uiConfig,
}) => {
  /**
   * 偏好上下文状态与操作方法。
   * @description 提供当前配置、变更检测、重置与批量设置等能力。
   */
  const { preferences, resetPreferences, setPreferences, hasChanges } = usePreferences();

  /**
   * 弹窗门户挂载节点。
   * @description 在浏览器环境下挂载到 `document.body`，用于渲染导入错误弹窗。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 当前激活标签键。
   * @description 决定抽屉主体区域渲染的子面板。
   */
  const [activeTab, setActiveTab] = useState<DrawerTabType>('appearance');

  /**
   * 抽屉内容容器引用。
   * @description 标签切换时用于重置滚动位置。
   */
  const bodyRef = useRef<HTMLDivElement>(null);

  /**
   * 组件挂载初始化 Tooltip 行为。
   * @description 在抽屉生命周期内注册偏好项提示层能力，并于卸载时清理。
   */
  useEffect(() => {
    const cleanup = setupPreferenceTooltip();
    return () => cleanup();
  }, []);

  /**
   * 切换抽屉当前标签
   * @description 更新活动标签并将内容区滚动位置复位到顶部。
   * @param tab 目标标签键值。
   */
  const handleTabChange = useCallback((tab: DrawerTabType) => {
    setActiveTab(tab);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, []);

  /**
   * 处理标签按钮点击
   * @description 从按钮数据属性读取标签值并委托执行标签切换。
   * @param e React 鼠标事件对象。
   */
  const handleTabClick = useCallback((e: React.MouseEvent) => {
    const tab = (e.currentTarget as HTMLElement).dataset.value as DrawerTabType | undefined;
    if (tab) {
      handleTabChange(tab);
    }
  }, [handleTabChange]);

  /**
   * 标签栏固定状态。
   * @description 启用后标签栏在内容滚动时保持吸顶。
   */
  const [isPinned, setIsPinned] = useState(false);

  /**
   * 导入错误弹窗状态。
   * @description 用于展示导入失败提示信息。
   */
  const [importError, setImportError] = useState<PreferencesImportErrorState>({
    show: false,
    message: '',
  });

  /**
   * 关闭导入错误提示弹窗
   * @description 清空错误内容并隐藏错误弹窗。
   */
  const closeImportError = useCallback(() => {
    setImportError({ show: false, message: '' });
  }, []);

  /**
   * 复制按钮控制器引用。
   * @description 管理复制成功态与自动恢复逻辑。
   */
  const copyControllerRef = useRef(createCopyButtonController());

  /**
   * 复制按钮状态。
   * @description 用于驱动“复制中/已复制/恢复”视觉反馈与交互可用性。
   */
  const [copyState, setCopyState] = useState<CopyButtonState>(() => 
    copyControllerRef.current.getInitialState()
  );

  /**
   * 上一次偏好配置引用。
   * @description 对比配置引用变化以避免无效状态更新。
   */
  const prevPreferencesRef = useRef(preferences);
  
  /**
   * 监听偏好配置变化并按需重置复制状态。
   * @description 仅依赖 `preferences`，避免引入 `copyState` 造成循环触发。
   */
  useEffect(() => {
    /**
     * 引用变化检查。
     * @description 仅当配置对象引用变化时执行后续逻辑。
     */
    if (prevPreferencesRef.current !== preferences) {
      prevPreferencesRef.current = preferences;
      /**
       * 使用函数式更新读取最新复制状态。
       * @description 避免闭包状态滞后导致判断不准确。
       */
      setCopyState((currentCopyState) => {
        if (copyControllerRef.current.shouldResetOnChange(currentCopyState, preferences)) {
          return copyControllerRef.current.reset();
        }
        return currentCopyState;
      });
    }
  }, [preferences]);

  /**
   * 组件卸载清理。
   * @description 释放复制控制器内部资源与定时器。
   */
  useEffect(() => {
    const controller = copyControllerRef.current;
    return () => {
      controller.dispose();
    };
  }, []);

  /**
   * 当前语言文案。
   * @description 根据偏好设置解析对应语言资源。
   */
  const locale = useMemo(
    () => getLocaleByPreferences(preferences),
    [preferences]
  );

  /**
   * 合并后的抽屉 UI 配置。
   * @description 将传入配置与默认配置统一合并，方便后续读取。
   */
  const mergedUIConfig = useMemo(
    () => mergeDrawerUIConfig(uiConfig),
    [uiConfig]
  );

  /**
   * 可见标签配置列表。
   * @description 依据 UI 配置过滤隐藏标签后生成最终列表。
   */
  const tabs = useMemo(
    () => getVisibleDrawerTabs(locale, mergedUIConfig),
    [locale, mergedUIConfig]
  );

  /** 标签值到索引的映射表。 */
  const tabsIndexMap = useMemo(() => {
    const map = new Map<DrawerTabType, number>();
    tabs.forEach((tab, index) => map.set(tab.value, index));
    return map;
  }, [tabs]);

  /**
   * 当前激活标签索引。
   * @description 用于驱动头部标签指示器的位置动画。
   */
  const activeTabIndex = useMemo(() => {
    const index = tabsIndexMap.get(activeTab);
    return index !== undefined ? index : 0;
  }, [tabsIndexMap, activeTab]);

  /** 标签头部运行时样式变量。 */
  const tabsStyle = useMemo(() => ({
    '--pref-tab-columns': tabs.length,
    '--pref-active-tab-index': activeTabIndex,
  } as React.CSSProperties), [tabs.length, activeTabIndex]);

  /**
   * 确保激活标签始终有效。
   * @description 当当前标签被隐藏时，自动回退到首个可见标签。
   */
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.value === activeTab)) {
      setActiveTab(tabs[0].value);
    }
  }, [tabs, activeTab]);

  /**
   * 头部操作按钮列表。
   * @description 结合 `uiConfig` 与当前状态计算可见性、禁用态与指示点。
   */
  const headerActions = useMemo(() => {
    const excludeActions: DrawerHeaderActionType[] = [];
    
    /**
     * 头部操作项过滤规则。
     * @description 结合 `showPinButton` 与 `uiConfig` 判定需排除的动作类型。
     */
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

    /**
     * 合并按钮禁用状态。
     * @description 业务禁用与 UI 配置禁用按“或”规则合并。
     */
    return actions.map(action => ({
      ...action,
      disabled: action.disabled || getFeatureConfig(mergedUIConfig, `headerActions.${action.type}`).disabled,
    }));
  }, [locale, hasChanges, isPinned, showPinButton, mergedUIConfig]);

  /**
   * 复制按钮功能配置。
   * @description 从 footerActions 读取 copy 的显示与禁用策略。
   */
  const copyButtonConfig = useMemo(
    () => getFeatureConfig(mergedUIConfig, 'footerActions.copy'),
    [mergedUIConfig]
  );

  /** 复制按钮可见性。 */
  const showCopyButton = copyButtonConfig.visible;

  /** 复制按钮禁用状态。 */
  const copyButtonDisabled = !hasChanges || copyState.isCopied || copyButtonConfig.disabled;

  /**
   * 处理遮罩层点击
   * @description 当允许遮罩关闭时，触发抽屉关闭回调。
   */
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlay) {
      onClose();
    }
  }, [closeOnOverlay, onClose]);

  /**
   * 导入偏好配置
   * @description 从剪贴板读取配置并应用；导入失败时展示对应错误文案。
   * @returns 导入流程完成后返回 `Promise<void>`。
   */
  const handleImportConfig = useCallback(async () => {
    const result = await importPreferencesConfig();
    
    if (result.success && result.config) {
      /**
       * 导入成功后更新配置。
       */
      setPreferences(result.config);
    } else {
      /**
       * 导入失败后展示错误弹窗。
       */
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

  /**
   * 处理头部操作按钮业务逻辑
   * @description 根据操作类型执行导入、重置、固定或关闭等动作。
   * @param type 头部操作类型。
   */
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

  /**
   * 处理头部按钮点击事件
   * @description 从按钮 `data-value` 提取操作类型并执行对应处理。
   * @param e React 鼠标事件对象。
   */
  const handleHeaderActionClick = useCallback((e: React.MouseEvent) => {
    const type = (e.currentTarget as HTMLElement).dataset.value as DrawerHeaderActionType | undefined;
    if (type) {
      handleHeaderAction(type);
    }
  }, [handleHeaderAction]);

  /**
   * 复制当前偏好配置
   * @description 复制成功后更新按钮状态并注册自动恢复逻辑，失败时记录错误日志。
   * @returns 复制流程完成后返回 `Promise<void>`。
   */
  const handleCopyConfig = useCallback(async () => {
    if (preferences && !copyState.isCopied) {
      try {
        const success = await copyPreferencesConfig(preferences);
        if (success) {
          setCopyState(copyControllerRef.current.handleCopySuccess(preferences));
          /**
           * 设置复制成功后的自动恢复任务。
           * @description 到期后将按钮状态复位为初始态。
           */
          copyControllerRef.current.scheduleAutoReset(() => {
            setCopyState(copyControllerRef.current.getInitialState());
          });
        }
      } catch (error) {
        logger.error('[PreferencesDrawer] Failed to copy config:', error);
        /**
         * 复制失败兜底说明。
         * @description 当前仅记录日志，后续可扩展为用户提示。
         */
      }
    }
  }, [preferences, copyState.isCopied]);

  /**
   * 复制按钮无障碍属性。
   * @description 根据复制状态动态生成 `aria` 信息。
   */
  const copyButtonA11y = useMemo(
    () => getCopyButtonA11yProps(copyState.isCopied),
    [copyState.isCopied]
  );

  /**
   * 当前激活标签页内容节点。
   * @description 根据激活标签按需渲染对应子面板组件。
   */
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
      <div
        className={`preferences-drawer ${open ? 'open' : ''}`}
        data-state={open ? 'open' : 'closed'}
      >
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
                className={`preferences-btn-icon pref-disabled${action.showIndicator ? ' relative' : ''}`}
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
              aria-label={locale.preferences?.category || locale.preferences?.title || 'Categories'}
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
              className={`preferences-btn preferences-btn-primary pref-disabled pref-disabled-trigger${copyState.isCopied ? ' is-copied' : ''}`}
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
      {importError.show && portalTarget && createPortal(
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
                className="preferences-btn preferences-btn-primary"
                onClick={closeImportError}
              >
                {locale.common.confirm}
              </button>
            </div>
          </div>
        </div>,
        portalTarget
      )}
    </>
  );
});

PreferencesDrawer.displayName = 'PreferencesDrawer';

/**
 * 默认导出偏好设置抽屉组件。
 */
export default PreferencesDrawer;
