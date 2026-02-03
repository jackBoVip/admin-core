/**
 * 面包屑组件
 * @description 显示在 header 左侧的导航面包屑，自动根据当前路由和菜单生成
 */

import { memo, useCallback, useMemo } from 'react';
import type { BreadcrumbItem as BreadcrumbItemType } from '@admin-core/layout';
import { useBreadcrumbState, useLayoutContext } from '../../hooks';

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
  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

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
  // 使用自动面包屑状态
  const { breadcrumbs: autoBreadcrumbs, showIcon: autoShowIcon, handleClick: autoHandleClick } = useBreadcrumbState();
  const context = useLayoutContext();
  
  // 如果传入了 items，使用传入的；否则使用自动生成的
  const rawBreadcrumbItems = items && items.length > 0 ? items : autoBreadcrumbs;
  
  // 翻译面包屑名称（处理可能未翻译的 key）
  const breadcrumbItems = useMemo(() => {
    return rawBreadcrumbItems.map(item => {
      // 如果名称看起来是翻译 key（包含 layout. 前缀），尝试翻译
      if (item.name && item.name.startsWith('layout.')) {
        return { ...item, name: context.t(item.name) };
      }
      return item;
    });
  }, [rawBreadcrumbItems, context.t]);
  
  const showIcon = showIconProp ?? autoShowIcon;

  // 点击处理
  const handleClick = useCallback((item: BreadcrumbItemType) => {
    if (!item.clickable || !item.path) return;
    if (onItemClick) {
      onItemClick(item);
    } else {
      autoHandleClick(item);
    }
  }, [onItemClick, autoHandleClick]);

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (Number.isNaN(index)) return;
    const item = breadcrumbItems[index];
    if (item) {
      handleClick(item);
    }
  }, [breadcrumbItems, handleClick]);

  // 如果没有面包屑数据，不渲染
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isClickable = item.clickable && !isLast && item.path;
          
          return (
            <li key={item.key || item.path || index} className="flex items-center">
              {/* 面包屑项 */}
              {isClickable ? (
                <button
                  type="button"
                  className="breadcrumb__item flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  data-index={index}
                  onClick={handleItemClick}
                >
                  {showIcon && item.icon && (
                    <span className="breadcrumb__icon">
                      {item.icon === 'home' ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9,22 9,12 15,12 15,22" />
                        </svg>
                      ) : (
                        <span className="text-xs">{item.icon}</span>
                      )}
                    </span>
                  )}
                  <span>{item.name}</span>
                </button>
              ) : (
                <span
                  className={`breadcrumb__item flex items-center gap-1 ${
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {showIcon && item.icon && (
                    <span className="breadcrumb__icon">
                      {item.icon === 'home' ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9,22 9,12 15,12 15,22" />
                        </svg>
                      ) : (
                        <span className="text-xs">{item.icon}</span>
                      )}
                    </span>
                  )}
                  <span>{item.name}</span>
                </span>
              )}
              
              {/* 分隔符 */}
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
