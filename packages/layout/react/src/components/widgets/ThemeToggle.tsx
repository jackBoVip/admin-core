/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { useCallback, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import type { ThemeModeType } from '@admin-core/preferences';
import { renderLayoutIcon } from '../../utils';

export const ThemeToggle = memo(function ThemeToggle() {
  const { props, events } = useLayoutContext();

  const currentTheme: ThemeModeType = props.theme?.mode === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';

  const handleToggleTheme = useCallback(() => {
    const nextTheme: ThemeModeType = isDark ? 'light' : 'dark';
    events.onThemeToggle?.(nextTheme);
  }, [events, isDark]);

  return (
    <button
      type="button"
      className={`header-widget-btn theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={handleToggleTheme}
    >
      {renderLayoutIcon('theme-toggle', 'md', 'sun-and-moon')}
    </button>
  );
});
