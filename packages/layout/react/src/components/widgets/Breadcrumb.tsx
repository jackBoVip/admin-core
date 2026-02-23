/**
 * 面包屑组件
 * @description 显示在 header 左侧的导航面包屑，自动根据当前路由和菜单生成
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBreadcrumbState, useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@admin-core/layout';

export interface BreadcrumbProps {
  /** 面包屑数据（如果不传则自动从菜单生成） */
  items?: BreadcrumbItemType[];
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示首页 */
  showHome?: boolean;
  /** 分隔符 */
  separator?: React.ReactNode;
  /** 点击回调 */
  onItemClick?: (item: BreadcrumbItemType) => void;
}

/**
 * 默认分隔符
 */
const DefaultSeparator = () => (
  <span className="text-muted-foreground">
    {renderLayoutIcon('breadcrumb-separator', 'sm')}
  </span>
);

function getBreadcrumbItemKey(item: BreadcrumbItemType, index: number): string {
  return item.key || item.path || `__breadcrumb_${index}`;
}

/**
 * 面包屑组件
 * 自动根据当前路由和菜单生成面包屑，无需用户手动传入
 */
export const Breadcrumb = memo(function Breadcrumb({
  items,
  showIcon: showIconProp,
  showHome: _showHome,
  separator,
  onItemClick,
}: BreadcrumbProps) {
  const {
    breadcrumbs: autoBreadcrumbs,
    showIcon: autoShowIcon,
    handleClick: autoHandleClick,
    resolveChildren,
  } = useBreadcrumbState();
  const { t } = useLayoutContext();
  const navRef = useRef<HTMLElement | null>(null);
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  const rawBreadcrumbItems = items && items.length > 0 ? items : autoBreadcrumbs;

  const breadcrumbItems = useMemo(() => {
    return rawBreadcrumbItems.map((item) => {
      if (item.name && item.name.startsWith('layout.')) {
        return { ...item, name: t(item.name) };
      }
      return item;
    });
  }, [rawBreadcrumbItems, t]);

  const showIcon = showIconProp ?? autoShowIcon;

  const breadcrumbChildItemsMap = useMemo(() => {
    const map = new Map<string, BreadcrumbItemType[]>();
    breadcrumbItems.forEach((item, index) => {
      map.set(getBreadcrumbItemKey(item, index), resolveChildren(item));
    });
    return map;
  }, [breadcrumbItems, resolveChildren]);

  const handleClick = useCallback(
    (item: BreadcrumbItemType) => {
      if (!item.clickable || !item.path) return;
      if (onItemClick) {
        onItemClick(item);
      } else {
        autoHandleClick(item);
      }
    },
    [onItemClick, autoHandleClick]
  );

  const handleMenuItemClick = useCallback(
    (item: BreadcrumbItemType) => {
      handleClick(item);
      setOpenItemKey(null);
    },
    [handleClick]
  );

  const handleTriggerClick = useCallback(
    (item: BreadcrumbItemType, index: number, hasChildMenu: boolean) => {
      if (hasChildMenu) {
        const itemKey = getBreadcrumbItemKey(item, index);
        setOpenItemKey((prev) => (prev === itemKey ? null : itemKey));
        return;
      }
      handleClick(item);
      setOpenItemKey(null);
    },
    [handleClick]
  );

  const renderItemIcon = useCallback(
    (item: BreadcrumbItemType) => {
      if (!showIcon || !item.icon) {
        return null;
      }
      return (
        <span className="breadcrumb__icon">
          {item.icon === 'home' ? (
            renderLayoutIcon('home', 'sm')
          ) : (
            <span className="text-xs">{item.icon}</span>
          )}
        </span>
      );
    },
    [showIcon]
  );

  useEffect(() => {
    if (!openItemKey) return;
    const exists = breadcrumbItems.some(
      (item, index) => getBreadcrumbItemKey(item, index) === openItemKey
    );
    if (!exists) {
      setOpenItemKey(null);
    }
  }, [breadcrumbItems, openItemKey]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (navRef.current && !navRef.current.contains(target)) {
        setOpenItemKey(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav ref={navRef} className="breadcrumb flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {breadcrumbItems.map((item, index) => {
          const itemKey = getBreadcrumbItemKey(item, index);
          const isLast = index === breadcrumbItems.length - 1;
          const childItems = breadcrumbChildItemsMap.get(itemKey) ?? [];
          const hasChildMenu = childItems.length > 0;
          const canTrigger = hasChildMenu || !!(item.clickable && item.path && !isLast);
          const isDropdownOpen = hasChildMenu && openItemKey === itemKey;

          return (
            <li key={itemKey} className="flex items-center">
              <div
                className="header-widget-dropdown breadcrumb__dropdown relative"
                data-state={isDropdownOpen ? 'open' : 'closed'}
              >
                {canTrigger ? (
                  <button
                    type="button"
                    className="breadcrumb__item breadcrumb__item--trigger flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleTriggerClick(item, index, hasChildMenu)}
                  >
                    {renderItemIcon(item)}
                    <span>{item.name}</span>
                    {hasChildMenu && (
                      <span
                        className={`breadcrumb__dropdown-arrow ${
                          isDropdownOpen ? 'is-open' : ''
                        }`}
                      >
                        {renderLayoutIcon('menu-arrow-down', 'xs')}
                      </span>
                    )}
                  </button>
                ) : (
                  <span
                    className={`breadcrumb__item flex items-center gap-1 ${
                      isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {renderItemIcon(item)}
                    <span>{item.name}</span>
                  </span>
                )}

                {hasChildMenu && isDropdownOpen && (
                  <div className="header-widget-dropdown__menu breadcrumb__dropdown-menu absolute left-0 top-full mt-2">
                    {childItems.map((child) => {
                      const childKey = child.key || child.path || child.name;
                      const disabled = !child.clickable || !child.path;
                      const childName =
                        child.name.startsWith('layout.')
                          ? t(child.name)
                          : child.name;
                      return (
                        <button
                          key={childKey}
                          type="button"
                          className="header-widget-dropdown__item breadcrumb__dropdown-item"
                          disabled={disabled}
                          data-disabled={disabled ? 'true' : 'false'}
                          onClick={() => handleMenuItemClick(child)}
                        >
                          {renderItemIcon(child)}
                          <span>{childName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isLast && (
                <span className="breadcrumb__separator mx-1.5">
                  {separator || <DefaultSeparator />}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
