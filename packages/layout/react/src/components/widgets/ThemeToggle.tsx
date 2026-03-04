/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { getCurrentThemeMode, toggleThemeMode, isDarkTheme } from '@admin-core/layout';
import { useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

/**
 * 主题切换按钮组件。
 * @description 在明暗主题间切换并触发布局层主题变更事件。
 */
export const ThemeToggle = memo(function ThemeToggle() {
  /**
   * 布局上下文能力。
   * @description 提供当前主题配置与主题切换事件回调。
   */
  const { props, events } = useLayoutContext();

  /**
   * 解析当前主题模式（light/dark/auto）。
   */
  const currentTheme = useMemo(() => getCurrentThemeMode(props.theme), [props.theme]);
  /**
   * 判断当前主题是否为暗色模式，用于按钮视觉状态。
   */
  const isDark = useMemo(() => isDarkTheme(props.theme), [props.theme]);

  /**
   * 切换主题模式并触发外部主题切换事件。
   */
  const handleToggleTheme = useCallback(() => {
    const nextTheme = toggleThemeMode(currentTheme);
    events.onThemeToggle?.(nextTheme);
  }, [events, currentTheme]);

  /**
   * 主题切换按钮状态类名。
   * @description 根据当前亮暗模式输出稳定 class，便于样式区分。
   */
  const toggleClassName = `header-widget-btn theme-toggle ${isDark ? 'is-dark' : 'is-light'}`;

  return (
    <button
      type="button"
      className={toggleClassName}
      data-mode={currentTheme}
      data-theme={isDark ? 'dark' : 'light'}
      onClick={handleToggleTheme}
    >
      {renderLayoutIcon('theme-toggle', 'sm', 'sun-and-moon')}
    </button>
  );
});
