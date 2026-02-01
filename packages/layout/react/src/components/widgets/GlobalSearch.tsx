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
}

export const GlobalSearch = memo(function GlobalSearch() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  const menus = props.menus || [];

  // 扁平化菜单
  const flatMenus = useMemo<FlatMenuItem[]>(() => {
    const result: FlatMenuItem[] = [];

    const flatten = (items: MenuItem[], parentPath: string[] = []) => {
      for (const item of items) {
        const currentPath = [...parentPath, item.name];

        if (item.path && !item.hidden) {
          result.push({
            ...item,
            parentPath: parentPath.length > 0 ? parentPath : undefined,
          });
        }

        if (item.children?.length) {
          flatten(item.children, currentPath);
        }
      }
    };

    flatten(menus);
    return result;
  }, [menus]);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!keyword.trim()) return [];

    const query = keyword.toLowerCase();

    return flatMenus
      .filter((item) => {
        const name = (item.name || '').toLowerCase();
        const path = (item.path || '').toLowerCase();
        return name.includes(query) || path.includes(query);
      })
      .slice(0, 10);
  }, [keyword, flatMenus]);

  // 打开搜索框
  const openSearch = useCallback(() => {
    setIsOpen(true);
    setKeyword('');
    setSelectedIndex(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  // 关闭搜索框
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setKeyword('');
    setSelectedIndex(0);
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

  // 滚动到选中项
  const scrollToSelected = useCallback(() => {
    const list = resultListRef.current;
    const selected = list?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selected && list) {
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      if (selectedRect.bottom > listRect.bottom) {
        list.scrollTop += selectedRect.bottom - listRect.bottom;
      } else if (selectedRect.top < listRect.top) {
        list.scrollTop -= listRect.top - selectedRect.top;
      }
    }
  }, [selectedIndex]);

  // 键盘导航
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex < searchResults.length - 1) {
            setSelectedIndex(selectedIndex + 1);
            setTimeout(scrollToSelected, 0);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
            setTimeout(scrollToSelected, 0);
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

  // 全局快捷键
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [isOpen, openSearch, closeSearch]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [keyword]);

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
          <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-20">
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
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1 border-0 bg-transparent px-3 py-4 text-base outline-none placeholder:text-gray-400"
                  placeholder={t('layout.search.placeholder')}
                />
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700">
                  ESC
                </kbd>
              </div>

              <div ref={resultListRef} className="max-h-80 overflow-y-auto">
                {keyword && searchResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">{t('layout.search.noResults')}</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <div
                      key={item.key}
                      data-index={index}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          index === selectedIndex ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-700'
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
                      {index === selectedIndex && <span className="text-xs text-gray-400">↵</span>}
                    </div>
                  ))
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
