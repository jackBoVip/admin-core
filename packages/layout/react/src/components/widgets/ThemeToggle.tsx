/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { getCurrentThemeMode, toggleThemeMode, isDarkTheme } from '@admin-core/layout';
import { useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

export const ThemeToggle = memo(function ThemeToggle() {
  const { props, events } = useLayoutContext();

  const currentTheme = useMemo(() => getCurrentThemeMode(props.theme), [props.theme]);
  const isDark = useMemo(() => isDarkTheme(props.theme), [props.theme]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = toggleThemeMode(currentTheme);
    events.onThemeToggle?.(nextTheme);
  }, [events, currentTheme]);

  return (
    <button
      type="button"
      className={`header-widget-btn theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      data-mode={currentTheme}
      data-theme={isDark ? 'dark' : 'light'}
      onClick={handleToggleTheme}
    >
      {renderLayoutIcon('theme-toggle', 'sm', 'sun-and-moon')}
    </button>
  );
});
