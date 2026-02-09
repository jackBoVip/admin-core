/**
 * 内容区组件
 */

import { DEFAULT_CONTENT_CONFIG } from '@admin-core/layout';
import { cloneElement, isValidElement, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed, useLayoutState } from '../../hooks';
import { usePanelState, useSidebarState, useTabsState } from '../../hooks/use-layout-state';
import { LayoutRefreshView } from './LayoutRefreshView';

export interface LayoutContentProps {
  children?: ReactNode;
  header?: ReactNode;
  breadcrumb?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
}

export const LayoutContent = memo(function LayoutContent({
  children,
  header,
  breadcrumb,
  footer,
  overlay,
}: LayoutContentProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [layoutState] = useLayoutState();
  const { collapsed: sidebarCollapsed } = useSidebarState();
  const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();
  const { tabs, activeKey } = useTabsState();

  const contentCompact = context.props.contentCompact || DEFAULT_CONTENT_CONFIG.contentCompact;
  const contentCompactWidth = context.props.contentCompactWidth || DEFAULT_CONTENT_CONFIG.contentCompactWidth;
  const keepAliveEnabled = context.props.tabbar?.keepAlive !== false;
  const routerLocation = context.props.router?.location;
  const keepAliveAvailable = keepAliveEnabled && !!routerLocation;
  const footerOffset =
    computed.showFooter && context.props.footer?.fixed
      ? computed.footerHeight
      : 0;

  const cacheRef = useRef(new Map<string, { element: ReactNode; refreshKey: number }>());
  const [, forceUpdate] = useState(0);
  const childrenRef = useRef(children);
  const routerLocationRef = useRef(routerLocation);

  // 更新 refs
  useEffect(() => {
    childrenRef.current = children;
    routerLocationRef.current = routerLocation;
  }, [children, routerLocation]);

  const buildCachedElement = useCallback((key: string, refreshKey: number) => {
    let element: ReactNode = childrenRef.current;
    const currentRouterLocation = routerLocationRef.current;
    if (currentRouterLocation && isValidElement(element) && typeof element.type !== 'string') {
      element = cloneElement(element as ReactElement<Record<string, unknown>>, { location: currentRouterLocation } as Record<string, unknown>);
    }
    return <div key={`${key}:${refreshKey}`}>{element}</div>;
  }, []);

  useEffect(() => {
    if (!keepAliveAvailable) {
      cacheRef.current.clear();
      forceUpdate((val) => val + 1);
      return;
    }
    if (!activeKey) return;
    const refreshKey = layoutState.refreshKey;
    const existing = cacheRef.current.get(activeKey);
    if (!existing || existing.refreshKey !== refreshKey) {
      cacheRef.current.set(activeKey, {
        element: buildCachedElement(activeKey, refreshKey),
        refreshKey,
      });
      forceUpdate((val) => val + 1);
    }
  }, [activeKey, keepAliveAvailable, layoutState.refreshKey, buildCachedElement]);

  useEffect(() => {
    if (!keepAliveAvailable) return;
    const keys = new Set(tabs.map((tab) => tab.key));
    let changed = false;
    cacheRef.current.forEach((_, key) => {
      if (!keys.has(key)) {
        cacheRef.current.delete(key);
        changed = true;
      }
    });
    if (changed) {
      forceUpdate((val) => val + 1);
    }
  }, [tabs, keepAliveAvailable]);

  // 类名
  const contentClassName = useMemo(() => {
    const classes = ['layout-content'];
    if (contentCompact === 'compact') classes.push('layout-content--compact');
    if (sidebarCollapsed && !context.props.isMobile) classes.push('layout-content--collapsed');
    if (computed.showPanel) {
      classes.push('layout-content--with-panel');
      if (panelPosition === 'left') classes.push('layout-content--panel-left');
      if (panelPosition === 'right') classes.push('layout-content--panel-right');
    }
    if (panelCollapsed) classes.push('layout-content--panel-collapsed');
    return classes.join(' ');
  }, [contentCompact, sidebarCollapsed, context.props.isMobile, computed.showPanel, panelPosition, panelCollapsed]);

  // 样式
  const contentStyle = useMemo(() => {
    const paddingBase = context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding;
    const paddingBottom =
      (context.props.contentPaddingBottom ?? paddingBase) + footerOffset;

    return {
      marginLeft: computed.mainStyle.marginLeft,
      marginRight: computed.mainStyle.marginRight,
      marginTop: computed.mainStyle.marginTop,
      paddingTop: `${context.props.contentPaddingTop ?? paddingBase}px`,
      paddingBottom: `${paddingBottom}px`,
      paddingLeft: `${context.props.contentPaddingLeft ?? paddingBase}px`,
      paddingRight: `${context.props.contentPaddingRight ?? paddingBase}px`,
    };
  }, [
    computed.mainStyle,
    context.props.contentPaddingTop,
    context.props.contentPaddingBottom,
    context.props.contentPaddingLeft,
    context.props.contentPaddingRight,
    context.props.contentPadding,
    footerOffset,
  ]);

  // 内容容器样式
  const innerStyle = useMemo(() =>
    contentCompact === 'compact'
      ? {
          maxWidth: `${contentCompactWidth}px`,
          margin: '0 auto',
        }
      : {}, [contentCompact, contentCompactWidth]);

  return (
    <main
      className={contentClassName}
      style={contentStyle}
      data-compact={contentCompact === 'compact' ? 'true' : undefined}
      data-collapsed={sidebarCollapsed && !context.props.isMobile ? 'true' : undefined}
      data-with-panel={computed.showPanel ? 'true' : undefined}
      data-panel-position={computed.showPanel ? panelPosition : undefined}
      data-panel-collapsed={panelCollapsed ? 'true' : undefined}
      data-mobile={context.props.isMobile ? 'true' : undefined}
    >
      {/* 内容头部 */}
      {header && <div className="layout-content__header mb-4">{header}</div>}

      {/* 面包屑 */}
      {breadcrumb && computed.showBreadcrumb && (
        <div className="layout-content__breadcrumb mb-4">{breadcrumb}</div>
      )}

      {/* 主内容 */}
      <div className="layout-content__inner" style={innerStyle}>
        {!keepAliveAvailable || !activeKey ? (
          <LayoutRefreshView>{children}</LayoutRefreshView>
        ) : (
          Array.from(cacheRef.current.entries()).map(([key, entry]) => (
            <div key={key} style={{ display: key === activeKey ? 'block' : 'none' }}>
              {entry.element}
            </div>
          ))
        )}
      </div>

      {/* 内容底部 */}
      {footer && <div className="layout-content__footer mt-4">{footer}</div>}

      {/* 内容遮罩层 */}
      {overlay && <div className="layout-content__overlay">{overlay}</div>}
    </main>
  );
});
