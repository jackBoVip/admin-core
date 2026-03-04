/**
 * 功能区组件。
 * @description 用于承载侧边扩展内容，支持折叠、定位与固定底部区块。
 */

import { memo, useMemo, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { usePanelState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';

/**
 * 侧边功能区组件参数。
 * @description 定义面板主体、顶部与底部插槽输入。
 */
export interface LayoutPanelProps {
  /** 子节点列表。 */
  children?: ReactNode;
  /** 面板顶部内容，位于滚动内容区最上方。 */
  header?: ReactNode;
  /** 面板底部内容，固定显示在面板底部区域。 */
  footer?: ReactNode;
}

/**
 * 侧边功能区组件。
 * @description 根据布局计算结果确定面板位置、宽度与折叠态。
 * @param props 功能区参数。
 * @returns 功能区节点。
 */
export const LayoutPanel = memo(function LayoutPanel({ children, header, footer }: LayoutPanelProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { collapsed, width, position, toggle } = usePanelState();

  const panelConfig = context.props.panel || {};

  /**
   * 是否显示面板折叠按钮。
   */
  const showCollapseButton =
    panelConfig.collapsedButton !== false &&
    context.props.disabled?.panelCollapseButton !== true;

  /**
   * 面板样式类名集合。
   */
  const panelClassName = useMemo(() => {
    const classes = ['layout-panel', `layout-panel--${position}`];
    if (collapsed) classes.push('layout-panel--collapsed');
    return classes.join(' ');
  }, [position, collapsed]);

  /**
   * 面板容器样式。
   */
  const panelStyle = useMemo(() => {
    const style: React.CSSProperties = {
      width: `${width}px`,
      top: `${computed.headerHeight}px`,
    };
    if (position === 'left' && computed.showSidebar && !context.props.isMobile) {
      style.left = `${computed.sidebarWidth}px`;
    }
    return style;
  }, [width, computed.headerHeight, position, computed.showSidebar, computed.sidebarWidth, context.props.isMobile]);

  const collapseIconClass = useMemo(
    () =>
      `layout-panel__collapse-icon transition-transform duration-200 ${
        position === 'left'
          ? !collapsed
            ? 'rotate-180'
            : ''
          : collapsed
            ? 'rotate-180'
            : ''
      }`,
    [position, collapsed]
  );

  return (
    <aside
      className={panelClassName}
      style={panelStyle}
      data-position={position}
      data-collapsed={collapsed ? 'true' : undefined}
    >
      <div className="layout-panel__inner flex h-full flex-col">
        {/* 内容 */}
        <div className="layout-panel__content layout-scroll-container flex-1 overflow-y-auto overflow-x-hidden p-4">
          {header && <div className="layout-panel__header-content mb-3">{header}</div>}
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div className="layout-panel__footer shrink-0 border-t border-border px-4 py-3">
            {footer}
          </div>
        )}
      </div>

      {/* 折叠按钮（附着在靠内容区一侧边框） */}
      {showCollapseButton && (
        <button
          type="button"
          className="layout-panel__collapse-btn"
          title={
            collapsed
              ? context.t('layout.panel.expand')
              : context.t('layout.panel.collapse')
          }
          aria-label={
            collapsed
              ? context.t('layout.panel.expand')
              : context.t('layout.panel.collapse')
          }
          onClick={toggle}
        >
          {renderLayoutIcon('panel-collapse', 'sm', collapseIconClass)}
        </button>
      )}
    </aside>
  );
});
