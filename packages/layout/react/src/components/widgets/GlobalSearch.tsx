/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { LAYOUT_UI_TOKENS, type MenuItem } from '@admin-core/layout';
import { useListItemHeight, useVirtualListScroll } from '@admin-core/shared-react';
import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

const {
  SEARCH_MAX_RESULTS,
  SEARCH_RESULT_MAX_HEIGHT,
  SEARCH_RESULT_ITEM_HEIGHT,
} = LAYOUT_UI_TOKENS;

/**
 * 全局搜索内部使用的扁平菜单项。
 * @description 在原始菜单基础上补充层级路径与预计算检索文本。
 */
interface FlatMenuItem extends MenuItem {
  /** 父级菜单名称路径，用于展示结果的层级信息。 */
  parentPath?: string[];
  /** 归一化检索文本（名称 + 路径，小写）。 */
  searchText: string;
}

/**
 * 头部全局搜索组件。
 * @returns 全局搜索按钮与弹窗节点。
 */
export const GlobalSearch = memo(function GlobalSearch() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  /**
   * 当前可搜索菜单集合。
   */
  const menus = useMemo(() => props.menus ?? [], [props.menus]);
  /**
   * 快捷键配置项。
   */
  const shortcutConfig = props.shortcutKeys || {};
  /**
   * 是否启用全局搜索快捷键。
   */
  const shortcutEnabled =
    shortcutConfig.enable !== false && shortcutConfig.globalSearch !== false;

  const flatMenus = useMemo<FlatMenuItem[]>(() => {
    if (!isOpen) return [];
    const result: FlatMenuItem[] = [];

    /**
     * 深度遍历菜单树并生成可检索的扁平菜单列表。
     *
     * @param items 当前层级菜单集合。
     * @param parentPath 父级菜单名称链。
     */
    const flatten = (items: MenuItem[], parentPath: string[] = []) => {
      for (const item of items) {
        const currentPath = [...parentPath, item.name];

        if (item.path && !item.hidden) {
          const name = item.name || '';
          const path = item.path || '';
          result.push({
            ...item,
            parentPath: parentPath.length > 0 ? parentPath : undefined,
            searchText: `${name} ${path}`.toLowerCase(),
          });
        }

        if (item.children?.length) {
          flatten(item.children, currentPath);
        }
      }
    };

    flatten(menus);
    return result;
  }, [menus, isOpen]);

  /**
   * 根据关键字匹配后的搜索结果集合。
   */
  const searchResults = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return [];

    const results: FlatMenuItem[] = [];
    for (const item of flatMenus) {
      if (item.searchText.includes(query)) {
        results.push(item);
        if (results.length >= SEARCH_MAX_RESULTS) break;
      }
    }
    return results;
  }, [keyword, flatMenus]);

  /**
   * 虚拟列表单项高度。
   */
  const [itemHeight, setItemHeight] = useState<number>(SEARCH_RESULT_ITEM_HEIGHT);
  const RESULT_OVERSCAN = LAYOUT_UI_TOKENS.RESULT_OVERSCAN;
  /**
   * 结果列表总高度。
   */
  const totalHeight = searchResults.length * itemHeight;
  /**
   * 结果列表视口高度。
   */
  const viewportHeight = totalHeight === 0 ? SEARCH_RESULT_MAX_HEIGHT : Math.min(totalHeight, SEARCH_RESULT_MAX_HEIGHT);
  const { scrollTop, setScrollTop, handleScroll, handleWheel } = useVirtualListScroll({
    isOpen,
    listRef: resultListRef,
    totalHeight,
    viewportHeight,
  });
  /**
   * 虚拟列表起始索引。
   */
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - RESULT_OVERSCAN);
  /**
   * 虚拟列表结束索引。
   */
  const endIndex = Math.min(
    searchResults.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + RESULT_OVERSCAN
  );
  /**
   * 当前视口范围内可见结果集合。
   */
  const visibleResults = useMemo(
    () => searchResults.slice(startIndex, endIndex),
    [searchResults, startIndex, endIndex]
  );

  useListItemHeight({
    isOpen,
    listRef: resultListRef,
    itemHeight,
    itemCount: searchResults.length,
    setItemHeight,
  });

  /**
   * 打开全局搜索弹窗并重置输入状态。
   */
  const openSearch = useCallback(() => {
    setIsOpen(true);
    setKeyword('');
    setSelectedIndex(0);
  }, []);

  /**
   * 关闭全局搜索弹窗并清空临时状态。
   */
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setKeyword('');
    setSelectedIndex(0);
  }, []);

  /**
   * 处理搜索关键字输入变化。
   *
   * @param e React 输入事件对象。
   */
  const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  }, []);

  /**
   * 处理搜索结果项选择，触发埋点并执行路由跳转。
   *
   * @param item 被选中的菜单项。
   */
  const selectItem = useCallback(
    (item: MenuItem) => {
      const query = keyword.trim();
      events.onGlobalSearch?.(query);
      if (item.path) {
        if (props.router?.navigate) {
          props.router.navigate(item.path);
        }
      }
      closeSearch();
    },
    [events, props.router, closeSearch, keyword]
  );

  /**
   * 处理结果列表项点击，根据 `data-index` 定位并选中目标项。
   *
   * @param e React 鼠标事件对象。
   */
  const handleResultClick = useCallback((e: React.MouseEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      const item = searchResults[index];
      if (item) selectItem(item);
    }
  }, [searchResults, selectItem]);

  /**
   * 处理结果项悬停，更新当前键盘导航选中项。
   *
   * @param e React 鼠标事件对象。
   */
  const handleResultMouseEnter = useCallback((e: React.MouseEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      setSelectedIndex(index);
    }
  }, []);

  /**
   * 确保指定索引项处于结果列表可视区域内。
   *
   * @param index 目标结果索引。
   */
  const ensureIndexVisible = useCallback((index: number) => {
    const list = resultListRef.current;
    if (!list) return;
    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + list.clientHeight;

    if (itemTop < viewTop) {
      list.scrollTop = itemTop;
      setScrollTop((prev) => (prev === itemTop ? prev : itemTop));
      return;
    }
    if (itemBottom > viewBottom) {
      const nextTop = Math.max(0, itemBottom - list.clientHeight);
      list.scrollTop = nextTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    }
  }, [itemHeight, setScrollTop]);

  /**
   * 将当前选中结果滚动到可视区域。
   */
  const scrollToSelected = useCallback(() => {
    const list = resultListRef.current;
    if (!list) return;
    ensureIndexVisible(selectedIndex);
  }, [ensureIndexVisible, selectedIndex]);

  /**
   * 处理搜索弹窗键盘导航（上下移动、回车选择、Esc 关闭）。
   *
   * @param e React 键盘事件对象。
   */
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex < searchResults.length - 1) {
            setSelectedIndex(selectedIndex + 1);
            requestAnimationFrame(scrollToSelected);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
            requestAnimationFrame(scrollToSelected);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            selectItem(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeSearch();
          break;
      }
    },
    [selectedIndex, searchResults, selectItem, closeSearch, scrollToSelected]
  );

  /**
   * 注册并维护全局快捷键监听（Ctrl/Cmd + K）。
   */
  useEffect(() => {
    if (!shortcutEnabled) return;
    /**
     * 监听全局快捷键，切换全局搜索弹窗显示状态。
     *
     * @param e 原生键盘事件。
     */
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpenRef.current) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [openSearch, closeSearch, shortcutEnabled]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(focusFrame);
  }, [isOpen]);

  /**
   * 当关键字变化时重置选中项和滚动位置。
   */
  useEffect(() => {
    setSelectedIndex((prev) => (prev === 0 ? prev : 0));
    if (resultListRef.current) {
      resultListRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [keyword, setScrollTop]);

  /**
   * 快捷键提示文本，自动适配 Mac 与非 Mac 平台。
   */
  const shortcutText = useMemo(() => {
    const platform = typeof navigator === 'undefined' ? '' : navigator.platform;
    const isMac = platform.toLowerCase().includes('mac');
    return isMac ? '⌘K' : 'Ctrl K';
  }, []);

  /**
   * 搜索弹窗挂载节点。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  return (
    <>
      <button
        type="button"
        className="header-search-btn"
        data-state={isOpen ? 'open' : 'closed'}
        onClick={openSearch}
      >
        {renderLayoutIcon('search', 'sm')}
        <span className="hidden md:inline">{t('layout.header.search')}</span>
        <kbd className="hidden md:inline">
          {shortcutText}
        </kbd>
      </button>

      {isOpen && portalTarget &&
        createPortal(
          <div className="header-search-overlay" data-state="open">
            <div
              className="header-search-backdrop"
              onClick={closeSearch}
            />

            <div
              className="header-search-modal"
              onKeyDown={handleKeydown}
              role="dialog"
              aria-modal="true"
            >
              <div className="header-search-modal__input-wrapper">
                {renderLayoutIcon('search', 'lg', 'text-muted-foreground')}
                <input
                  ref={inputRef}
                  type="text"
                  value={keyword}
                  onChange={handleKeywordChange}
                  className="header-search-modal__input"
                  placeholder={t('layout.search.placeholder')}
                />
                <kbd className="header-search-modal__kbd">ESC</kbd>
              </div>

              <div
                ref={resultListRef}
                className="header-search-modal__results layout-scroll-container"
                style={{ height: `${viewportHeight}px`, position: 'relative' }}
                onScroll={handleScroll}
                onWheel={handleWheel}
              >
                {keyword && searchResults.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">{t('layout.search.noResults')}</div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div style={{ height: `${totalHeight}px`, pointerEvents: 'none' }} />
                    {visibleResults.map((item, index) => {
                      const actualIndex = startIndex + index;
                      const isSelected = actualIndex === selectedIndex;
                      return (
                        <div
                          key={item.key}
                          data-index={actualIndex}
                          className="header-search-modal__item"
                          data-selected={isSelected ? 'true' : undefined}
                          onClick={handleResultClick}
                          onMouseEnter={handleResultMouseEnter}
                          style={{
                            position: 'absolute',
                            top: `${actualIndex * itemHeight}px`,
                            left: '0.5rem',
                            right: '0.5rem',
                            height: `${itemHeight}px`,
                          }}
                        >
                          <div className="header-search-modal__item-icon">
                            {item.icon ? (
                              <span>{item.icon}</span>
                            ) : (
                              renderLayoutIcon('search-item', 'sm', 'opacity-60')
                            )}
                          </div>
                          <div className="header-search-modal__item-content">
                            <div className="header-search-modal__item-title">{item.name}</div>
                            {item.parentPath && (
                              <div className="header-search-modal__item-path">{item.parentPath.join(' / ')}</div>
                            )}
                          </div>
                          {isSelected && <span className="text-xs opacity-40">↵</span>}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">{t('layout.search.tips')}</div>
                )}
              </div>

              <div className="header-search-modal__footer">
                <div className="header-search-modal__footer-item">
                  <kbd className="header-search-modal__kbd">↑</kbd>
                  <kbd className="header-search-modal__kbd">↓</kbd>
                  <span>{t('layout.search.navigate')}</span>
                </div>
                <div className="header-search-modal__footer-item">
                  <kbd className="header-search-modal__kbd">↵</kbd>
                  <span>{t('layout.search.select')}</span>
                </div>
                <div className="header-search-modal__footer-item">
                  <kbd className="header-search-modal__kbd">esc</kbd>
                  <span>{t('layout.search.close')}</span>
                </div>
              </div>
            </div>
          </div>,
          portalTarget
        )}
    </>
  );
});
