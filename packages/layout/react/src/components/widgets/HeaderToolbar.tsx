/**
 * 顶栏工具栏组件
 * @description 整合所有顶栏工具组件，根据配置显示
 */
import { useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { GlobalSearch } from './GlobalSearch';
import { PreferencesButton } from './PreferencesButton';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { FullscreenButton } from './FullscreenButton';
import { NotificationButton } from './NotificationButton';
import { UserDropdown } from './UserDropdown';

export interface HeaderToolbarProps {
  showPreferencesButton?: boolean;
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  onOpenPreferences?: () => void;
}

export const HeaderToolbar = memo(function HeaderToolbar({
  showPreferencesButton,
  preferencesButtonPosition,
  onOpenPreferences,
}: HeaderToolbarProps) {
  const { props } = useLayoutContext();

  const widgets = useMemo(() => props.widgets || {}, [props.widgets]);

  const resolvedPreferencesPosition =
    preferencesButtonPosition ?? props.preferencesButtonPosition ?? 'auto';

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
      {showSearch && <GlobalSearch />}
      {showPreferences && <PreferencesButton onOpenPreferences={onOpenPreferences} />}
      {showTheme && <ThemeToggle />}
      {showLanguage && <LanguageToggle />}
      {showFullscreen && <FullscreenButton />}
      {showNotification && <NotificationButton />}
      {showUser && <UserDropdown />}
    </div>
  );
});
