/**
 * 顶栏工具栏组件。
 * @description 整合顶栏工具组件，并根据布局配置控制显隐与顺序。
 */
import { useMemo, memo, type ReactNode } from 'react';
import { useLayoutContext } from '../../hooks';
import { FullscreenButton } from './FullscreenButton';
import { GlobalSearch } from './GlobalSearch';
import { LanguageToggle } from './LanguageToggle';
import { NotificationButton } from './NotificationButton';
import { PreferencesButton } from './PreferencesButton';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './UserDropdown';

/**
 * 顶栏工具条组件属性。
 * @description 定义偏好按钮策略与用户区自定义插槽。
 */
export interface HeaderToolbarProps {
  /** 是否显示偏好设置按钮。 */
  showPreferencesButton?: boolean;
  /** 偏好设置按钮位置策略。 */
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  /** 点击偏好设置按钮时触发。 */
  onOpenPreferences?: () => void;
  /** 用户区域自定义内容。 */
  userSlot?: ReactNode;
  /** 用户下拉菜单自定义内容。 */
  userMenuSlot?: ReactNode;
}

/**
 * 页头工具栏组件。
 * @description 统一渲染主题切换、全屏、通知、语言与用户操作等入口。
 * @param props 工具栏参数。
 * @returns 页头工具栏节点。
 */
export const HeaderToolbar = memo(function HeaderToolbar({
  showPreferencesButton,
  preferencesButtonPosition,
  onOpenPreferences,
  userSlot,
  userMenuSlot,
}: HeaderToolbarProps) {
  const { props } = useLayoutContext();

  /**
   * 顶栏组件显隐配置集合，统一兜底为对象避免空值分支。
   */
  const widgets = useMemo(() => props.widgets || {}, [props.widgets]);

  /**
   * 解析偏好设置按钮位置，优先级为组件入参 > 布局配置 > 默认值。
   */
  const resolvedPreferencesPosition =
    preferencesButtonPosition ?? props.preferencesButtonPosition ?? 'auto';

  /**
   * 各工具项显示开关，按组件入参与布局配置共同计算。
   */
  const showSearch = widgets.globalSearch !== false;
  const showPreferences =
    (showPreferencesButton ?? true) &&
    props.enablePreferences !== false &&
    widgets.preferencesButton !== false &&
    (resolvedPreferencesPosition === 'header' || resolvedPreferencesPosition === 'auto');
  const showTheme = widgets.themeToggle !== false;
  const showLanguage = widgets.languageToggle !== false;
  const showFullscreen = widgets.fullscreen !== false;
  const showNotification = widgets.notification !== false;
  const showUser = widgets.userDropdown !== false;

  return (
    <div className="header-toolbar flex items-center gap-1">
      {showSearch && <div className="mr-2"><GlobalSearch /></div>}
      {showPreferences && <PreferencesButton onOpenPreferences={onOpenPreferences} />}
      {showTheme && <ThemeToggle />}
      {showLanguage && <LanguageToggle />}
      {showFullscreen && <FullscreenButton />}
      {showNotification && <NotificationButton />}
      {showUser && (userSlot ? userSlot : <UserDropdown menuSlot={userMenuSlot} />)}
    </div>
  );
});
