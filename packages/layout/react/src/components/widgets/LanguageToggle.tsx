/**
 * 语言切换组件
 * @description 切换应用语言
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

interface LanguageOption {
  value: string;
  label: string;
  abbr: string;
}

export const LanguageToggle = memo(function LanguageToggle() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = props.locale || 'zh-CN';

  const languageOptions: LanguageOption[] = useMemo(() => {
    const zhLabel = t('layout.widgetLegacy.locale.zh-CN');
    const enLabel = t('layout.widgetLegacy.locale.en-US');
    return [
      { value: 'zh-CN', label: zhLabel, abbr: 'ZH' },
      { value: 'en-US', label: enLabel, abbr: 'EN' },
    ];
  }, [t]);

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
    <>
      <div
        className="header-widget-dropdown relative"
        data-state={isOpen ? 'open' : 'closed'}
      >
        <button
          type="button"
          className="header-widget-btn"
          data-state={isOpen ? 'open' : 'closed'}
          onClick={handleToggleOpen}
        >
          {renderLayoutIcon('globe', 'sm')}
        </button>

        {isOpen && (
          <div
            className="header-widget-dropdown__menu header-widget-dropdown__menu--compact absolute right-0 top-full pt-1"
            data-state="open"
            onMouseLeave={handleClose}
          >
            <div className="header-widget-dropdown__content">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="header-widget-dropdown__item"
                  data-selected={currentLocale === option.value ? 'true' : undefined}
                  data-value={option.value}
                  onClick={handleOptionClick}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 点击外部关闭 */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-40" onClick={handleClose} />,
        document.body
      )}
    </>
  );
});
