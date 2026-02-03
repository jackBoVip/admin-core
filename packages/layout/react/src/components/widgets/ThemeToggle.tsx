/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import type { ThemeModeType } from '@admin-core/preferences';

interface ThemeOption {
  value: ThemeModeType;
  icon: 'sun' | 'moon' | 'monitor';
  label: string;
}

export const ThemeToggle = memo(function ThemeToggle() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = props.theme?.mode || 'light';

  const themeOptions: ThemeOption[] = useMemo(
    () => [
      { value: 'light', icon: 'sun', label: 'layout.theme.light' },
      { value: 'dark', icon: 'moon', label: 'layout.theme.dark' },
      { value: 'auto', icon: 'monitor', label: 'layout.theme.auto' },
    ],
    []
  );

  const handleThemeChange = useCallback(
    (theme: ThemeModeType) => {
      events.onThemeToggle?.(theme);
      setIsOpen(false);
    },
    [events]
  );

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOptionClick = useCallback((e: React.MouseEvent) => {
    const theme = (e.currentTarget as HTMLElement).dataset.value as ThemeModeType | undefined;
    if (theme) {
      handleThemeChange(theme);
    }
  }, [handleThemeChange]);

  const renderIcon = useCallback((icon: string, className = 'h-4 w-4') => {
    switch (icon) {
      case 'sun':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        );
      case 'moon':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        );
    }
  }, []);

  return (
    <div
      className="header-widget-dropdown relative"
      data-state={isOpen ? 'open' : 'closed'}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="header-widget-btn"
        title={t('layout.header.toggleTheme')}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={handleToggleOpen}
      >
        {renderIcon(currentTheme === 'light' ? 'sun' : currentTheme === 'dark' ? 'moon' : 'monitor')}
      </button>

      {isOpen && (
        <div
          className="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          data-state="open"
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                currentTheme === option.value ? 'text-primary bg-primary/10' : ''
              }`}
              data-selected={currentTheme === option.value ? 'true' : undefined}
              data-value={option.value}
              onClick={handleOptionClick}
            >
              {renderIcon(option.icon)}
              <span>{t(option.label)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
