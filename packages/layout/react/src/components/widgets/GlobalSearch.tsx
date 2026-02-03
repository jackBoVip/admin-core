/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
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
      if (item.path) {
        events.onGlobalSearch?.(item.path);

        if (props.router?.navigate) {
          props.router.navigate(item.path);
        }
      }
      closeSearch();
    },
    [events, props.router, closeSearch]
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
  }, [openSearch, closeSearch]);

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
        className="header-search-btn flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100/50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
        title={t('layout.header.search')}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={openSearch}
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden md:inline">{t('layout.header.search')}</span>
        <kbd className="hidden rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 md:inline">
          {shortcutText}
        </kbd>
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-start justify-center px-4 pt-20" data-state="open">
            <div className="fixed inset-0 bg-black/50" onClick={closeSearch} />

            <div
              className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
              onKeyDown={handleKeydown}
            >
              <div className="flex items-center border-b px-4 dark:border-gray-700">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={keyword}
                  onChange={handleKeywordChange}
                  className="flex-1 border-0 bg-transparent px-3 py-4 text-base outline-none placeholder:text-gray-400"
                  placeholder={t('layout.search.placeholder')}
                />
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700">
                  ESC
                </kbd>
              </div>

              <div
                ref={resultListRef}
                className="layout-scroll-container max-h-80 overflow-y-auto"
                style={{ height: `${viewportHeight}px`, position: 'relative' }}
                onScroll={handleScroll}
                onWheel={handleWheel}
              >
                {keyword && searchResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">{t('layout.search.noResults')}</div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div style={{ height: `${totalHeight}px`, pointerEvents: 'none' }} />
                    {visibleResults.map((item, index) => {
                      const actualIndex = startIndex + index;
                      return (
                        <div
                          key={item.key}
                          data-index={actualIndex}
                          className={`layout-list-item flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                            actualIndex === selectedIndex
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                          data-selected={actualIndex === selectedIndex ? 'true' : undefined}
                          onClick={handleResultClick}
                          onMouseEnter={handleResultMouseEnter}
                          style={{
                            position: 'absolute',
                            top: `${actualIndex * itemHeight}px`,
                            left: 0,
                            right: 0,
                            height: `${itemHeight}px`,
                          }}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              actualIndex === selectedIndex ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                          >
                            {item.icon ? (
                              <span className="text-lg">{item.icon}</span>
                            ) : (
                              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{item.name}</div>
                            {item.parentPath && (
                              <div className="truncate text-xs text-gray-400">{item.parentPath.join(' / ')}</div>
                            )}
                          </div>
                          {actualIndex === selectedIndex && <span className="text-xs text-gray-400">↵</span>}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-400">{t('layout.search.tips')}</div>
                )}
              </div>

              <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↑</kbd>
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↓</kbd>
                  {t('layout.search.navigate')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↵</kbd>
                  {t('layout.search.select')}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">esc</kbd>
                  {t('layout.search.close')}
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
});
