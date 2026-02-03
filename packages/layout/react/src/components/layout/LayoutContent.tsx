/**
 * 内容区组件
 */

import { memo, useMemo, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useSidebarState, usePanelState } from '../../hooks/use-layout-state';
import { DEFAULT_CONTENT_CONFIG } from '@admin-core/layout';

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
  const { collapsed: sidebarCollapsed } = useSidebarState();
  const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();

  const contentCompact = context.props.contentCompact || DEFAULT_CONTENT_CONFIG.contentCompact;
  const contentCompactWidth = context.props.contentCompactWidth || DEFAULT_CONTENT_CONFIG.contentCompactWidth;

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
  const contentStyle = useMemo(() => ({
    marginLeft: computed.mainStyle.marginLeft,
    marginRight: computed.mainStyle.marginRight,
    marginTop: computed.mainStyle.marginTop,
    paddingTop: `${context.props.contentPaddingTop ?? context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding}px`,
    paddingBottom: `${context.props.contentPaddingBottom ?? context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding}px`,
    paddingLeft: `${context.props.contentPaddingLeft ?? context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding}px`,
    paddingRight: `${context.props.contentPaddingRight ?? context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding}px`,
  }), [computed.mainStyle, context.props.contentPaddingTop, context.props.contentPaddingBottom, context.props.contentPaddingLeft, context.props.contentPaddingRight, context.props.contentPadding]);

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
        {children}
      </div>

      {/* 内容底部 */}
      {footer && <div className="layout-content__footer mt-4">{footer}</div>}

      {/* 内容遮罩层 */}
      {overlay && <div className="layout-content__overlay">{overlay}</div>}
    </main>
  );
});
