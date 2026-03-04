/**
 * 遮罩层组件（移动端侧边栏展开时显示）。
 * @description 使用 Portal 渲染到 `document.body`，点击遮罩后触发侧边栏收起。
 */

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext } from '../../hooks';
import { useSidebarState } from '../../hooks/use-layout-state';

/**
 * 布局遮罩层组件。
 * @description 在移动端侧边栏展开时渲染遮罩，并支持点击关闭侧边栏。
 */
export const LayoutOverlay = memo(function LayoutOverlay() {
  const context = useLayoutContext();
  const { collapsed, toggle } = useSidebarState();
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 是否显示遮罩层。
   */
  const visible = context.props.isMobile && !collapsed;

  if (!visible || !portalTarget) return null;

  return createPortal(
    <div
      className="layout-overlay layout-overlay--visible"
      data-state="visible"
      onClick={toggle}
    />,
    portalTarget
  );
});
