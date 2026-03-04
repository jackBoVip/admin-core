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

/**
 * 语言选项结构。
 */
interface LanguageOption {
  /** 值。 */
  value: string;
  /** 显示标签。 */
  label: string;
  /** 语言简称，用于紧凑展示。 */
  abbr: string;
}

/**
 * 头部语言切换下拉组件。
 * @returns 语言切换按钮与下拉菜单节点。
 */
export const LanguageToggle = memo(function LanguageToggle() {
  /**
   * 布局上下文能力。
   * @description 提供当前配置快照与事件派发方法。
   */
  const { props, events } = useLayoutContext();
  /**
   * 下拉展开状态与交互方法。
   */
  const { isOpen, close: handleClose, toggle: handleToggleOpen } = useOpenState();

  /**
   * 当前语言标识，默认回退到 `zh-CN`。
   */
  const currentLocale = (props.locale || 'zh-CN') as SupportedLocale;
  /**
   * 下拉遮罩挂载节点。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 语言选项列表，基于当前语言环境计算展示文案与简称。
   */
  const languageOptions: LanguageOption[] = useMemo(() => {
    /** 使用当前语言创建 i18n 实例，确保语言名展示与当前 locale 一致。 */
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

  /**
   * 执行语言切换并关闭下拉菜单。
   *
   * @param locale 目标语言标识。
   */
  const handleLocaleChange = useCallback(
    (locale: string) => {
      events.onLocaleChange?.(locale);
      handleClose();
    },
    [events, handleClose]
  );

  /**
   * 处理语言选项点击事件，并从数据属性中提取语言值。
   *
   * @param e React 鼠标事件对象。
   */
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
