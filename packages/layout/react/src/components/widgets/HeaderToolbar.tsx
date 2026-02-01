/**
 * 顶栏工具栏组件
 * @description 整合所有顶栏工具组件，根据配置显示
 */
import { useMemo, memo } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { RefreshButton } from './RefreshButton';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { FullscreenButton } from './FullscreenButton';
import { NotificationButton } from './NotificationButton';
import { UserDropdown } from './UserDropdown';

export const HeaderToolbar = memo(function HeaderToolbar() {
  const { props } = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const widgets = useMemo(() => props.widgets || {}, [props.widgets]);

  // 是否为顶部菜单布局（header-nav、mixed-nav、header-mixed-nav）
  const isHeaderMenuLayout = 
    layoutComputed.isHeaderNav || 
    layoutComputed.isMixedNav || 
    layoutComputed.isHeaderMixedNav;

  const showRefresh = widgets.refresh !== false;
  // 全局搜索只在顶部菜单布局下显示
  const showSearch = widgets.globalSearch !== false && isHeaderMenuLayout;
  const showTheme = widgets.themeToggle !== false;
  const showLanguage = widgets.languageToggle !== false;
  const showFullscreen = widgets.fullscreen !== false;
  const showNotification = widgets.notification !== false;
  const showUser = widgets.userDropdown !== false;

  return (
    <div className="header-toolbar flex items-center gap-1">
      {showRefresh && <RefreshButton />}
      {showSearch && <GlobalSearch />}
      {showSearch && <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />}
      {showTheme && <ThemeToggle />}
      {showLanguage && <LanguageToggle />}
      {showFullscreen && <FullscreenButton />}
      {showNotification && <NotificationButton />}
      {showUser && <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />}
      {showUser && <UserDropdown />}
    </div>
  );
});
