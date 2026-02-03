/**
 * 遮罩层组件（移动端侧边栏展开时显示）
 */

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { useSidebarState } from '../../hooks/use-layout-state';

export const LayoutOverlay = memo(function LayoutOverlay() {
  const context = useLayoutContext();
  const { collapsed, toggle } = useSidebarState();

  // 是否显示遮罩
  const visible = context.props.isMobile && !collapsed;

  if (!visible) return null;

  return createPortal(
    <div
      className="layout-overlay layout-overlay--visible"
      data-state="visible"
      onClick={toggle}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />,
    document.body
  );
});
