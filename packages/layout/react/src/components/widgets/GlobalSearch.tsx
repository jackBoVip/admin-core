/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';
import type { MenuItem } from '@admin-core/layout';

interface FlatMenuItem extends MenuItem {
  parentPath?: string[];
  searchText: string;
}

export const GlobalSearch = memo(function GlobalSearch() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const listResizeObserverRef = useRef<ResizeObserver | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  const menus = props.menus || [];
  const shortcutConfig = props.shortcutKeys || {};
  const shortcutEnabled =
    shortcutConfig.enable !== false && shortcutConfig.globalSearch !== false;

  // 扁平化菜单
  const flatMenus = useMemo<FlatMenuItem[]>(() => {
    if (!isOpen) return [];
    const result: FlatMenuItem[] = [];

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

  // 搜索结果
  const MAX_RESULTS = 200;
  const searchResults = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return [];

    const results: FlatMenuItem[] = [];
    for (const item of flatMenus) {
      if (item.searchText.includes(query)) {
        results.push(item);
        if (results.length >= MAX_RESULTS) break;
      }
    }
    return results;
  }, [keyword, flatMenus]);

  const [itemHeight, setItemHeight] = useState(56);
  const RESULT_MAX_HEIGHT = 320;
  const RESULT_OVERSCAN = 4;
  const totalHeight = searchResults.length * itemHeight;
  const viewportHeight = totalHeight === 0 ? RESULT_MAX_HEIGHT : Math.min(totalHeight, RESULT_MAX_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - RESULT_OVERSCAN);
  const endIndex = Math.min(
    searchResults.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + RESULT_OVERSCAN
  );
  const visibleResults = useMemo(
    () => searchResults.slice(startIndex, endIndex),
    [searchResults, startIndex, endIndex]
  );

  // 打开搜索框
  const openSearch = useCallback(() => {
    setIsOpen(true);
    setKeyword('');
    setSelectedIndex(0);
  }, []);

  // 关闭搜索框
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setKeyword('');
    setSelectedIndex(0);
  }, []);

  const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  }, []);

  // 选择菜单项
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

  const handleResultClick = useCallback((e: React.MouseEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      const item = searchResults[index];
      if (item) selectItem(item);
    }
  }, [searchResults, selectItem]);

  const handleResultMouseEnter = useCallback((e: React.MouseEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      setSelectedIndex(index);
    }
  }, []);

  // 滚动到选中项
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
  }, [itemHeight]);

  const scrollToSelected = useCallback(() => {
    const list = resultListRef.current;
    if (!list) return;
    ensureIndexVisible(selectedIndex);
  }, [ensureIndexVisible, selectedIndex]);

  // 键盘导航
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.scrollTop += e.deltaY;
    const nextTop = target.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  // 全局快捷键
  useEffect(() => {
    if (!shortcutEnabled) return;
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

  useEffect(() => {
    if (!isOpen) return;
    const list = resultListRef.current;
    if (!list) return;
    const updateItemHeight = () => {
      const firstItem = list.querySelector('.layout-list-item') as HTMLElement | null;
      if (!firstItem) return;
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== itemHeight) {
        setItemHeight(height);
      }
    };
    const frame = requestAnimationFrame(updateItemHeight);
    if (typeof ResizeObserver !== 'undefined') {
      const firstItem = list.querySelector('.layout-list-item') as HTMLElement | null;
      if (firstItem) {
        const observer = new ResizeObserver(updateItemHeight);
        observer.observe(firstItem);
        listResizeObserverRef.current = observer;
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      if (listResizeObserverRef.current) {
        listResizeObserverRef.current.disconnect();
        listResizeObserverRef.current = null;
      }
    };
  }, [isOpen, searchResults.length, itemHeight]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex((prev) => (prev === 0 ? prev : 0));
    if (resultListRef.current) {
      resultListRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [keyword]);

  useEffect(() => {
    if (isOpen) return;
    if (resultListRef.current) {
      resultListRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (resultListRef.current) {
      resultListRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [isOpen, totalHeight, viewportHeight, scrollTop]);

  const shortcutText = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    return isMac ? '⌘K' : 'Ctrl K';
  }, []);

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

      {isOpen &&
        createPortal(
          <div className="header-search-overlay" data-state="open">
            <div
              className="header-search-backdrop"
              onClick={closeSearch}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
            />

            <div
              className="header-search-modal"
              onKeyDown={handleKeydown}
              role="dialog"
              aria-modal="true"
              style={{
                backgroundColor: 'var(--header-search-modal-bg, var(--card, var(--background, #ffffff)))',
                border: '1px solid var(--header-search-modal-border, var(--border, #e2e8f0))',
                boxShadow:
                  'var(--header-search-modal-shadow, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))',
              }}
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
          document.body
        )}
    </>
  );
});
