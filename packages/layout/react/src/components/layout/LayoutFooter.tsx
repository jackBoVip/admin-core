/**
 * 页脚组件。
 * @description 负责渲染布局底部插槽与版权信息，并处理固定/静态布局样式。
 */

import { memo, useMemo, type ReactNode, type CSSProperties } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';

/**
 * 页脚组件插槽属性。
 * @description 支持左中右三个区域的自定义内容覆盖。
 */
export interface LayoutFooterProps {
  /** 左侧区域内容。 */
  left?: ReactNode;
  /** 中间区域内容。 */
  center?: ReactNode;
  /** 右侧区域内容。 */
  right?: ReactNode;
}

/**
 * 布局底部组件。
 * @description 渲染左右中三段 footer 插槽，并根据布局配置控制显示。
 * @param props 页脚插槽参数。
 * @returns 布局页脚节点。
 */
export const LayoutFooter = memo(function LayoutFooter({ left, center, right }: LayoutFooterProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const footerConfig = context.props.footer || {};
  const copyrightConfig = context.props.copyright || {};
  const show = !computed.isFullContent;
  const isFixed = footerConfig.fixed;

  /**
   * 页脚样式类名集合。
   */
  const footerClassName = useMemo(() => {
    const classes = ['layout-footer'];
    if (isFixed) classes.push('layout-footer--fixed');
    return classes.join(' ');
  }, [isFixed]);

  /**
   * 页脚容器样式。
   */
  const footerStyle = useMemo(() => {
    const style: CSSProperties = {
      height: `${computed.footerHeight}px`,
      marginBottom: show ? '0' : `-${computed.footerHeight}px`,
      position: isFixed ? 'fixed' : 'static',
    };

    if (isFixed) {
      style.left = computed.mainStyle.marginLeft;
      style.right = computed.mainStyle.marginRight;
    } else {
      style.marginLeft = computed.mainStyle.marginLeft;
      style.marginRight = computed.mainStyle.marginRight;
    }

    return style;
  }, [computed.footerHeight, computed.mainStyle.marginLeft, computed.mainStyle.marginRight, isFixed, show]);

  return (
    <footer
      className={footerClassName}
      style={footerStyle}
      data-fixed={isFixed ? 'true' : undefined}
    >
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
