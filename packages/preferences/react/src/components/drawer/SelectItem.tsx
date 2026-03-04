/**
 * 选择设置项组件模块（自定义下拉版本）。
 * @description 使用自绘触发器与列表面板实现可样式化、可键盘导航的选择控件。
 */
import { getIcon, type SelectItemBaseProps } from '@admin-core/preferences';
import { useListItemHeight, useVirtualListScroll } from '@admin-core/shared-react';
import { memo, useCallback, useId, useState, useRef, useEffect, useMemo } from 'react';

/**
 * 下拉选择设置项参数。
 */
export interface SelectItemProps extends SelectItemBaseProps {
  /** 当前值 */
  value: string | number;
  /** 变更回调 */
  onChange: (value: string | number) => void;
}

/**
 * 下拉箭头图标缓存。
 * @description 提升至模块级，避免组件每次渲染重复获取图标。
 */
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
  /**
   * 触发器标签 ID。
   * @description 作为列表框 `aria-labelledby` 的关联源，提升读屏可达性。
   */
  const selectId = useId();
  /**
   * 列表框 ID。
   * @description 用于触发器 `aria-controls` 与列表容器的无障碍关联。
   */
  const listboxId = useId();
  /**
   * 下拉展开状态。
   * @description 控制选项面板显隐与相关交互副作用。
   */
  const [isOpen, setIsOpen] = useState(false);
  /**
   * 当前键盘焦点选项索引。
   * @description 记录键盘导航高亮项，用于 Enter/Space 触发选择。
   */
  const [focusedIndex, setFocusedIndex] = useState(-1);
  /**
   * 组件根容器引用。
   * @description 用于外部点击检测，决定是否收起下拉面板。
   */
  const containerRef = useRef<HTMLDivElement>(null);
  /**
   * 触发按钮引用。
   * @description 关闭列表后回退焦点到触发器，保持键盘交互连续性。
   */
  const triggerRef = useRef<HTMLButtonElement>(null);
  /**
   * 选项列表容器引用。
   * @description 提供滚动读写能力，供虚拟列表与可见区同步逻辑使用。
   */
  const listRef = useRef<HTMLUListElement>(null);

  /**
   * 选项值到索引映射。
   * @description 支持从当前值快速定位焦点索引，避免线性查找。
   */
  const optionsIndexMap = useMemo(() => {
    const map = new Map<string | number, number>();
    options.forEach((opt, index) => map.set(opt.value, index));
    return map;
  }, [options]);

  /**
   * 选项值到标签映射。
   * @description 用于根据当前值快速解析展示文案。
   */
  const optionsLabelMap = useMemo(() => {
    const map = new Map<string | number, string>();
    options.forEach((opt) => map.set(opt.value, opt.label));
    return map;
  }, [options]);

  /**
   * 字符串值到原始值映射。
   * @description 用于从 DOM `data-value` 反解真实 value 类型。
   */
  const optionsValueMap = useMemo(() => {
    const map = new Map<string, string | number>();
    options.forEach((opt) => map.set(String(opt.value), opt.value));
    return map;
  }, [options]);

  /**
   * 当前选中项展示文案。
   * @description 通过值到标签映射快速获取显示文本。
   */
  const selectedLabel = useMemo(() => optionsLabelMap.get(value) || '', [optionsLabelMap, value]);

  /**
   * 切换下拉面板显示状态
   * @description 在组件可用状态下打开或关闭下拉列表。
   */
  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  /**
   * 选择指定选项
   * @description 更新外部值后关闭下拉框并将焦点返还触发按钮。
   * @param optValue 选中的选项值。
   */
  const handleSelect = useCallback(
    (optValue: string | number) => {
      onChange(optValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  /**
   * 处理选项点击事件
   * @description 从选项节点读取 `data-value` 并映射为真实值执行选择。
   * @param e React 鼠标事件对象。
   */
  const handleOptionClick = useCallback((e: React.MouseEvent) => {
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value === undefined) return;
    if (optionsValueMap.has(value)) {
      handleSelect(optionsValueMap.get(value) as string | number);
    }
  }, [optionsValueMap, handleSelect]);

  /**
   * 处理键盘交互
   * @description 支持 Enter/Space 选择、Esc 关闭、方向键导航与 Home/End 跳转。
   * @param e React 键盘事件对象。
   */
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

  /**
   * 监听外部点击关闭下拉框。
   * @description 包含 SSR 场景保护，避免无 `document` 时访问浏览器 API。
   */
  useEffect(() => {
    /**
     * SSR 环境检查。
     * @description 服务端渲染时不执行 DOM 事件绑定。
     */
    if (typeof document === 'undefined') return;
    
    /**
     * 处理外部点击关闭
     * @description 当点击目标不在当前组件容器中时关闭下拉面板。
     * @param e 浏览器鼠标事件对象。
     */
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

  /**
   * 打开下拉框时同步焦点索引。
   * @description 默认聚焦当前选中项；无选中项时回退到首项。
   */
  useEffect(() => {
    if (isOpen) {
      const currentIndex = optionsIndexMap.get(value) ?? -1;
      /**
       * 焦点索引边界保护。
       * @description 防止选项数量变化后产生越界索引。
       */
      setFocusedIndex(currentIndex >= 0 ? currentIndex : (options.length > 0 ? 0 : -1));
    }
  }, [isOpen, options, value, optionsIndexMap]);

  /**
   * 选项项高。
   * @description 默认为 `32px`，打开后会按真实渲染高度动态校准。
   */
  const [itemHeight, setItemHeight] = useState(32);
  /**
   * 下拉面板最大高度（像素）。
   * @description 超出后启用滚动，避免列表过长撑破页面布局。
   */
  const OPTION_MAX_HEIGHT = 240;
  /**
   * 虚拟列表超扫数量。
   * @description 在可见区上下额外渲染若干项，减少快速滚动时空白闪烁。
   */
  const OPTION_OVERSCAN = 4;
  /**
   * 虚拟列表总高度。
   * @description 用于占位容器高度计算与绝对定位项布局。
   */
  const totalHeight = options.length * itemHeight;
  /**
   * 虚拟列表视口高度。
   * @description 取总高度与最大高度较小值，作为列表容器高度。
   */
  const viewportHeight = Math.min(totalHeight, OPTION_MAX_HEIGHT);
  const { scrollTop, setScrollTop, handleScroll, handleWheel } = useVirtualListScroll({
    isOpen,
    listRef,
    totalHeight,
    viewportHeight,
  });
  /**
   * 虚拟列表起始索引。
   * @description 根据滚动位置与超扫策略计算当前首个渲染项索引。
   */
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OPTION_OVERSCAN);
  /**
   * 虚拟列表结束索引。
   * @description 根据视口下边界与超扫策略计算当前末尾渲染边界。
   */
  const endIndex = Math.min(
    options.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + OPTION_OVERSCAN
  );
  /**
   * 当前可见选项切片。
   * @description 仅渲染起止区间内数据，降低大数据量列表渲染开销。
   */
  const visibleOptions = useMemo(
    () => options.slice(startIndex, endIndex),
    [options, startIndex, endIndex]
  );

  /**
   * 打开下拉时自动探测真实项高。
   * @description 观测首项高度变化，动态同步到虚拟列表计算参数。
   */
  useListItemHeight({
    isOpen,
    listRef,
    itemHeight,
    itemCount: options.length,
    setItemHeight,
    itemSelector: '.custom-select-option',
  });

  /**
   * 确保指定索引可见
   * @description 根据目标项位置自动调整滚动容器 `scrollTop`。
   * @param index 目标选项索引。
   */
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
  }, [itemHeight, setScrollTop, viewportHeight]);

  /**
   * 下拉展开后同步初始可见区域。
   * @description 优先滚动到当前选中项；无选中项时回到顶部。
   */
  useEffect(() => {
    if (!isOpen) return;
    const currentIndex = optionsIndexMap.get(value) ?? -1;
    if (currentIndex >= 0) {
      ensureIndexVisible(currentIndex);
    } else if (listRef.current) {
      listRef.current.scrollTop = 0;
      setScrollTop((prev) => (prev === 0 ? prev : 0));
    }
  }, [isOpen, optionsIndexMap, setScrollTop, value, ensureIndexVisible]);

  /**
   * 监听键盘焦点索引变化。
   * @description 当下拉已打开且焦点索引有效时，实时保证聚焦项位于可视区。
   */
  useEffect(() => {
    if (!isOpen || focusedIndex < 0) return;
    ensureIndexVisible(focusedIndex);
  }, [isOpen, focusedIndex, ensureIndexVisible]);

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

/**
 * 默认导出选择器配置项组件。
 */
export default SelectItem;
