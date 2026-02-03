/**
 * 语言切换组件
 * @description 切换应用语言
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';

interface LanguageOption {
  value: string;
  label: string;
  abbr: string;
}

export const LanguageToggle = memo(function LanguageToggle() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = props.locale || 'zh-CN';

  const languageOptions: LanguageOption[] = useMemo(
    () => [
      { value: 'zh-CN', label: '简体中文', abbr: '中' },
      { value: 'en-US', label: 'English', abbr: 'EN' },
    ],
    []
  );

  const handleLocaleChange = useCallback(
    (locale: string) => {
      events.onLocaleChange?.(locale);
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
    const locale = (e.currentTarget as HTMLElement).dataset.value;
    if (locale) {
      handleLocaleChange(locale);
    }
  }, [handleLocaleChange]);

  return (
    <div
      className="header-widget-dropdown relative"
      data-state={isOpen ? 'open' : 'closed'}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="header-widget-btn"
        title={t('layout.header.toggleLanguage')}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={handleToggleOpen}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          data-state="open"
        >
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                currentLocale === option.value ? 'text-primary bg-primary/10' : ''
              }`}
              data-selected={currentLocale === option.value ? 'true' : undefined}
              data-value={option.value}
              onClick={handleOptionClick}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
