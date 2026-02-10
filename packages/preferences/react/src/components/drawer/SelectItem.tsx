/**
 * 选择设置项组件 - 自定义下拉菜单版本
 * @description 完全自定义样式，解决原生 select 无法自定义下拉菜单的问题
 */
import { getIcon, type SelectItemBaseProps } from '@admin-core/preferences';
import { memo, useCallback, useId, useState, useRef, useEffect, useMemo } from 'react';

export interface SelectItemProps extends SelectItemBaseProps {
  /** 当前值 */
  value: string | number;
  /** 变更回调 */
  onChange: (value: string | number) => void;
}

// 获取下拉箭头图标
const chevronDownIcon = getIcon('chevronDown');

/**
 * 自定义选择组件
 * @description 使用 div 模拟 select，完全控制下拉菜单样式
 */
export const SelectItem = memo<SelectItemProps>(function SelectItem({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) {
  const selectId = useId();
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const listResizeObserverRef = useRef<ResizeObserver | null>(null);

  const optionsIndexMap = useMemo(() => {
    const map = new Map<string | number, number>();
    options.forEach((opt, index) => map.set(opt.value, index));
    return map;
  }, [options]);

  const optionsLabelMap = useMemo(() => {
    const map = new Map<string | number, string>();
    options.forEach((opt) => map.set(opt.value, opt.label));
    return map;
  }, [options]);

  const optionsValueMap = useMemo(() => {
    const map = new Map<string, string | number>();
    options.forEach((opt) => map.set(String(opt.value), opt.value));
    return map;
  }, [options]);

  // 当前选中的选项
  const selectedLabel = useMemo(() => optionsLabelMap.get(value) || '', [optionsLabelMap, value]);

  // 切换下拉菜单
  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  // 选择选项
  const handleSelect = useCallback(
    (optValue: string | number) => {
      onChange(optValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleOptionClick = useCallback((e: React.MouseEvent) => {
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value === undefined) return;
    if (optionsValueMap.has(value)) {
      handleSelect(optionsValueMap.get(value) as string | number);
    }
  }, [optionsValueMap, handleSelect]);

  // 键盘导航（带边界检查）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || options.length === 0) return;

      const maxIndex = options.length - 1;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && focusedIndex >= 0 && focusedIndex <= maxIndex) {
            handleSelect(options[focusedIndex].value);
          } else {
            setIsOpen(true);
            const idx = optionsIndexMap.get(value);
            setFocusedIndex(idx !== undefined ? idx : 0);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            const idx = optionsIndexMap.get(value);
            setFocusedIndex(idx !== undefined ? idx : 0);
          } else {
            setFocusedIndex((prev) => Math.min(prev + 1, maxIndex));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => Math.max(prev - 1, 0));
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(maxIndex);
          break;
      }
    },
    [disabled, isOpen, focusedIndex, options, value, handleSelect, optionsIndexMap]
  );

  // 点击外部关闭（SSR 安全）
  useEffect(() => {
    // SSR 环境检查
    if (typeof document === 'undefined') return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 打开时重置焦点索引
  useEffect(() => {
    if (isOpen) {
      const currentIndex = optionsIndexMap.get(value) ?? -1;
      // 边界检查：确保 focusedIndex 在有效范围内
      setFocusedIndex(currentIndex >= 0 ? currentIndex : (options.length > 0 ? 0 : -1));
    }
  }, [isOpen, options, value, optionsIndexMap]);

  const [itemHeight, setItemHeight] = useState(32);
  const OPTION_MAX_HEIGHT = 240;
  const OPTION_OVERSCAN = 4;
  const totalHeight = options.length * itemHeight;
  const viewportHeight = Math.min(totalHeight, OPTION_MAX_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OPTION_OVERSCAN);
  const endIndex = Math.min(
    options.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + OPTION_OVERSCAN
  );
  const visibleOptions = useMemo(
    () => options.slice(startIndex, endIndex),
    [options, startIndex, endIndex]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLUListElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLUListElement>) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.scrollTop += e.deltaY;
    const nextTop = target.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  const ensureIndexVisible = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const top = index * itemHeight;
    const bottom = top + itemHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + viewportHeight;
    if (top < viewTop) {
      list.scrollTop = top;
    } else if (bottom > viewBottom) {
      list.scrollTop = bottom - viewportHeight;
    }
    const nextTop = list.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [itemHeight, viewportHeight]);

  useEffect(() => {
    if (!isOpen) return;
    const currentIndex = optionsIndexMap.get(value) ?? -1;
    if (currentIndex >= 0) {
      ensureIndexVisible(currentIndex);
    } else if (listRef.current) {
      listRef.current.scrollTop = 0;
      setScrollTop((prev) => (prev === 0 ? prev : 0));
    }
  }, [isOpen, optionsIndexMap, value, ensureIndexVisible]);

  useEffect(() => {
    if (isOpen) return;
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || focusedIndex < 0) return;
    ensureIndexVisible(focusedIndex);
  }, [isOpen, focusedIndex, ensureIndexVisible]);

  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    if (!list) return;
    const updateItemHeight = () => {
      const firstItem = list.querySelector('.custom-select-option') as HTMLElement | null;
      if (!firstItem) return;
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== itemHeight) {
        setItemHeight(height);
      }
    };
    const frame = requestAnimationFrame(updateItemHeight);
    if (typeof ResizeObserver !== 'undefined') {
      const firstItem = list.querySelector('.custom-select-option') as HTMLElement | null;
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
  }, [isOpen, options.length, itemHeight]);

  useEffect(() => {
    if (!isOpen) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (listRef.current) {
      listRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [isOpen, totalHeight, viewportHeight, scrollTop]);

  return (
    <div
      className={`select-item pref-disabled ${disabled ? 'disabled' : ''}`}
      data-disabled={disabled ? 'true' : undefined}
    >
      <label id={selectId} className="select-item-label pref-disabled-label">
        {label}
      </label>
      <div className="select-item-control" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`custom-select-trigger pref-disabled-trigger data-open:ring-1 data-open:ring-ring/30 data-open:border-primary data-open:shadow-md ${isOpen ? 'open' : ''}`}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          data-state={isOpen ? 'open' : 'closed'}
          data-disabled={disabled ? 'true' : undefined}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={selectId}
          aria-controls={listboxId}
        >
          <span className="custom-select-value">{selectedLabel}</span>
          <span
            className="custom-select-arrow aria-expanded:rotate-180 transition-transform"
            dangerouslySetInnerHTML={{ __html: chevronDownIcon }}
          />
        </button>

        {isOpen && (
          <ul
            id={listboxId}
            className="custom-select-dropdown"
            role="listbox"
            aria-labelledby={selectId}
            tabIndex={-1}
            ref={listRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            style={{ height: `${viewportHeight}px` }}
          >
            <li
              role="presentation"
              style={{ height: `${totalHeight}px`, padding: 0, margin: 0, listStyle: 'none' }}
            />
            {visibleOptions.map((opt, index) => {
              const actualIndex = startIndex + index;
              return (
                <li
                  key={opt.value}
                  className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${actualIndex === focusedIndex ? 'focused' : ''}`}
                  role="option"
                  aria-selected={opt.value === value}
                  data-selected={opt.value === value ? 'true' : undefined}
                  data-focused={actualIndex === focusedIndex ? 'true' : undefined}
                  data-value={String(opt.value)}
                  onClick={handleOptionClick}
                  onMouseEnter={() => setFocusedIndex(actualIndex)}
                  style={{
                    position: 'absolute',
                    top: `${actualIndex * itemHeight}px`,
                    height: `${itemHeight}px`,
                    left: 0,
                    right: 0,
                  }}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});

export default SelectItem;
