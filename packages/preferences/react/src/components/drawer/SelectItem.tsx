/**
 * 选择设置项组件 - 自定义下拉菜单版本
 * @description 完全自定义样式，解决原生 select 无法自定义下拉菜单的问题
 */
import { memo, useCallback, useId, useState, useRef, useEffect } from 'react';
import { getIcon } from '@admin-core/preferences';

export interface SelectItemProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 变更回调 */
  onChange: (value: string | number) => void;
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
  /** 是否禁用 */
  disabled?: boolean;
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

  // 当前选中的选项
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || '';

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
            const idx = options.findIndex((opt) => opt.value === value);
            setFocusedIndex(idx >= 0 ? idx : 0);
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
            const idx = options.findIndex((opt) => opt.value === value);
            setFocusedIndex(idx >= 0 ? idx : 0);
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
    [disabled, isOpen, focusedIndex, options, value, handleSelect]
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
      const currentIndex = options.findIndex((opt) => opt.value === value);
      // 边界检查：确保 focusedIndex 在有效范围内
      setFocusedIndex(currentIndex >= 0 ? currentIndex : (options.length > 0 ? 0 : -1));
    }
  }, [isOpen, options, value]);

  return (
    <div className={`select-item ${disabled ? 'disabled' : ''}`}>
      <label id={selectId} className="select-item-label">
        {label}
      </label>
      <div className="select-item-control" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={selectId}
          aria-controls={listboxId}
        >
          <span className="custom-select-value">{selectedLabel}</span>
          <span
            className="custom-select-arrow"
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
          >
            {options.map((opt, index) => (
              <li
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${index === focusedIndex ? 'focused' : ''}`}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default SelectItem;
