/**
 * 语言切换组件
 * @description 切换应用语言
 */
import { getLocaleDisplayList, createI18n, type SupportedLocale } from '@admin-core/layout';
import { useOpenState } from '@admin-core/shared-react';
import { useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

interface LanguageOption {
  value: string;
  label: string;
  abbr: string;
}

export const LanguageToggle = memo(function LanguageToggle() {
  const { props, events } = useLayoutContext();
  const { isOpen, close: handleClose, toggle: handleToggleOpen } = useOpenState();

  const currentLocale = (props.locale || 'zh-CN') as SupportedLocale;
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  const languageOptions: LanguageOption[] = useMemo(() => {
    // 使用当前 i18n 实例获取翻译
    const i18n = createI18n(currentLocale);
    const displayList = getLocaleDisplayList(i18n);
    
    return displayList.map((item) => {
      let abbr: string;
      if (item.value === 'zh-CN') {
        abbr = 'ZH';
      } else if (item.value === 'en-US') {
        abbr = 'EN';
      } else {
        abbr = String(item.value).toUpperCase().slice(0, 2);
      }
      return {
        value: item.value,
        label: item.label,
        abbr,
      };
    });
  }, [currentLocale]);

  const handleLocaleChange = useCallback(
    (locale: string) => {
      events.onLocaleChange?.(locale);
      handleClose();
    },
    [events, handleClose]
  );

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
      {isOpen && portalTarget && createPortal(
        <div className="fixed inset-0 z-40" onClick={handleClose} />,
        portalTarget
      )}
    </>
  );
});
