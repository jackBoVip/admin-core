/**
 * 页脚组件
 */

import { memo, useMemo, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useSidebarState } from '../../hooks/use-layout-state';

export interface LayoutFooterProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export const LayoutFooter = memo(function LayoutFooter({ left, center, right }: LayoutFooterProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { collapsed: sidebarCollapsed } = useSidebarState();

  const footerConfig = context.props.footer || {};
  const copyrightConfig = context.props.copyright || {};

  // 类名
  const footerClassName = useMemo(() => [
    'layout-footer',
    footerConfig.fixed && 'layout-footer--fixed',
    computed.showSidebar && !context.props.isMobile && 'layout-footer--with-sidebar',
    sidebarCollapsed && !context.props.isMobile && 'layout-footer--collapsed',
  ]
    .filter(Boolean)
    .join(' '), [footerConfig.fixed, computed.showSidebar, context.props.isMobile, sidebarCollapsed]);

  // 样式
  const footerStyle = useMemo(() => ({
    height: `${computed.footerHeight}px`,
    left:
      footerConfig.fixed && computed.showSidebar && !context.props.isMobile
        ? `${computed.sidebarWidth}px`
        : '0',
  }), [computed.footerHeight, footerConfig.fixed, computed.showSidebar, context.props.isMobile, computed.sidebarWidth]);

  return (
    <footer className={footerClassName} style={footerStyle}>
      <div className="layout-footer__inner flex h-full items-center justify-between px-4">
        {/* 左侧 */}
        <div className="layout-footer__left">{left}</div>

        {/* 中间 - 版权信息 */}
        <div className="layout-footer__center flex items-center gap-4 text-sm text-gray-500">
          {center ||
            (copyrightConfig.enable && (
              <>
                {copyrightConfig.date && <span>© {copyrightConfig.date}</span>}
                {copyrightConfig.companyName && (
                  <a
                    href={copyrightConfig.companySiteLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {copyrightConfig.companyName}
                  </a>
                )}
                {copyrightConfig.icp && (
                  <a
                    href={copyrightConfig.icpLink || 'https://beian.miit.gov.cn/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {copyrightConfig.icp}
                  </a>
                )}
              </>
            ))}
        </div>

        {/* 右侧 */}
        <div className="layout-footer__right">{right}</div>
      </div>
    </footer>
  );
});
