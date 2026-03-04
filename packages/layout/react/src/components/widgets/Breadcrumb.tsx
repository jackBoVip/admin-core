/**
 * 面包屑组件。
 * @description 显示在 header 左侧的导航面包屑，可自动根据当前路由和菜单生成。
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBreadcrumbState, useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@admin-core/layout';

/**
 * 面包屑组件属性。
 * @description 支持外部传入数据并覆盖自动推导结果。
 */
export interface BreadcrumbProps {
  /** 面包屑数据（如果不传则自动从菜单生成）。 */
  items?: BreadcrumbItemType[];
  /** 是否显示图标。 */
  showIcon?: boolean;
  /** 是否显示首页。 */
  showHome?: boolean;
  /** 分隔符。 */
  separator?: React.ReactNode;
  /** 点击回调。 */
  onItemClick?: (item: BreadcrumbItemType) => void;
}

/**
 * 默认分隔符。
 */
const DefaultSeparator = () => (
  <span className="text-muted-foreground">
    {renderLayoutIcon('breadcrumb-separator', 'sm')}
  </span>
);

/**
 * 获取面包屑项稳定键。
 *
 * @param item 面包屑项。
 * @param index 当前索引。
 * @returns 稳定唯一键。
 */
function getBreadcrumbItemKey(item: BreadcrumbItemType, index: number): string {
  return item.key || item.path || `__breadcrumb_${index}`;
}

/**
 * 面包屑组件。
 * @description 自动根据当前路由和菜单生成面包屑，无需用户手动传入。
 * @param props 组件参数。
 * @returns 面包屑导航节点。
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
  /**
   * 面包屑导航容器引用。
   */
  const navRef = useRef<HTMLElement | null>(null);
  /**
   * 当前展开的下拉面包屑项 key。
   */
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  /**
   * 原始面包屑数据来源：优先使用外部传入项，否则回退自动推导结果。
   */
  const rawBreadcrumbItems = items && items.length > 0 ? items : autoBreadcrumbs;

  /**
   * 面包屑展示数据，自动翻译 `layout.*` 多语言键。
   */
  const breadcrumbItems = useMemo(() => {
    return rawBreadcrumbItems.map((item) => {
      if (item.name && item.name.startsWith('layout.')) {
        return { ...item, name: t(item.name) };
      }
      return item;
    });
  }, [rawBreadcrumbItems, t]);

  /**
   * 图标显示策略：组件显式传参优先，其次读取自动面包屑配置。
   */
  const showIcon = showIconProp ?? autoShowIcon;

  /**
   * 缓存每个面包屑项的子菜单集合，避免重复解析子路由。
   */
  const breadcrumbChildItemsMap = useMemo(() => {
    const map = new Map<string, BreadcrumbItemType[]>();
    breadcrumbItems.forEach((item, index) => {
      map.set(getBreadcrumbItemKey(item, index), resolveChildren(item));
    });
    return map;
  }, [breadcrumbItems, resolveChildren]);

  /**
   * 处理面包屑项点击，优先触发外部回调，否则回退到内部路由处理。
   *
   * @param item 被点击的面包屑项。
   */
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

  /**
   * 处理下拉子菜单项点击，并在触发后关闭当前下拉菜单。
   *
   * @param item 被点击的子菜单项。
   */
  const handleMenuItemClick = useCallback(
    (item: BreadcrumbItemType) => {
      handleClick(item);
      setOpenItemKey(null);
    },
    [handleClick]
  );

  /**
   * 处理面包屑触发器点击，有子菜单时切换下拉，无子菜单时执行导航。
   *
   * @param item 面包屑项。
   * @param index 当前索引。
   * @param hasChildMenu 是否存在子菜单。
   */
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

  /**
   * 渲染面包屑项图标。
   *
   * @param item 面包屑项。
   * @returns 图标节点或 `null`。
   */
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
    /**
     * 监听全局指针按下事件，点击组件外部时关闭下拉菜单。
     *
     * @param event 原生指针事件。
     */
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
